import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
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
    const { startDate, endDate } = getMonthDateRange(month);

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
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`);

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

    // Get spending today from wallet_transactions
    const { data: todayExpenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("occurred_at", `${date}T00:00:00Z`)
      .lte("occurred_at", `${date}T23:59:59Z`);

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

    const { startDate, endDate } = getMonthDateRange(month);

    // Get category spending this month from wallet_transactions
    const { data: expenses } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("type", "expense")
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`);

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
    const { data: categories } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!categories) return [];

    const statuses = await Promise.all(
      categories.map((cat) => checkCategoryBudget(cat.id, month)),
    );

    return statuses.filter((s) => s !== null) as any[];
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
