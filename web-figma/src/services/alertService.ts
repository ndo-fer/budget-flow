import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getAlertLevel = (percentUsed: number) => {
  if (percentUsed >= 100) return "danger";
  if (percentUsed >= 80) return "warning";
  if (percentUsed >= 50) return "info";
  return "safe";
};

export const checkBudgetStatus = async (month: string) => {
  const userId = await getCurrentUserId();
  const { startDate, endDate } = getMonthDateRange(month);
  const { data: planData, error: planError } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (planError) throw planError;
  if (!planData) return null;

  const { data: expenses, error: expenseError } = await supabase
    .from("daily_expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (expenseError) throw expenseError;

  const totalSpending = (expenses || []).reduce((sum, item) => sum + item.amount, 0);
  const remaining = planData.income - totalSpending;
  const percentUsed = planData.income > 0 ? (totalSpending / planData.income) * 100 : 0;

  return {
    income: planData.income,
    totalSpending,
    remaining,
    percentUsed,
    isOverBudget: remaining < 0,
    alertLevel: getAlertLevel(percentUsed),
  };
};

export const checkDailyBudget = async (date: string) => {
  const userId = await getCurrentUserId();
  const month = date.slice(0, 7);
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const { data: planData, error: planError } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (planError) throw planError;
  if (!planData) return null;

  const { data: expenses, error: expenseError } = await supabase
    .from("daily_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);

  if (expenseError) throw expenseError;

  const dailyBudget = planData.income / daysInMonth;
  const todaySpending = (expenses || []).reduce((sum, item) => sum + item.amount, 0);
  const remaining = dailyBudget - todaySpending;
  const percentUsed = dailyBudget > 0 ? (todaySpending / dailyBudget) * 100 : 0;

  return {
    dailyBudget: Math.round(dailyBudget),
    todaySpending,
    remaining: Math.round(remaining),
    percentUsed,
    isOverBudget: remaining < 0,
    alertLevel: getAlertLevel(percentUsed),
  };
};

export const checkCategoryBudget = async (categoryId: string, month: string) => {
  const userId = await getCurrentUserId();
  const { data: category, error: categoryError } = await supabase
    .from("budget_categories")
    .select("*")
    .eq("user_id", userId)
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) throw categoryError;
  if (!category) return null;

  const { startDate, endDate } = getMonthDateRange(month);
  const { data: expenses, error: expenseError } = await supabase
    .from("daily_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (expenseError) throw expenseError;

  const spending = (expenses || []).reduce((sum, item) => sum + item.amount, 0);
  const budget = category.budget_amount;
  const remaining = budget - spending;
  const percentUsed = budget > 0 ? (spending / budget) * 100 : 0;

  return {
    categoryName: category.name,
    categoryColor: category.color,
    budget,
    spending,
    remaining,
    percentUsed,
    isOverBudget: remaining < 0,
    alertLevel: getAlertLevel(percentUsed),
  };
};

export const getAllCategoriesBudgetStatus = async (month: string) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;

  const statuses = await Promise.all((data || []).map((category) => checkCategoryBudget(category.id, month)));
  return statuses.filter(Boolean);
};
