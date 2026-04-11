// src/api/alertService.js  
import supabase from './supabase';  
import * as Notifications from 'expo-notifications';  
import { getMonthDateRange } from '../utils/dateUtils';

/**  
 * Check if user exceeded budget  
 */  
export const checkBudgetStatus = async (month) => {  
  try {  
    const { startDate, endDate } = getMonthDateRange(month);

    // Get monthly plan  
    const { data: planData } = await supabase  
      .from('monthly_plans')  
      .select('*')  
      .eq('month', month)  
      .maybeSingle();  

    if (!planData) return null;  

    const income = planData.income;  

    // Get all expenses this month  
    const { data: expenses } = await supabase  
      .from('daily_expenses')  
      .select('*')  
      .gte('date', startDate)  
      .lte('date', endDate);  

    const totalSpending = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;  
    const remaining = income - totalSpending;  
    const percentUsed = income > 0 ? (totalSpending / income) * 100 : 0;  

    return {  
      income,  
      totalSpending,  
      remaining,  
      percentUsed,  
      isOverBudget: remaining < 0,  
      alertLevel: getAlertLevel(percentUsed),  
    };  
  } catch (err) {  
    console.error('Error checking budget:', err);  
    throw err;  
  }  
};  

/**  
 * Get alert level based on usage percentage  
 */  
export const getAlertLevel = (percentUsed) => {  
  if (percentUsed >= 100) return 'danger'; // Red - Over budget  
  if (percentUsed >= 80) return 'warning'; // Orange - 80%+  
  if (percentUsed >= 50) return 'info'; // Blue - 50%+  
  return 'safe'; // Green - Under 50%  
};  

/**  
 * Check daily budget  
 */  
export const checkDailyBudget = async (date) => {  
  try {  
    const month = date.substring(0, 7);  
    const daysInMonth = new Date(month.substring(0, 4), parseInt(month.substring(5)), 0).getDate();  

    // Get monthly plan  
    const { data: planData } = await supabase  
      .from('monthly_plans')  
      .select('*')  
      .eq('month', month)  
      .maybeSingle();  

    if (!planData) return null;  

    // Daily budget = monthly income / days in month  
    const dailyBudget = planData.income / daysInMonth;  

    // Get spending today  
    const { data: todayExpenses } = await supabase  
      .from('daily_expenses')  
      .select('*')  
      .eq('date', date);  

    const todaySpending = todayExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;  
    const remaining = dailyBudget - todaySpending;  
    const percentUsed = (todaySpending / dailyBudget) * 100;  

    return {  
      dailyBudget: Math.round(dailyBudget),  
      todaySpending,  
      remaining: Math.round(remaining),  
      percentUsed,  
      isOverBudget: remaining < 0,  
      alertLevel: getAlertLevel(percentUsed),  
    };  
  } catch (err) {  
    console.error('Error checking daily budget:', err);  
    throw err;  
  }  
};  

/**  
 * Check category budget  
 */  
export const checkCategoryBudget = async (categoryId, month) => {  
  try {  
    // Get category  
    const { data: categoryData } = await supabase  
      .from('budget_categories')  
      .select('*')  
      .eq('id', categoryId)  
      .maybeSingle();  

    if (!categoryData) return null;  

    const { startDate, endDate } = getMonthDateRange(month);

    // Get category spending this month  
    const { data: expenses } = await supabase  
      .from('daily_expenses')  
      .select('*')  
      .eq('category_id', categoryId)  
      .gte('date', startDate)  
      .lte('date', endDate);  

    const spending = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;  
    const budget = categoryData.budget_amount;  
    const remaining = budget - spending;  
    const percentUsed = (spending / budget) * 100;  

    return {  
      categoryName: categoryData.name,  
      categoryColor: categoryData.color,  
      budget,  
      spending,  
      remaining: Math.round(remaining),  
      percentUsed,  
      isOverBudget: remaining < 0,  
      alertLevel: getAlertLevel(percentUsed),  
    };  
  } catch (err) {  
    console.error('Error checking category budget:', err);  
    throw err;  
  }  
};  

/**  
 * Get all categories budget status  
 */  
export const getAllCategoriesBudgetStatus = async (month) => {  
  try {  
    const { data: categories } = await supabase  
      .from('budget_categories')  
      .select('*');  

    if (!categories) return [];  

    const statuses = await Promise.all(  
      categories.map((cat) => checkCategoryBudget(cat.id, month))  
    );  

    return statuses.filter((s) => s !== null);  
  } catch (err) {  
    console.error('Error getting categories budget status:', err);  
    throw err;  
  }  
};  

/**  
 * Send notification  
 */  
export const sendAlert = async (title, body, alertLevel = 'info') => {  
  try {  
    await Notifications.scheduleNotificationAsync({  
      content: {  
        title,  
        body,  
        sound: true,  
        badge: 1,  
      },  
      trigger: null, // Send immediately  
    });  
  } catch (err) {  
    console.error('Error sending notification:', err);  
  }  
};  
