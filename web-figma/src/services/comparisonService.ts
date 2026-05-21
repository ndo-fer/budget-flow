import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getBudgetVsActual = async (month: string) => {
  const userId = await getCurrentUserId();
  const { data: categories, error: categoryError } = await supabase
    .from("budget_categories")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name");

  if (categoryError) throw categoryError;
  if (!categories) return [];

  const { startDate, endDate } = getMonthDateRange(month);
  const { data: expenses, error: expenseError } = await supabase
    .from("daily_expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (expenseError) throw expenseError;

  return categories.map((cat) => {
    const categoryExpenses = (expenses || []).filter((item) => item.category_id === cat.id);
    const actual = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);
    const budget = cat.budget_amount;
    const variance = budget - actual;
    const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
    const utilization = budget > 0 ? (actual / budget) * 100 : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      budget,
      actual,
      variance,
      variancePercent,
      utilization,
      status: actual > budget ? "over" : variancePercent > 20 ? "under" : "on-track",
      transactionCount: categoryExpenses.length,
    };
  });
};

export const getBudgetVsActualSummary = async (month: string) => {
  const comparison = await getBudgetVsActual(month);
  const totalBudget = comparison.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = comparison.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalBudget - totalActual;
  const overBudgetCount = comparison.filter((item) => item.status === "over").length;
  const underBudgetCount = comparison.filter((item) => item.status === "under").length;
  const onTrackCount = comparison.filter((item) => item.status === "on-track").length;

  return {
    totalBudget,
    totalActual,
    totalVariance,
    utilizationPercent: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
    overBudgetCount,
    underBudgetCount,
    onTrackCount,
    totalCategories: comparison.length,
  };
};

export const getSpendingRecommendations = async (month: string) => {
  const comparison = await getBudgetVsActual(month);
  return comparison.flatMap((item) => {
    if (item.status === "over") {
      return [
        {
          type: "warning",
          category: item.categoryName,
          message: `${item.categoryName} sudah ${Math.round(item.utilization - 100)}% di atas budget.`,
        },
      ];
    }

    if (item.status === "under" && item.variancePercent > 50) {
      return [
        {
          type: "suggestion",
          category: item.categoryName,
          message: `${item.categoryName} masih jauh di bawah budget, mungkin bisa direalokasi.`,
        },
      ];
    }

    return [];
  });
};
