import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";

const normalizeName = (value: string) => value.trim().toLowerCase();

const ensureUniqueCategoryName = async (userId: string, name: string, excludeCategoryId?: string) => {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const duplicate = (data || []).find(
    (category) => normalizeName(category.name) === normalizeName(name) && category.id !== excludeCategoryId,
  );

  if (duplicate) {
    throw new Error("Category name already exists");
  }
};

export const getCategories = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("budget_categories")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const getCategoryCount = async () => {
  const userId = await getCurrentUserId();
  const { count, error } = await supabase
    .from("budget_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return count || 0;
};

export const createCategory = async (name: string, budgetAmount: number, color = "#FF6B6B", priority = 3, excludeFromDailyStreak = false) => {
  const userId = await getCurrentUserId();
  await ensureUniqueCategoryName(userId, name);
  const { data, error } = await supabase
    .from("budget_categories")
    .insert([{ user_id: userId, name, budget_amount: budgetAmount, color, priority, exclude_from_daily_streak: excludeFromDailyStreak }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateCategory = async (
  categoryId: string,
  updates: Partial<{ name: string; budget_amount: number; color: string; priority: number; exclude_from_daily_streak: boolean }>,
) => {
  const userId = await getCurrentUserId();

  if (updates.name) {
    await ensureUniqueCategoryName(userId, updates.name, categoryId);
  }

  const { data, error } = await supabase
    .from("budget_categories")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteCategory = async (categoryId: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("budget_categories")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", categoryId);

  if (error) {
    throw error;
  }
};
