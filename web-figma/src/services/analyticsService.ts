import supabase from "../lib/supabase";
import { getDaysInMonth, getLocalMonthBounds, toLocalDateString } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

const monthlyExpensesPromises = new Map<string, Promise<any[]>>();

export const invalidateMonthlyExpensesCache = (month?: string) => {
  if (month) {
    monthlyExpensesPromises.delete(month);
  } else {
    monthlyExpensesPromises.clear();
  }
};

export const getMonthlyExpenses = (month: string) => {
  if (monthlyExpensesPromises.has(month)) {
    return monthlyExpensesPromises.get(month)!;
  }

  const promise = (async () => {
    try {
      const userId = await getCurrentUserId();
      const { startUtc, endUtc } = getLocalMonthBounds(month);
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
      console.error("Error fetching monthly expenses:", err);
      invalidateMonthlyExpensesCache(month);
      throw err;
    }
  })();

  monthlyExpensesPromises.set(month, promise);
  return promise;
};

export const calculateMonthlySummary = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const expenses = await getMonthlyExpenses(month);
    const { data: planData } = await supabase
      .from("monthly_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();

    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const income = planData?.income || 0;
    const remaining = income - totalSpending;

    return {
      income,
      totalSpending,
      remaining,
      budgetUsagePercent: income > 0 ? (totalSpending / income) * 100 : 0,
      expenseCount: expenses.length,
    };
  } catch (err) {
    console.error("Error calculating summary:", err);
    throw err;
  }
};

export const getCategoryBreakdown = async (month: string) => {
  try {
    const expenses = await getMonthlyExpenses(month);
    const breakdown: { [key: string]: any } = {};

    expenses.forEach((expense) => {
      const categoryName = expense.budget_categories?.name || "Unknown";
      const categoryColor = expense.budget_categories?.color || "#999999";

      if (!breakdown[categoryName]) {
        breakdown[categoryName] = {
          name: categoryName,
          amount: 0,
          color: categoryColor,
          count: 0,
        };
      }

      breakdown[categoryName].amount += expense.amount;
      breakdown[categoryName].count += 1;
    });

    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
  } catch (err) {
    console.error("Error getting category breakdown:", err);
    throw err;
  }
};

export const getDailySpendingTrend = async (month: string) => {
  try {
    const expenses = await getMonthlyExpenses(month);
    const dailyData: { [key: string]: number } = {};

    const daysInMonth = getDaysInMonth(month);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${month}-${String(i).padStart(2, "0")}`;
      dailyData[date] = 0;
    }

    expenses.forEach((expense) => {
      if (dailyData[expense.date] !== undefined) {
        dailyData[expense.date] += expense.amount;
      }
    });

    const data = Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount,
      day: parseInt(date.substring(8)),
    }));

    return data;
  } catch (err) {
    console.error("Error getting daily trend:", err);
    throw err;
  }
};

export const getTopCategories = async (month: string, limit = 5) => {
  try {
    const breakdown = await getCategoryBreakdown(month);
    return breakdown.slice(0, limit);
  } catch (err) {
    console.error("Error getting top categories:", err);
    throw err;
  }
};

export const getDailyAverage = async (month: string) => {
  try {
    const summary = await calculateMonthlySummary(month);
    const daysInMonth = getDaysInMonth(month);
    return daysInMonth > 0 ? Math.round(summary.totalSpending / daysInMonth) : 0;
  } catch (err) {
    console.error("Error getting daily average:", err);
    throw err;
  }
};
