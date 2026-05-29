import supabase from "../lib/supabase";
import { getLocalDayBounds, getLocalMonthBounds, toLocalDateString } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";
import { invalidateMonthlyExpensesCache } from "./analyticsService";

export const getExpensesByDate = async (date: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc, endUtc } = getLocalDayBounds(date);
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        id,
        amount,
        occurred_at,
        note,
        category_id,
        wallet_id,
        budget_categories (
          id,
          name,
          color
        )
      `)
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: toLocalDateString(tx.occurred_at),
    }));
  } catch (err) {
    console.error("Error fetching expenses:", err);
    throw err;
  }
};

export const getExpensesByMonth = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc, endUtc } = getLocalMonthBounds(month);
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        id,
        amount,
        occurred_at,
        note,
        category_id,
        wallet_id,
        budget_categories (
          id,
          name,
          color
        )
      `)
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: toLocalDateString(tx.occurred_at),
    }));
  } catch (err) {
    console.error("Error fetching monthly expenses:", err);
    throw err;
  }
};

export const addExpense = async (
  categoryId: string | number,
  amount: number,
  date: string,
  note = "",
  walletId?: string | null,
) => {
  try {
    const userId = await getCurrentUserId();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const occurred_at = new Date(`${date}T${timeStr}`).toISOString();

    // Resolve category name for the denormalized `category` column.
    // HistoryScreen reads `category` (string) directly without a FK join,
    // so we must populate it on write to keep Riwayat in sync with analytics.
    let categoryName: string | null = null;
    if (categoryId) {
      const { data: catRow } = await supabase
        .from("budget_categories")
        .select("name")
        .eq("id", categoryId)
        .maybeSingle();
      categoryName = catRow?.name ?? null;
    }

    const { data, error } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          user_id: userId,
          category_id: categoryId,
          category: categoryName,
          amount,
          occurred_at,
          note: note || null,
          wallet_id: walletId || null,
          type: "expense",
          direction: "out",
          source: "manual",
          confidence: 1.0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    invalidateMonthlyExpensesCache(date.substring(0, 7));
    return data;
  } catch (err) {
    console.error("Error adding expense:", err);
    throw err;
  }
};

export const updateExpense = async (expenseId: string, updates: any) => {
  try {
    const userId = await getCurrentUserId();
    const payload: any = {};

    if (updates.categoryId !== undefined) {
      payload.category_id = updates.categoryId;
      // Keep denormalized `category` string in sync
      if (updates.categoryId) {
        const { data: catRow } = await supabase
          .from("budget_categories")
          .select("name")
          .eq("id", updates.categoryId)
          .maybeSingle();
        payload.category = catRow?.name ?? null;
      } else {
        payload.category = null;
      }
    }
    if (updates.amount !== undefined) {
      payload.amount = updates.amount;
    }
    if (updates.date !== undefined) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      payload.occurred_at = new Date(`${updates.date}T${timeStr}`).toISOString();
    }
    if (updates.note !== undefined) {
      payload.note = updates.note || null;
    }
    if (updates.walletId !== undefined) {
      payload.wallet_id = updates.walletId || null;
    }

    const { data, error } = await supabase
      .from("wallet_transactions")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", expenseId)
      .select(`
        id,
        amount,
        occurred_at,
        note,
        category_id,
        wallet_id,
        budget_categories (
          id,
          name,
          color
        )
      `)
      .single();

    if (error) throw error;
    if (updates.date) {
      invalidateMonthlyExpensesCache(updates.date.substring(0, 7));
    }
    invalidateMonthlyExpensesCache(toLocalDateString(data.occurred_at).substring(0, 7));
    return {
      ...data,
      date: toLocalDateString(data.occurred_at),
    };
  } catch (err) {
    console.error("Error updating expense:", err);
    throw err;
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("wallet_transactions")
      .delete()
      .eq("user_id", userId)
      .eq("id", expenseId);

    if (error) throw error;
    invalidateMonthlyExpensesCache();
  } catch (err) {
    console.error("Error deleting expense:", err);
    throw err;
  }
};

export const getExpensesByDateRange = async (startDate: string, endDate: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc } = getLocalDayBounds(startDate);
    const { endUtc } = getLocalDayBounds(endDate);

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        *,
        budget_categories (
          id,
          name,
          color,
          budget_amount
        )
      `)
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: toLocalDateString(tx.occurred_at),
    }));
  } catch (err) {
    console.error("Error fetching expenses by range:", err);
    throw err;
  }
};

export const getExpensesByCategory = async (
  categoryId: string | number,
  startDate: string,
  endDate: string,
) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc } = getLocalDayBounds(startDate);
    const { endUtc } = getLocalDayBounds(endDate);

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        *,
        budget_categories (
          id,
          name,
          color,
          budget_amount
        )
      `)
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: toLocalDateString(tx.occurred_at),
    }));
  } catch (err) {
    console.error("Error fetching expenses by category:", err);
    throw err;
  }
};

export const searchExpenses = async (searchTerm: string, startDate: string, endDate: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc } = getLocalDayBounds(startDate);
    const { endUtc } = getLocalDayBounds(endDate);

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        *,
        budget_categories (
          id,
          name,
          color,
          budget_amount
        )
      `)
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc)
      .ilike("note", `%${searchTerm}%`)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: toLocalDateString(tx.occurred_at),
    }));
  } catch (err) {
    console.error("Error searching expenses:", err);
    throw err;
  }
};

export const hasAnyExpenses = async () => {
  try {
    const userId = await getCurrentUserId();
    const { count, error } = await supabase
      .from("wallet_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "expense");

    if (error) throw error;
    return (count || 0) > 0;
  } catch (err) {
    console.error("Error checking expense history:", err);
    throw err;
  }
};
