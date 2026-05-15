import supabase from './supabase';
import { getMonthDateRange } from '../utils/dateUtils';
import { getCurrentUserId } from './queryUtils';

// Get user's expenses for specific date
export const getExpensesByDate = async (date) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('daily_expenses')
      .select(`
        id,
        amount,
        date,
        note,
        category_id,
        budget_categories (
          id,
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching expenses:', err);
    throw err;
  }
};

// Get all expenses for a month
export const getExpensesByMonth = async (month) => {
  try {
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);
    const { data, error } = await supabase
      .from('daily_expenses')
      .select(`
        id,
        amount,
        date,
        note,
        category_id,
        budget_categories (
          id,
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching monthly expenses:', err);
    throw err;
  }
};

// Add new expense
export const addExpense = async (categoryId, amount, date, note = '') => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('daily_expenses')
      .insert([
        {
          user_id: userId,
          category_id: categoryId,
          amount,
          date,
          note,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Error adding expense:', err);
    throw err;
  }
};

// Update existing expense
export const updateExpense = async (expenseId, updates) => {
  try {
    const userId = await getCurrentUserId();
    const payload = {};

    if (updates.categoryId !== undefined) {
      payload.category_id = updates.categoryId;
    }

    if (updates.amount !== undefined) {
      payload.amount = updates.amount;
    }

    if (updates.date !== undefined) {
      payload.date = updates.date;
    }

    if (updates.note !== undefined) {
      payload.note = updates.note;
    }

    const { data, error } = await supabase
      .from('daily_expenses')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', expenseId)
      .select(`
        id,
        amount,
        date,
        note,
        category_id,
        budget_categories (
          id,
          name,
          color
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating expense:', err);
    throw err;
  }
};

// Delete expense
export const deleteExpense = async (expenseId) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
      .eq('user_id', userId)
      .eq('id', expenseId);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting expense:', err);
    throw err;
  }
};

/**  
 * Get expenses by date range  
 */  
export const getExpensesByDateRange = async (startDate, endDate) => {  
  const userId = await getCurrentUserId();
  const { data, error } = await supabase  
    .from('daily_expenses')  
    .select(`  
      *,  
      budget_categories (  
        id,  
        name,  
        color,  
        budget_amount  
      )  
    `)  
    .eq('user_id', userId)
    .gte('date', startDate)  
    .lte('date', endDate)  
    .order('date', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};  

/**  
 * Get expenses by category ID and date range  
 */  
export const getExpensesByCategory = async (categoryId, startDate, endDate) => {  
  const userId = await getCurrentUserId();
  const { data, error } = await supabase  
    .from('daily_expenses')  
    .select(`  
      *,  
      budget_categories (  
        id,  
        name,  
        color,  
        budget_amount  
      )  
    `)  
    .eq('user_id', userId)
    .eq('category_id', categoryId)  
    .gte('date', startDate)  
    .lte('date', endDate)  
    .order('date', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};  

/**  
 * Search expenses by note  
 */  
export const searchExpenses = async (searchTerm, startDate, endDate) => {  
  const userId = await getCurrentUserId();
  const { data, error } = await supabase  
    .from('daily_expenses')  
    .select(`  
      *,  
      budget_categories (  
        id,  
        name,  
        color,  
        budget_amount  
      )  
    `)  
    .eq('user_id', userId)
    .gte('date', startDate)  
    .lte('date', endDate)  
    .ilike('note', `%${searchTerm}%`)  
    .order('date', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};

export const hasAnyExpenses = async () => {
  try {
    const userId = await getCurrentUserId();
    const { count, error } = await supabase
      .from('daily_expenses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return (count || 0) > 0;
  } catch (err) {
    console.error('Error checking expense history:', err);
    throw err;
  }
};
