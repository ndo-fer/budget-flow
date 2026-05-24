import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getIncomeSources = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from("income_sources")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching income sources:", err);
    throw err;
  }
};

export const createIncomeSource = async (sourceData: any) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("income_sources")
      .insert([{ ...sourceData, user_id: userId }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error creating income source:", err);
    throw err;
  }
};

export const updateIncomeSource = async (id: string | number, sourceData: any) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("income_sources")
      .update({
        ...sourceData,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating income source:", err);
    throw err;
  }
};

export const deleteIncomeSource = async (id: string | number) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("income_sources")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting income source:", err);
    throw err;
  }
};

export const getIncomeTransactions = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(`
        *,
        income_sources (
          source_name,
          frequency
        )
      `)
      .eq("user_id", userId)
      .eq("type", "income")
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((tx) => ({
      ...tx,
      date: tx.occurred_at.split("T")[0],
    }));
  } catch (err) {
    console.error("Error fetching income transactions:", err);
    throw err;
  }
};

export const recordIncomeTransaction = async (transactionData: any) => {
  try {
    const userId = await getCurrentUserId();
    const payload = {
      user_id: userId,
      income_source_id: transactionData.income_source_id,
      amount: transactionData.amount,
      wallet_id: transactionData.wallet_id || null,
      occurred_at: transactionData.date ? `${transactionData.date}T12:00:00Z` : new Date().toISOString(),
      note: transactionData.note || null,
      type: "income",
      direction: "in",
      source: "manual",
      confidence: 1.0,
    };

    const { error } = await supabase.from("wallet_transactions").insert([payload]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error recording income transaction:", err);
    throw err;
  }
};

export const updateIncomeTransaction = async (id: string, transactionData: any) => {
  try {
    const userId = await getCurrentUserId();
    const payload: any = {};

    if (transactionData.income_source_id !== undefined) {
      payload.income_source_id = transactionData.income_source_id;
    }
    if (transactionData.amount !== undefined) {
      payload.amount = transactionData.amount;
    }
    if (transactionData.wallet_id !== undefined) {
      payload.wallet_id = transactionData.wallet_id || null;
    }
    if (transactionData.date !== undefined) {
      payload.occurred_at = `${transactionData.date}T12:00:00Z`;
    }
    if (transactionData.note !== undefined) {
      payload.note = transactionData.note || null;
    }

    const { error } = await supabase
      .from("wallet_transactions")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating income transaction:", err);
    throw err;
  }
};

export const deleteIncomeTransaction = async (id: string) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("wallet_transactions")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting income transaction:", err);
    throw err;
  }
};

export const getIncomeSummary = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);

    // Get incomes from wallet_transactions (type = 'income')
    const { data: transactions } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "income")
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`);

    const totalIncome = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // Get expenses from wallet_transactions (type = 'expense')
    const { data: expenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`);

    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

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
  } catch (err) {
    console.error("Error getting income summary:", err);
    throw err;
  }
};

export const getIncomeBySource = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);

    const { data: sources } = await supabase
      .from("income_sources")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    const { data: transactions } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "income")
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`);

    const activeSources = sources || [];
    const incomeBySource = activeSources.map((source) => {
      const sourceTransactions =
        transactions?.filter((t) => t.income_source_id === source.id) || [];

      const amount = sourceTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        sourceId: source.id,
        sourceName: source.source_name,
        frequency: source.frequency,
        plannedAmount: source.amount,
        actualAmount: amount,
        transactionCount: sourceTransactions.length,
        variance: amount - source.amount,
      };
    });

    return incomeBySource.filter((s) => s.actualAmount > 0 || s.frequency === "monthly");
  } catch (err) {
    console.error("Error getting income by source:", err);
    throw err;
  }
};
