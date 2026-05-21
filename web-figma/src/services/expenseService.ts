import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

const expenseSelect = `
  id,
  amount,
  date,
  note,
  category_id,
  budget_categories (
    id,
    name,
    color,
    budget_amount,
    priority
  )
`;

export const getExpensesByDate = async (date: string) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("daily_expenses")
    .select(expenseSelect)
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const getExpensesByMonth = async (month: string) => {
  const userId = await getCurrentUserId();
  const { startDate, endDate } = getMonthDateRange(month);
  const { data, error } = await supabase
    .from("daily_expenses")
    .select(expenseSelect)
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const getExpensesByDateRange = async (startDate: string, endDate: string) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("daily_expenses")
    .select(expenseSelect)
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const addExpense = async (categoryId: string, amount: number, date: string, note = "") => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("daily_expenses")
    .insert([{ user_id: userId, category_id: categoryId, amount, date, note }])
    .select(expenseSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateExpense = async (
  expenseId: string,
  updates: Partial<{ categoryId: string; amount: number; date: string; note: string }>,
) => {
  const userId = await getCurrentUserId();
  const payload: Record<string, unknown> = {};

  if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.note !== undefined) payload.note = updates.note;

  const { data, error } = await supabase
    .from("daily_expenses")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", expenseId)
    .select(expenseSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteExpense = async (expenseId: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("daily_expenses")
    .delete()
    .eq("user_id", userId)
    .eq("id", expenseId);

  if (error) {
    throw error;
  }
};

export const hasAnyExpenses = async () => {
  const userId = await getCurrentUserId();
  const { count, error } = await supabase
    .from("daily_expenses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (count || 0) > 0;
};
