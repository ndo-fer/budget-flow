// src/api/analyticsService.js  
import supabase from './supabase';  

/**  
 * Get all expenses untuk bulan tertentu  
 */  
export const getMonthlyExpenses = async (month) => {  
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
    .gte('date', `${month}-01`)  
    .lt('date', `${month}-32`)  
    .order('date', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};  

/**  
 * Calculate monthly summary  
 */  
export const calculateMonthlySummary = async (month) => {  
  try {  
    const expenses = await getMonthlyExpenses(month);  
    const { data: planData } = await supabase  
      .from('monthly_plans')  
      .select('*')  
      .eq('month', month)  
      .single();  

    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);  
    const income = planData?.income || 0;  
    const remaining = income - totalSpending;  

    return {  
      income,  
      totalSpending,  
      remaining,  
      budgetUsagePercent: income > 0 ? (totalSpending / income) * 100 : 0,  
      expenseCount: expenses.length,  
    };  
  } catch (err) {  
    console.error('Error calculating summary:', err);  
    throw err;  
  }  
};  

/**  
 * Get spending breakdown by category  
 */  
export const getCategoryBreakdown = async (month) => {  
  try {  
    const expenses = await getMonthlyExpenses(month);  

    const breakdown = {};  

    expenses.forEach((expense) => {  
      const categoryName = expense.budget_categories?.name || 'Unknown';  
      const categoryColor = expense.budget_categories?.color || '#999999';  

      if (!breakdown[categoryName]) {  
        breakdown[categoryName] = {  
          name: categoryName,  
          amount: 0,  
          color: categoryColor,  
          count: 0,  
        };  
      }  

      breakdown[categoryName].amount += expense.amount;  
      breakdown[categoryName].count += 1;  
    });  

    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);  
  } catch (err) {  
    console.error('Error getting category breakdown:', err);  
    throw err;  
  }  
};  

/**  
 * Get daily spending trend (last 30 days)  
 */  
export const getDailySpendingTrend = async (month) => {  
  try {  
    const expenses = await getMonthlyExpenses(month);  

    const dailyData = {};  

    // Initialize all days of month with 0  
    const daysInMonth = new Date(month.substring(0, 4), parseInt(month.substring(5)) + 1, 0).getDate();  
    for (let i = 1; i <= daysInMonth; i++) {  
      const date = `${month}-${String(i).padStart(2, '0')}`;  
      dailyData[date] = 0;  
    }  

    // Add expenses  
    expenses.forEach((expense) => {  
      if (dailyData[expense.date] !== undefined) {  
        dailyData[expense.date] += expense.amount;  
      }  
    });  

    // Convert to array format for chart  
    const data = Object.entries(dailyData).map(([date, amount]) => ({  
      date,  
      amount,  
      day: parseInt(date.substring(8)), // Extract day number  
    }));  

    return data;  
  } catch (err) {  
    console.error('Error getting daily trend:', err);  
    throw err;  
  }  
};  

/**  
 * Get top spending categories  
 */  
export const getTopCategories = async (month, limit = 5) => {  
  try {  
    const breakdown = await getCategoryBreakdown(month);  
    return breakdown.slice(0, limit);  
  } catch (err) {  
    console.error('Error getting top categories:', err);  
    throw err;  
  }  
};  

/**  
 * Get daily average spending  
 */  
export const getDailyAverage = async (month) => {  
  try {  
    const summary = await calculateMonthlySummary(month);  
    return summary.expenseCount > 0 ? Math.round(summary.totalSpending / summary.expenseCount) : 0;  
  } catch (err) {  
    console.error('Error getting daily average:', err);  
    throw err;  
  }  
};
