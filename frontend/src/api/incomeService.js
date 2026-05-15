// src/api/incomeService.js  
import supabase from './supabase';  
import { getMonthDateRange } from '../utils/dateUtils';
import { getCurrentUserId } from './queryUtils';

/**  
 * Get all income sources  
 */  
export const getIncomeSources = async () => {  
  const userId = await getCurrentUserId();
  const { data, error } = await supabase  
    .from('income_sources')  
    .select('*')  
    .eq('user_id', userId)
    .eq('is_active', true)  
    .order('created_at', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};  

/**  
 * Create income source  
 */  
export const createIncomeSource = async (sourceData) => {  
  const userId = await getCurrentUserId();
  const { error } = await supabase  
    .from('income_sources')  
    .insert([{...sourceData, user_id: userId}]);  

  if (error) throw error;  
  return true;  
};  

/**  
 * Update income source  
 */  
export const updateIncomeSource = async (id, sourceData) => {  
  const userId = await getCurrentUserId();
  const { error } = await supabase  
    .from('income_sources')  
    .update({  
      ...sourceData,  
      updated_at: new Date().toISOString(),  
    })  
    .eq('user_id', userId)
    .eq('id', id);  

  if (error) throw error;  
  return true;  
};  

/**  
 * Delete income source  
 */  
export const deleteIncomeSource = async (id) => {  
  const userId = await getCurrentUserId();
  const { error } = await supabase  
    .from('income_sources')  
    .update({ is_active: false })  
    .eq('user_id', userId)
    .eq('id', id);  

  if (error) throw error;  
  return true;  
};  

/**  
 * Get income transactions for month  
 */  
export const getIncomeTransactions = async (month) => {  
  const userId = await getCurrentUserId();
  const { startDate, endDate } = getMonthDateRange(month);
  const { data, error } = await supabase  
    .from('income_transactions')  
    .select(`  
      *,  
      income_sources (  
        source_name,  
        frequency  
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
 * Record income transaction  
 */  
export const recordIncomeTransaction = async (transactionData) => {  
  const userId = await getCurrentUserId();
  const { error } = await supabase  
    .from('income_transactions')  
    .insert([{...transactionData, user_id: userId}]);  

  if (error) throw error;  
  return true;  
};  

/**
 * Update income transaction
 */
export const updateIncomeTransaction = async (id, transactionData) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('income_transactions')
    .update({
      ...transactionData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Delete income transaction
 */
export const deleteIncomeTransaction = async (id) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('income_transactions')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**  
 * Get income summary for month  
 */  
export const getIncomeSummary = async (month) => {  
  try {  
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);
    const { data: transactions } = await supabase  
      .from('income_transactions')  
      .select('*')  
      .eq('user_id', userId)
      .gte('date', startDate)  
      .lte('date', endDate);  

    const totalIncome = transactions?.reduce(  
      (sum, t) => sum + t.amount,  
      0  
    ) || 0;  

    // Get expenses  
    const { data: expenses } = await supabase  
      .from('daily_expenses')  
      .select('*')  
      .eq('user_id', userId)
      .gte('date', startDate)  
      .lte('date', endDate);  

    const totalExpenses = expenses?.reduce(  
      (sum, e) => sum + e.amount,  
      0  
    ) || 0;  

    const savings = totalIncome - totalExpenses;  
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;  

    return {  
      totalIncome,  
      totalExpenses,  
      savings,  
      savingsRate,  
      transactionCount: transactions?.length || 0,  
      expenseCount: expenses?.length || 0,  
    };  
  } catch (err) {  
    console.error('Error getting income summary:', err);  
    throw err;  
  }  
};  

/**  
 * Get income by source for month  
 */  
export const getIncomeBySource = async (month) => {  
  try {  
    const userId = await getCurrentUserId();
    const { startDate, endDate } = getMonthDateRange(month);

    const { data: sources } = await supabase  
      .from('income_sources')  
      .select('*')  
      .eq('user_id', userId)
      .eq('is_active', true);  

    const { data: transactions } = await supabase  
      .from('income_transactions')  
      .select('*')  
      .eq('user_id', userId)
      .gte('date', startDate)  
      .lte('date', endDate);  

    const incomeBySource = sources.map((source) => {  
      const sourceTransactions = transactions?.filter(  
        (t) => t.income_source_id === source.id  
      ) || [];  

      const amount = sourceTransactions.reduce(  
        (sum, t) => sum + t.amount,  
        0  
      );  

      return {  
        sourceId: source.id,  
        sourceName: source.source_name,  
        frequency: source.frequency,  
        plannedAmount: source.amount,  
        actualAmount: amount,  
        transactionCount: sourceTransactions.length,  
        variance: amount - source.amount,  
      };  
    });  

    return incomeBySource.filter((s) => s.actualAmount > 0 || s.frequency === 'monthly');  
  } catch (err) {  
    console.error('Error getting income by source:', err);  
    throw err;  
  }  
};
