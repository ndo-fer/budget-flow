// src/api/categoryService.js
import supabase from './supabase';
import { getCurrentUserId } from './queryUtils';

const normalizeCategoryName = (name) => name.trim().toLowerCase();

const ensureUniqueCategoryName = async (userId, name, excludeCategoryId = null) => {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;

  const normalizedName = normalizeCategoryName(name);
  const duplicate = (data || []).find(
    (category) =>
      normalizeCategoryName(category.name) === normalizedName &&
      category.id !== excludeCategoryId
  );

  if (duplicate) {
    throw new Error('Category name already exists');
  }
};

// Get all categories for user
export const getCategories = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', userId)
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
    const userId = await getCurrentUserId();
    await ensureUniqueCategoryName(userId, name);
    const { data, error } = await supabase
      .from('budget_categories')
      .insert([
        {
          user_id: userId,
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
    const userId = await getCurrentUserId();
    if (updates.name) {
      await ensureUniqueCategoryName(userId, updates.name, categoryId);
    }
    const { data, error } = await supabase
      .from('budget_categories')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', categoryId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error updating category:', err);
    throw err;
  }
};

export const getCategoryCount = async () => {
  try {
    const userId = await getCurrentUserId();
    const { count, error } = await supabase
      .from('budget_categories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error fetching category count:', err);
    throw err;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('budget_categories')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('id', categoryId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting category:', err);
    throw err;
  }
};
