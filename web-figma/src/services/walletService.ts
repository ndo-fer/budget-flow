import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";
import type { Wallet, WalletType } from "../types/models";

// ── CRUD ──────────────────────────────────────────────────────

export const getWallets = async (): Promise<Wallet[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getWalletById = async (walletId: string): Promise<Wallet> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", walletId)
    .single();

  if (error) throw error;
  return data;
};

export const createWallet = async (payload: {
  name: string;
  type: WalletType;
  provider?: string;
  confirmed_balance: number;
}): Promise<Wallet> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("wallets")
    .insert([
      {
        ...payload,
        user_id: userId,
        estimated_balance: payload.confirmed_balance,
        confidence: 1.0,
        last_confirmed_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWallet = async (
  walletId: string,
  updates: Partial<Pick<Wallet, "name" | "type" | "provider" | "is_active">>,
): Promise<Wallet> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("wallets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", walletId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWallet = async (walletId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("wallets")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", walletId);

  if (error) throw error;
};

// ── Balance Adjustment (manual correction) ────────────────────

export const adjustWalletBalance = async (
  walletId: string,
  newConfirmedBalance: number,
  reason?: string,
  source: "manual" | "screenshot" | "csv" = "manual",
): Promise<void> => {
  const { error } = await supabase.rpc("adjust_wallet_balance", {
    p_wallet_id: walletId,
    p_new_balance: newConfirmedBalance,
    p_reason: reason || null,
    p_source: source,
  });

  if (error) throw error;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
  }
};

export const updateConfirmedBalance = async (
  walletId: string,
  confirmedBalance: number,
): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("wallets")
    .update({ 
      confirmed_balance: confirmedBalance,
      last_confirmed_at: new Date().toISOString(),
      confidence: 1.0,
      updated_at: new Date().toISOString() 
    })
    .eq("user_id", userId)
    .eq("id", walletId);

  if (error) throw error;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
  }
};

// ── Helpers ───────────────────────────────────────────────────

export const getTotalEstimatedBalance = async (): Promise<number> => {
  const wallets = await getWallets();
  return wallets.reduce((sum, w) => sum + w.estimated_balance, 0);
};

export const getWalletConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.95) return "Terkonfirmasi";
  if (confidence >= 0.8) return "Estimasi akurat";
  if (confidence >= 0.6) return "Estimasi kasar";
  return "Tidak yakin";
};

export const getWalletTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    bank: "Rekening Bank",
    ewallet: "E-Wallet",
    cash: "Tunai",
    other: "Lainnya",
  };
  return labels[type] || "Lainnya";
};

export const COMMON_PROVIDERS: Record<string, string[]> = {
  bank: ["BCA", "Mandiri", "BNI", "BRI", "Jago", "SeaBank", "CIMB", "Permata", "Danamon", "Maybank", "Lainnya"],
  ewallet: ["GoPay", "OVO", "ShopeePay", "Dana", "LinkAja", "Jenius", "Flip", "Lainnya"],
  cash: ["Dompet"],
  other: ["Investasi", "Tabungan Lain"],
};

export interface WalletStatus {
  dynamicConfidence: number;
  isRed: boolean;
  isYellow: boolean;
  estimatedGap: number;
  daysSinceConfirmation: number;
}

export const getWalletStatus = (wallet: any): WalletStatus => {
  const lastConfirmed = wallet.last_confirmed_at ? new Date(wallet.last_confirmed_at) : null;
  const daysSinceConfirmation = lastConfirmed 
    ? (Date.now() - lastConfirmed.getTime()) / (1000 * 60 * 60 * 24) 
    : 30;

  const estimatedGap = wallet.estimated_balance - wallet.confirmed_balance;
  
  // Base confidence starts at 1.0 (100%)
  let dynamicConfidence = 1.0;
  
  // Degrade by 5% per day after 3 days
  if (daysSinceConfirmation > 3) {
    dynamicConfidence -= (daysSinceConfirmation - 3) * 0.05;
  }
  
  // Degrade based on size of the gap (every Rp 50.000 of gap degrades by 10%)
  if (Math.abs(estimatedGap) > 0) {
    const gapDegradation = Math.min(0.5, (Math.abs(estimatedGap) / 50000) * 0.1);
    dynamicConfidence -= gapDegradation;
  }
  
  // Clamp between 0.1 and 1.0
  dynamicConfidence = Math.max(0.1, Math.min(dynamicConfidence, 1.0));
  
  const isRed = dynamicConfidence < 0.7 || daysSinceConfirmation >= 7;
  const isYellow = !isRed && (dynamicConfidence < 0.9 || daysSinceConfirmation >= 4 || Math.abs(estimatedGap) > 0);
  
  return {
    dynamicConfidence,
    isRed,
    isYellow,
    estimatedGap,
    daysSinceConfirmation: Math.floor(daysSinceConfirmation),
  };
};
