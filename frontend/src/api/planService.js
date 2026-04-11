// src/api/planService.js
import supabase from './supabase';

// Get current month plan
export const getCurrentPlan = async (monthStr) => {
  try {
    const { data, error } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('month', monthStr)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 116 = no rows
    return data ?? null;
  } catch (err) {
    console.error('Error fetching plan:', err);
    throw err;
  }
};

// Create monthly plan
export const createPlan = async (month, income) => {
  try {
    const { data, error } = await supabase
      .from('monthly_plans')
      .insert([
        {
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
    const { data, error } = await supabase
      .from('monthly_plans')
      .update(updates)
      .eq('id', planId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error updating plan:', err);
    throw err;
  }
};
