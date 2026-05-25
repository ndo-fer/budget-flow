import supabase from "../lib/supabase";
import { getLocalDayBounds, getLocalMonthBounds } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getAlertLevel = (percentUsed: number) => {
  if (percentUsed >= 100) return "danger"; // Red - Over budget
  if (percentUsed >= 80) return "warning"; // Orange - 80%+
  if (percentUsed >= 50) return "info"; // Blue - 50%+
  return "safe"; // Green - Under 50%
};

export const checkBudgetStatus = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc, endUtc } = getLocalMonthBounds(month);

    // Get monthly plan
    const { data: planData } = await supabase
      .from("monthly_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();

    if (!planData) return null;

    const income = planData.income;

    // Get all expenses this month from wallet_transactions
    const { data: expenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc);

    const totalSpending = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const remaining = income - totalSpending;
    const percentUsed = income > 0 ? (totalSpending / income) * 100 : 0;

    return {
      income,
      totalSpending,
      remaining,
      percentUsed,
      isOverBudget: remaining < 0,
      alertLevel: getAlertLevel(percentUsed),
    };
  } catch (err) {
    console.error("Error checking budget:", err);
    throw err;
  }
};

export const checkDailyBudget = async (date: string) => {
  try {
    const userId = await getCurrentUserId();
    const month = date.substring(0, 7);
    const [yearStr, monthStr] = month.split("-");
    const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();

    // Get monthly plan
    const { data: planData } = await supabase
      .from("monthly_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();

    if (!planData) return null;

    // Daily budget = monthly income / days in month
    const dailyBudget = planData.income / daysInMonth;

    const { startUtc, endUtc } = getLocalDayBounds(date);

    // Get spending today from wallet_transactions
    const { data: todayExpenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc);

    const todaySpending = todayExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const remaining = dailyBudget - todaySpending;
    const percentUsed = (todaySpending / dailyBudget) * 100;

    return {
      dailyBudget: Math.round(dailyBudget),
      todaySpending,
      remaining: Math.round(remaining),
      percentUsed,
      isOverBudget: remaining < 0,
      alertLevel: getAlertLevel(percentUsed),
    };
  } catch (err) {
    console.error("Error checking daily budget:", err);
    throw err;
  }
};

export const checkCategoryBudget = async (categoryId: string | number, month: string) => {
  try {
    const userId = await getCurrentUserId();
    // Get category
    const { data: categoryData } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("id", categoryId)
      .maybeSingle();

    if (!categoryData) return null;

    const { startUtc, endUtc } = getLocalMonthBounds(month);

    // Get category spending this month from wallet_transactions
    const { data: expenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc);

    const spending = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const budget = categoryData.budget_amount;
    const remaining = budget - spending;
    const percentUsed = budget > 0 ? (spending / budget) * 100 : 0;

    return {
      categoryName: categoryData.name,
      categoryColor: categoryData.color,
      budget,
      spending,
      remaining: Math.round(remaining),
      percentUsed,
      isOverBudget: remaining < 0,
      alertLevel: getAlertLevel(percentUsed),
    };
  } catch (err) {
    console.error("Error checking category budget:", err);
    throw err;
  }
};

export const getAllCategoriesBudgetStatus = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { startUtc, endUtc } = getLocalMonthBounds(month);

    // 1. Get all active categories
    const { data: categories } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!categories || categories.length === 0) return [];

    // 2. Get all transaction expenses for this month in a single query
    const { data: expenses } = await supabase
      .from("wallet_transactions")
      .select("category_id, amount")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc);

    // 3. Aggregate spending by category ID in-memory
    const spendingMap: Record<string | number, number> = {};
    if (expenses) {
      for (const exp of expenses) {
        if (exp.category_id) {
          spendingMap[exp.category_id] = (spendingMap[exp.category_id] || 0) + exp.amount;
        }
      }
    }

    // 4. Construct status list in-memory
    return categories.map((cat) => {
      const spending = spendingMap[cat.id] || 0;
      const budget = cat.budget_amount;
      const remaining = budget - spending;
      const percentUsed = budget > 0 ? (spending / budget) * 100 : 0;

      return {
        categoryName: cat.name,
        categoryColor: cat.color,
        budget,
        spending,
        remaining: Math.round(remaining),
        percentUsed,
        isOverBudget: remaining < 0,
        alertLevel: getAlertLevel(percentUsed),
      };
    });
  } catch (err) {
    console.error("Error getting categories budget status:", err);
    throw err;
  }
};

export const sendAlert = async (title: string, body: string, alertLevel = "info") => {
  try {
    console.log(`[Notification Alert - ${alertLevel}] ${title}: ${body}`);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};
