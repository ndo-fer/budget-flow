import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";

export const getCurrentPlan = async (month: string) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
};

export const updatePlan = async (planId: string, updates: { income: number }) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("monthly_plans")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", planId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createPlan = async (month: string, income: number) => {
  const existing = await getCurrentPlan(month);

  if (existing) {
    return updatePlan(existing.id, { income });
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("monthly_plans")
    .insert([{ user_id: userId, month, income }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
