import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getIncomeSources = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createIncomeSource = async (sourceData: { source_name: string; amount: number; frequency: string }) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("income_sources")
    .insert([{ ...sourceData, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateIncomeSource = async (
  id: string,
  sourceData: Partial<{ source_name: string; amount: number; frequency: string }>,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("income_sources")
    .update({ ...sourceData, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteIncomeSource = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("income_sources")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
};

export const getIncomeTransactions = async (month: string) => {
  const userId = await getCurrentUserId();
  const { startDate, endDate } = getMonthDateRange(month);
  const { data, error } = await supabase
    .from("income_transactions")
    .select(`
      *,
      income_sources (
        source_name,
        frequency
      )
    `)
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const recordIncomeTransaction = async (transactionData: {
  income_source_id: string;
  amount: number;
  date: string;
  notes?: string;
}) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("income_transactions")
    .insert([{ ...transactionData, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateIncomeTransaction = async (
  id: string,
  transactionData: Partial<{ income_source_id: string; amount: number; date: string; notes: string }>,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("income_transactions")
    .update({ ...transactionData, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteIncomeTransaction = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("income_transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
};

export const getIncomeSummary = async (month: string) => {
  const userId = await getCurrentUserId();
  const { startDate, endDate } = getMonthDateRange(month);
  const { data: transactions, error: txError } = await supabase
    .from("income_transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (txError) throw txError;

  const { data: expenses, error: expenseError } = await supabase
    .from("daily_expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (expenseError) throw expenseError;

  const totalIncome = (transactions || []).reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = (expenses || []).reduce((sum, item) => sum + item.amount, 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    transactionCount: transactions?.length || 0,
    expenseCount: expenses?.length || 0,
  };
};

export const getIncomeBySource = async (month: string) => {
  const { startDate, endDate } = getMonthDateRange(month);
  const [sources, transactions] = await Promise.all([getIncomeSources(), getIncomeTransactions(month)]);

  return sources
    .map((source) => {
      const sourceTransactions = transactions.filter((item) => item.income_source_id === source.id);
      const actualAmount = sourceTransactions.reduce((sum, item) => sum + item.amount, 0);

      return {
        sourceId: source.id,
        sourceName: source.source_name,
        frequency: source.frequency,
        plannedAmount: source.amount,
        actualAmount,
        transactionCount: sourceTransactions.length,
        variance: actualAmount - source.amount,
        rangeStart: startDate,
        rangeEnd: endDate,
      };
    })
    .filter((source) => source.actualAmount > 0 || source.frequency === "monthly");
};
