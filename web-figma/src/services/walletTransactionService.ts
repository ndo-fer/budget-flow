import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";
import type { WalletTransaction, TransactionDirection, TransactionType, TransactionSource } from "../types/models";

// ── CRUD ──────────────────────────────────────────────────────

export const getWalletTransactions = async (
  walletId?: string,
  limit = 50,
): Promise<WalletTransaction[]> => {
  const userId = await getCurrentUserId();
  let query = supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_duplicate", false)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (walletId) {
    query = query.eq("wallet_id", walletId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getWalletTransactionsByDateRange = async (
  startDate: string,
  endDate: string,
  walletId?: string,
): Promise<WalletTransaction[]> => {
  const userId = await getCurrentUserId();
  let query = supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_duplicate", false)
    .gte("occurred_at", startDate)
    .lte("occurred_at", endDate)
    .order("occurred_at", { ascending: false });

  if (walletId) {
    query = query.eq("wallet_id", walletId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const addWalletTransaction = async (payload: {
  wallet_id?: string;
  amount: number;
  direction: TransactionDirection;
  type?: TransactionType;
  category?: string;
  merchant?: string;
  note?: string;
  source: TransactionSource;
  raw_text?: string;
  confidence?: number;
  occurred_at?: string;
}): Promise<WalletTransaction> => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert([
      {
        ...payload,
        user_id: userId,
        type: payload.type || (payload.direction === "in" ? "income" : "expense"),
        confidence: payload.confidence ?? 1.0,
        occurred_at: payload.occurred_at || new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addBulkWalletTransactions = async (
  transactions: Array<Partial<WalletTransaction>>,
): Promise<number> => {
  const userId = await getCurrentUserId();
  const payload = transactions.map((tx) => ({
    ...tx,
    user_id: userId,
    confidence: tx.confidence ?? 1.0,
    occurred_at: tx.occurred_at || new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert(payload)
    .select("id");

  if (error) throw error;
  return data?.length || 0;
};

export const updateWalletTransaction = async (
  txId: string,
  updates: Partial<WalletTransaction>,
): Promise<WalletTransaction> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", txId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWalletTransaction = async (txId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("wallet_transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", txId);

  if (error) throw error;
};

// ── Duplicate Detection ───────────────────────────────────────

/**
 * Returns true if a transaction with the same amount, direction, and approximate time
 * (within 5 minutes) already exists for this wallet.
 */
export const checkDuplicate = async (payload: {
  wallet_id?: string;
  amount: number;
  direction: TransactionDirection;
  occurred_at: string;
  merchant?: string;
}): Promise<boolean> => {
  const userId = await getCurrentUserId();
  const occurredAt = new Date(payload.occurred_at);
  const windowStart = new Date(occurredAt.getTime() - 5 * 60 * 1000).toISOString();
  const windowEnd = new Date(occurredAt.getTime() + 5 * 60 * 1000).toISOString();

  let query = supabase
    .from("wallet_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("amount", payload.amount)
    .eq("direction", payload.direction)
    .gte("occurred_at", windowStart)
    .lte("occurred_at", windowEnd);

  if (payload.wallet_id) {
    query = query.eq("wallet_id", payload.wallet_id);
  }

  if (payload.merchant) {
    query = query.ilike("merchant", `%${payload.merchant}%`);
  }

  const { count, error } = await query;
  if (error) return false;
  return (count || 0) > 0;
};

// ── Analytics Helpers ─────────────────────────────────────────

export const getTodayWalletSpending = async (): Promise<number> => {
  const userId = await getCurrentUserId();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("direction", "out")
    .eq("is_duplicate", false)
    .gte("occurred_at", startOfDay)
    .lt("occurred_at", endOfDay);

  if (error) return 0;
  return (data || []).reduce((sum, tx) => sum + tx.amount, 0);
};

export const getLastNDaysTransactions = async (days: number): Promise<WalletTransaction[]> => {
  const userId = await getCurrentUserId();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_duplicate", false)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return data || [];
};
