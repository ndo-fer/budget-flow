// src/api/planService.js
import supabase from './supabase';
import { getCurrentUserId } from './queryUtils';

// Get current month plan
export const getCurrentPlan = async (monthStr) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('month', String(monthStr))
      .maybeSingle();

    if (error) throw error; 
    return data ?? null;
  } catch (err) {
    console.error('Error fetching plan:', err);
    throw err;
  }
};

// Create monthly plan
export const createPlan = async (month, income) => {
  try {
    const userId = await getCurrentUserId();
    const existingPlan = await getCurrentPlan(month);

    if (existingPlan) {
      return await updatePlan(existingPlan.id, { income });
    }

    const { data, error } = await supabase
      .from('monthly_plans')
      .insert([
        {
          user_id: userId,
          month,
          income,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error creating plan:', err);
    throw err;
  }
};

// Update plan
export const updatePlan = async (planId, updates) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('monthly_plans')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', planId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error updating plan:', err);
    throw err;
  }
};
