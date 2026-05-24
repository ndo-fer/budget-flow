import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getExpensesByDate = async (date: string) => {
  try {
    const userId = await getCurrentUserId();
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
      .gte("occurred_at", `${date}T00:00:00Z`)
      .lte("occurred_at", `${date}T23:59:59Z`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: tx.occurred_at.split("T")[0],
    }));
  } catch (err) {
    console.error("Error fetching expenses:", err);
    throw err;
  }
};

export const getExpensesByMonth = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);
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
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: tx.occurred_at.split("T")[0],
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
    const { data, error } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          user_id: userId,
          category_id: categoryId,
          amount,
          occurred_at: `${date}T12:00:00Z`,
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
    }
    if (updates.amount !== undefined) {
      payload.amount = updates.amount;
    }
    if (updates.date !== undefined) {
      payload.occurred_at = `${updates.date}T12:00:00Z`;
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
    return {
      ...data,
      date: data.occurred_at.split("T")[0],
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
  } catch (err) {
    console.error("Error deleting expense:", err);
    throw err;
  }
};

export const getExpensesByDateRange = async (startDate: string, endDate: string) => {
  try {
    const userId = await getCurrentUserId();
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
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: tx.occurred_at.split("T")[0],
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
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: tx.occurred_at.split("T")[0],
    }));
  } catch (err) {
    console.error("Error fetching expenses by category:", err);
    throw err;
  }
};

export const searchExpenses = async (searchTerm: string, startDate: string, endDate: string) => {
  try {
    const userId = await getCurrentUserId();
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
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`)
      .ilike("note", `%${searchTerm}%`)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: tx.occurred_at.split("T")[0],
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
