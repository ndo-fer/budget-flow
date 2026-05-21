import supabase from "../lib/supabase";
import { getDaysInMonth, getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getMonthlyExpenses = async (month: string) => {
  const userId = await getCurrentUserId();
  const { startDate, endDate } = getMonthDateRange(month);
  const { data, error } = await supabase
    .from("daily_expenses")
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
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const calculateMonthlySummary = async (month: string) => {
  const userId = await getCurrentUserId();
  const expenses = await getMonthlyExpenses(month);
  const { data: planData, error } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;

  const totalSpending = expenses.reduce((sum, item) => sum + item.amount, 0);
  const income = planData?.income || 0;
  const remaining = income - totalSpending;

  return {
    income,
    totalSpending,
    remaining,
    budgetUsagePercent: income > 0 ? (totalSpending / income) * 100 : 0,
    expenseCount: expenses.length,
  };
};

export const getCategoryBreakdown = async (month: string) => {
  const expenses = await getMonthlyExpenses(month);
  const breakdown = new Map<string, { name: string; amount: number; color: string; count: number }>();

  expenses.forEach((expense) => {
    const categoryName = expense.budget_categories?.name || "Unknown";
    const entry = breakdown.get(categoryName) || {
      name: categoryName,
      amount: 0,
      color: expense.budget_categories?.color || "#999999",
      count: 0,
    };

    entry.amount += expense.amount;
    entry.count += 1;
    breakdown.set(categoryName, entry);
  });

  return Array.from(breakdown.values()).sort((a, b) => b.amount - a.amount);
};

export const getDailySpendingTrend = async (month: string) => {
  const expenses = await getMonthlyExpenses(month);
  const daysInMonth = getDaysInMonth(month);
  const dailyData: Record<string, number> = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    dailyData[date] = 0;
  }

  expenses.forEach((expense) => {
    if (dailyData[expense.date] !== undefined) {
      dailyData[expense.date] += expense.amount;
    }
  });

  return Object.entries(dailyData).map(([date, amount]) => ({
    date,
    amount,
    day: Number(date.slice(8)),
  }));
};

export const getTopCategories = async (month: string, limit = 5) => {
  const breakdown = await getCategoryBreakdown(month);
  return breakdown.slice(0, limit);
};

export const getDailyAverage = async (month: string) => {
  const summary = await calculateMonthlySummary(month);
  const days = getDaysInMonth(month);
  return days > 0 ? Math.round(summary.totalSpending / days) : 0;
};
