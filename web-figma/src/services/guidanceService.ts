import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";

export interface UserFinanceSettings {
  user_id: string;
  payday_day_of_month: number;
  currency_code: string;
  locale: string;
}

export interface UserGuidanceState {
  user_id: string;
  has_seen_home_guide: boolean;
  has_seen_record_guide: boolean;
  has_seen_wallet_guide: boolean;
  has_seen_plan_guide: boolean;
  has_seen_income_guide: boolean;
  has_seen_history_guide: boolean;
  has_seen_recurring_guide: boolean;
  starter_checklist_hidden: boolean;
  has_completed_spotlight_tour?: boolean;
  has_skipped_spotlight_tour?: boolean;
  spotlight_tour_step?: string | null;
}


export interface UserSetupStatus {
  has_wallet: boolean;
  has_income_source: boolean;
  has_budget_category: boolean;
  has_any_transaction: boolean;
  has_expense_transaction: boolean;
  has_income_transaction: boolean;
  has_recurring_expense: boolean;
  has_balance_adjustment: boolean;
  has_csv_import: boolean;
  has_receipt_scan: boolean;
  starter_checklist_hidden: boolean;
  setup_completion_percent: number;
}

// Helper to get local storage guide key
const getLocalGuideKey = (userId: string, guideKey: string) => {
  return `budget-flow:${userId}:seen-guide:${guideKey}`;
};

export const getUserFinanceSettings = async (): Promise<UserFinanceSettings> => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from("user_finance_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Sync local storage
      localStorage.setItem("bf_payday_day_of_month", String(data.payday_day_of_month));
      return data;
    }

    // Row missing, insert default
    const localPayday = localStorage.getItem("bf_payday_day_of_month") || "25";
    const paydayVal = parseInt(localPayday, 10) || 25;

    const defaultSettings = {
      user_id: userId,
      payday_day_of_month: paydayVal,
      currency_code: "IDR",
      locale: "id-ID"
    };

    const { data: inserted, error: insertError } = await supabase
      .from("user_finance_settings")
      .insert([defaultSettings])
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn("Failed to insert default user finance settings, returning client-side fallback:", insertError);
      return defaultSettings;
    }

    return inserted || defaultSettings;
  } catch (err) {
    console.warn("Error fetching user_finance_settings from DB, using localStorage fallback:", err);
    // Fallback to local storage
    const localPayday = localStorage.getItem("bf_payday_day_of_month") || "25";
    const paydayVal = parseInt(localPayday, 10) || 25;
    try {
      const userId = await getCurrentUserId();
      return {
        user_id: userId,
        payday_day_of_month: paydayVal,
        currency_code: "IDR",
        locale: "id-ID"
      };
    } catch {
      return {
        user_id: "",
        payday_day_of_month: paydayVal,
        currency_code: "IDR",
        locale: "id-ID"
      };
    }
  }
};

export const updateUserFinanceSettings = async (payday: number): Promise<boolean> => {
  // Sync to local storage immediately
  localStorage.setItem("bf_payday_day_of_month", String(payday));

  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("user_finance_settings")
      .upsert({
        user_id: userId,
        payday_day_of_month: payday,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Failed to update user_finance_settings on DB, saved to localStorage only:", err);
    return false;
  }
};

export const getUserGuidanceState = async (): Promise<UserGuidanceState> => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from("user_guidance_state")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Sync local storage
      if (data.has_completed_spotlight_tour) {
        localStorage.setItem(`budget-flow:${userId}:spotlight-completed`, "true");
      }
      if (data.has_skipped_spotlight_tour) {
        localStorage.setItem(`budget-flow:${userId}:spotlight-skipped`, "true");
      }
      if (data.spotlight_tour_step) {
        localStorage.setItem(`budget-flow:${userId}:spotlight-step`, data.spotlight_tour_step);
      }
      return data;
    }

    // Row missing, insert default
    const defaultState = {
      user_id: userId,
      has_seen_home_guide: false,
      has_seen_record_guide: false,
      has_seen_wallet_guide: false,
      has_seen_plan_guide: false,
      has_seen_income_guide: false,
      has_seen_history_guide: false,
      has_seen_recurring_guide: false,
      starter_checklist_hidden: localStorage.getItem(`budget-flow:${userId}:checklist-hidden`) === "true",
      has_completed_spotlight_tour: false,
      has_skipped_spotlight_tour: false,
      spotlight_tour_step: null
    };

    const { data: inserted, error: insertError } = await supabase
      .from("user_guidance_state")
      .insert([defaultState])
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn("Failed to insert default user guidance state, returning fallback:", insertError);
      return defaultState;
    }

    return inserted || defaultState;
  } catch (err) {
    console.warn("Error fetching user_guidance_state from DB, using local storage fallback:", err);
    try {
      const userId = await getCurrentUserId();
      return {
        user_id: userId,
        has_seen_home_guide: localStorage.getItem(getLocalGuideKey(userId, "home")) === "true",
        has_seen_record_guide: localStorage.getItem(getLocalGuideKey(userId, "record")) === "true",
        has_seen_wallet_guide: localStorage.getItem(getLocalGuideKey(userId, "wallet")) === "true",
        has_seen_plan_guide: localStorage.getItem(getLocalGuideKey(userId, "plan")) === "true",
        has_seen_income_guide: localStorage.getItem(getLocalGuideKey(userId, "income")) === "true",
        has_seen_history_guide: localStorage.getItem(getLocalGuideKey(userId, "history")) === "true",
        has_seen_recurring_guide: localStorage.getItem(getLocalGuideKey(userId, "recurring")) === "true",
        starter_checklist_hidden: localStorage.getItem(`budget-flow:${userId}:checklist-hidden`) === "true",
        has_completed_spotlight_tour: localStorage.getItem(`budget-flow:${userId}:spotlight-completed`) === "true",
        has_skipped_spotlight_tour: localStorage.getItem(`budget-flow:${userId}:spotlight-skipped`) === "true",
        spotlight_tour_step: localStorage.getItem(`budget-flow:${userId}:spotlight-step`)
      };
    } catch {
      return {
        user_id: "",
        has_seen_home_guide: false,
        has_seen_record_guide: false,
        has_seen_wallet_guide: false,
        has_seen_plan_guide: false,
        has_seen_income_guide: false,
        has_seen_history_guide: false,
        has_seen_recurring_guide: false,
        starter_checklist_hidden: false,
        has_completed_spotlight_tour: false,
        has_skipped_spotlight_tour: false,
        spotlight_tour_step: null
      };
    }
  }
};

export const markGuideSeen = async (guideKey: string): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    localStorage.setItem(getLocalGuideKey(userId, guideKey), "true");

    const { error } = await supabase.rpc("mark_guide_seen", { p_guide_key: guideKey });
    if (error) {
      // Fallback: direct table update
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (guideKey === "home") updatePayload.has_seen_home_guide = true;
      else if (guideKey === "record") updatePayload.has_seen_record_guide = true;
      else if (guideKey === "wallet") updatePayload.has_seen_wallet_guide = true;
      else if (guideKey === "plan") updatePayload.has_seen_plan_guide = true;
      else if (guideKey === "income") updatePayload.has_seen_income_guide = true;
      else if (guideKey === "history") updatePayload.has_seen_history_guide = true;
      else if (guideKey === "recurring") updatePayload.has_seen_recurring_guide = true;

      const { error: updateError } = await supabase
        .from("user_guidance_state")
        .update(updatePayload)
        .eq("user_id", userId);

      if (updateError) throw updateError;
    }
  } catch (err) {
    console.warn("Failed to mark guide as seen in database, stored locally:", err);
  }
};

export const setChecklistHidden = async (hidden: boolean): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    localStorage.setItem(`budget-flow:${userId}:checklist-hidden`, String(hidden));

    const { error } = await supabase
      .from("user_guidance_state")
      .update({ starter_checklist_hidden: hidden, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) throw error;
  } catch (err) {
    console.warn("Failed to set checklist hidden in database, stored locally:", err);
  }
};

// Client-side checklist calculation logic to act as a fail-safe and source of truth
export const getClientSetupStatus = async (): Promise<UserSetupStatus> => {
  try {
    const userId = await getCurrentUserId();

    // Perform queries in parallel
    const [
      walletsRes,
      incomeSourcesRes,
      categoriesRes,
      transactionsRes,
      recurringRes,
      adjustmentsRes
    ] = await Promise.all([
      supabase.from("wallets").select("id").eq("user_id", userId).eq("is_active", true),
      supabase.from("income_sources").select("id").eq("user_id", userId).eq("is_active", true),
      supabase.from("budget_categories").select("id, budget_amount").eq("user_id", userId).eq("is_active", true),
      supabase.from("wallet_transactions").select("type, source").eq("user_id", userId).eq("is_duplicate", false),
      supabase.from("recurring_expenses").select("id").eq("user_id", userId).eq("is_active", true),
      supabase.from("balance_adjustments").select("id").eq("user_id", userId)
    ]);

    const wallets = walletsRes.data || [];
    const incomeSources = incomeSourcesRes.data || [];
    const categories = categoriesRes.data || [];
    const transactions = transactionsRes.data || [];
    const recurring = recurringRes.data || [];
    const adjustments = adjustmentsRes.data || [];

    const has_wallet = wallets.length > 0;
    const has_income_source = incomeSources.length > 0;
    const has_budget_category = categories.some((c) => c.budget_amount > 0);
    const has_any_transaction = transactions.length > 0;
    const has_expense_transaction = transactions.some((t) => t.type === "expense");
    const has_income_transaction = transactions.some((t) => t.type === "income");
    const has_recurring_expense = recurring.length > 0;
    const has_balance_adjustment = adjustments.length > 0;
    const has_csv_import = transactions.some((t) => t.source === "csv");
    const has_receipt_scan = transactions.some((t) => t.source === "receipt");

    const localHidden = localStorage.getItem(`budget-flow:${userId}:checklist-hidden`) === "true";

    // Setup completion percent calculation (out of 5 basic setup items):
    // 1. Tambah dompet pertama
    // 2. Tambah sumber pemasukan
    // 3. Atur kategori budget
    // 4. Catat pengeluaran pertama
    // 5. Update/koreksi saldo dompet
    let completedItems = 0;
    if (has_wallet) completedItems++;
    if (has_income_source) completedItems++;
    if (has_budget_category) completedItems++;
    if (has_expense_transaction) completedItems++;
    if (has_balance_adjustment) completedItems++;

    const setup_completion_percent = Math.round((completedItems / 5) * 100);

    return {
      has_wallet,
      has_income_source,
      has_budget_category,
      has_any_transaction,
      has_expense_transaction,
      has_income_transaction,
      has_recurring_expense,
      has_balance_adjustment,
      has_csv_import,
      has_receipt_scan,
      starter_checklist_hidden: localHidden,
      setup_completion_percent
    };
  } catch (err) {
    console.error("Error calculating client setup status:", err);
    return {
      has_wallet: false,
      has_income_source: false,
      has_budget_category: false,
      has_any_transaction: false,
      has_expense_transaction: false,
      has_income_transaction: false,
      has_recurring_expense: false,
      has_balance_adjustment: false,
      has_csv_import: false,
      has_receipt_scan: false,
      starter_checklist_hidden: false,
      setup_completion_percent: 0
    };
  }
};

export const getUserSetupStatus = async (): Promise<UserSetupStatus> => {
  try {
    const { data, error } = await supabase.rpc("get_user_setup_status");
    if (error) throw error;

    // Calculate completion percent
    let completedItems = 0;
    if (data.has_wallet) completedItems++;
    if (data.has_income_source) completedItems++;
    if (data.has_budget_category) completedItems++;
    if (data.has_expense_transaction) completedItems++;
    if (data.has_balance_adjustment) completedItems++;

    const setup_completion_percent = Math.round((completedItems / 5) * 100);

    return {
      ...data,
      setup_completion_percent
    };
  } catch (err) {
    // Graceful fallback to client-side database queries
    return getClientSetupStatus();
  }
};

export const resetGuidance = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    localStorage.removeItem(getLocalGuideKey(userId, "home"));
    localStorage.removeItem(getLocalGuideKey(userId, "record"));
    localStorage.removeItem(getLocalGuideKey(userId, "wallet"));
    localStorage.removeItem(getLocalGuideKey(userId, "plan"));
    localStorage.removeItem(getLocalGuideKey(userId, "income"));
    localStorage.removeItem(getLocalGuideKey(userId, "history"));
    localStorage.removeItem(getLocalGuideKey(userId, "recurring"));
    localStorage.removeItem(`budget-flow:${userId}:checklist-hidden`);
    
    // Spotlight tour local storage reset
    localStorage.removeItem(`budget-flow:${userId}:spotlight-completed`);
    localStorage.removeItem(`budget-flow:${userId}:spotlight-skipped`);
    localStorage.removeItem(`budget-flow:${userId}:spotlight-step`);

    await supabase
      .from("user_guidance_state")
      .upsert({
        user_id: userId,
        has_seen_home_guide: false,
        has_seen_record_guide: false,
        has_seen_wallet_guide: false,
        has_seen_plan_guide: false,
        has_seen_income_guide: false,
        has_seen_history_guide: false,
        has_seen_recurring_guide: false,
        starter_checklist_hidden: false,
        has_completed_spotlight_tour: false,
        has_skipped_spotlight_tour: false,
        spotlight_tour_step: null,
        updated_at: new Date().toISOString()
      });
  } catch (err) {
    console.warn("Failed to reset guidance on database, reset locally:", err);
  }
};

export const markSpotlightTourCompleted = async (): Promise<void> => {
  const userId = await getCurrentUserId().catch(() => "");
  if (userId) {
    localStorage.setItem(`budget-flow:${userId}:spotlight-completed`, "true");
    localStorage.removeItem(`budget-flow:${userId}:spotlight-skipped`);
    localStorage.removeItem(`budget-flow:${userId}:spotlight-step`);
  }

  try {
    // Attempt RPC
    const { error: rpcError } = await supabase.rpc("mark_spotlight_tour_completed");
    if (rpcError) {
      // Fallback: Direct table update
      const { error: updateError } = await supabase
        .from("user_guidance_state")
        .update({
          has_completed_spotlight_tour: true,
          has_skipped_spotlight_tour: false,
          spotlight_tour_step: null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
  } catch (err) {
    console.warn("Failed to mark spotlight tour completed in database, stored locally:", err);
  }
};

export const markSpotlightTourSkipped = async (step: string | null): Promise<void> => {
  const userId = await getCurrentUserId().catch(() => "");
  if (userId) {
    localStorage.setItem(`budget-flow:${userId}:spotlight-skipped`, "true");
    localStorage.removeItem(`budget-flow:${userId}:spotlight-completed`);
    if (step) {
      localStorage.setItem(`budget-flow:${userId}:spotlight-step`, step);
    }
  }

  try {
    // Attempt RPC
    const { error: rpcError } = await supabase.rpc("mark_spotlight_tour_skipped", { p_step: step });
    if (rpcError) {
      // Fallback: Direct table update
      const { error: updateError } = await supabase
        .from("user_guidance_state")
        .update({
          has_completed_spotlight_tour: false,
          has_skipped_spotlight_tour: true,
          spotlight_tour_step: step,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
  } catch (err) {
    console.warn("Failed to mark spotlight tour skipped in database, stored locally:", err);
  }
};

export const saveSpotlightTourStep = async (step: string): Promise<void> => {
  const userId = await getCurrentUserId().catch(() => "");
  if (userId) {
    localStorage.setItem(`budget-flow:${userId}:spotlight-step`, step);
  }

  try {
    // Attempt RPC
    const { error: rpcError } = await supabase.rpc("save_spotlight_tour_step", { p_step: step });
    if (rpcError) {
      // Fallback: Direct table update
      const { error: updateError } = await supabase
        .from("user_guidance_state")
        .update({
          spotlight_tour_step: step,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
  } catch (err) {
    console.warn("Failed to save spotlight tour step in database, stored locally:", err);
  }
};

export const resetSpotlightTour = async (): Promise<void> => {
  const userId = await getCurrentUserId().catch(() => "");
  if (userId) {
    localStorage.removeItem(`budget-flow:${userId}:spotlight-completed`);
    localStorage.removeItem(`budget-flow:${userId}:spotlight-skipped`);
    localStorage.removeItem(`budget-flow:${userId}:spotlight-step`);
  }

  try {
    // Attempt RPC
    const { error: rpcError } = await supabase.rpc("reset_spotlight_tour");
    if (rpcError) {
      // Fallback: Direct table update
      const { error: updateError } = await supabase
        .from("user_guidance_state")
        .update({
          has_completed_spotlight_tour: false,
          has_skipped_spotlight_tour: false,
          spotlight_tour_step: null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
  } catch (err) {
    console.warn("Failed to reset spotlight tour in database, reset locally:", err);
  }
};

