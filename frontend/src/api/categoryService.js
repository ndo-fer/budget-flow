// src/api/categoryService.js
import supabase from './supabase';

// Get all categories for user
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
};

// Create category
export const createCategory = async (name, budgetAmount, color = '#FF6B6B', priority = 3) => {
  try {
    const { data, error } = await supabase
      .from('budget_categories')
      .insert([
        {
          name,
          budget_amount: budgetAmount,
          color,
          priority,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error creating category:', err);
    throw err;
  }
};

// Update category
export const updateCategory = async (categoryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('budget_categories')
      .update(updates)
      .eq('id', categoryId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error updating category:', err);
    throw err;
  }
};
