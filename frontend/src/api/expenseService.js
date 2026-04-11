// src/api/expenseService.js
import supabase from './supabase';

// Get user's expenses for specific date
export const getExpensesByDate = async (date) => {
  try {
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
      .gte('date', `${month}-01`)
      .lt('date', `${month.substring(0, 7)}-32`)
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
    const { data, error } = await supabase
      .from('daily_expenses')
      .insert([
        {
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

// Delete expense
export const deleteExpense = async (expenseId) => {
  try {
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
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
    .gte('date', startDate)  
    .lte('date', endDate)  
    .ilike('note', `%${searchTerm}%`)  
    .order('date', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};
