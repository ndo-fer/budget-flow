import supabase from "../lib/supabase";
import { getLocalMonthBounds } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getBudgetVsActual = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    // Get all categories with budget
    const { data: categories } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name");

    if (!categories) return [];

    const { startUtc, endUtc } = getLocalMonthBounds(month);

    // Get expenses from wallet_transactions for this month
    const { data: expenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc);

    // Calculate budget vs actual for each category
    const comparison = categories.map((cat) => {
      const categoryExpenses =
        expenses?.filter((exp) => exp.category_id === cat.id) || [];

      const actual = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      const budget = cat.budget_amount;
      const variance = budget - actual; // Positive = under budget
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
        status:
          actual > budget
            ? "over"
            : variancePercent > 20
            ? "under"
            : "on-track",
        transactionCount: categoryExpenses.length,
      };
    });

    return comparison;
  } catch (err) {
    console.error("Error getting budget vs actual:", err);
    throw err;
  }
};

export const getBudgetVsActualSummary = async (month: string) => {
  try {
    const comparison = await getBudgetVsActual(month);

    const totalBudget = comparison.reduce((sum, c) => sum + c.budget, 0);
    const totalActual = comparison.reduce((sum, c) => sum + c.actual, 0);
    const totalVariance = totalBudget - totalActual;
    const overBudgetCount = comparison.filter((c) => c.status === "over").length;
    const underBudgetCount = comparison.filter((c) => c.status === "under").length;
    const onTrackCount = comparison.filter((c) => c.status === "on-track").length;

    return {
      totalBudget,
      totalActual,
      totalVariance,
      utilizationPercent: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
      overBudgetCount,
      underBudgetCount,
      onTrackCount,
      totalCategories: comparison.length,
      topOverBudget: comparison
        .filter((c) => c.status === "over")
        .sort((a, b) => b.variance * -1 - a.variance * -1)
        .slice(0, 3),
      topUnderBudget: comparison
        .filter((c) => c.status === "under")
        .sort((a, b) => b.variance - a.variance)
        .slice(0, 3),
    };
  } catch (err) {
    console.error("Error getting budget vs actual summary:", err);
    throw err;
  }
};

export const getSpendingRecommendations = async (month: string) => {
  try {
    const comparison = await getBudgetVsActual(month);
    const recommendations: any[] = [];

    comparison.forEach((cat) => {
      if (cat.status === "over") {
        recommendations.push({
          type: "warning",
          icon: "🚨",
          category: cat.categoryName,
          message: `${cat.categoryName} is ${Math.round(
            cat.utilization - 100,
          )}% over budget (Rp ${Math.abs(cat.variance).toLocaleString("id-ID")} over)`,
          priority: "high",
        });
      } else if (cat.status === "under" && cat.variancePercent > 50) {
        recommendations.push({
          type: "suggestion",
          icon: "💡",
          category: cat.categoryName,
          message: `${cat.categoryName} is significantly under budget. Consider reallocating.`,
          priority: "low",
        });
      }
    });

    return recommendations;
  } catch (err) {
    console.error("Error getting recommendations:", err);
    throw err;
  }
};
