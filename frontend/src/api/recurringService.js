// src/api/recurringService.js  
import supabase from './supabase';  

/**  
 * Get all recurring expenses  
 */  
export const getRecurringExpenses = async () => {  
  const { data, error } = await supabase  
    .from('recurring_expenses')  
    .select(`  
      *,  
      budget_categories (  
        id,  
        name,  
        color,  
        budget_amount  
      )  
    `)  
    .eq('is_active', true)  
    .order('created_at', { ascending: false });  

  if (error) throw error;  
  return data || [];  
};  

/**  
 * Create recurring expense  
 */  
export const createRecurringExpense = async (expenseData) => {  
  const { error } = await supabase  
    .from('recurring_expenses')  
    .insert([expenseData]);  

  if (error) throw error;  
  return true;  
};  

/**  
 * Update recurring expense  
 */  
export const updateRecurringExpense = async (id, expenseData) => {  
  const { error } = await supabase  
    .from('recurring_expenses')  
    .update({  
      ...expenseData,  
      updated_at: new Date().toISOString(),  
    })  
    .eq('id', id);  

  if (error) throw error;  
  return true;  
};  

/**  
 * Delete recurring expense  
 */  
export const deleteRecurringExpense = async (id) => {  
  const { error } = await supabase  
    .from('recurring_expenses')  
    .update({ is_active: false })  
    .eq('id', id);  

  if (error) throw error;  
  return true;  
};  

/**  
 * Generate expenses for month based on recurring rules  
 */  
export const generateMonthlyRecurringExpenses = async (month) => {  
  try {  
    const { data: recurringExpenses, error } = await supabase  
      .from('recurring_expenses')  
      .select('*')  
      .eq('is_active', true)  
      .lte('start_date', `${month}-31`)  
      .or(`end_date.is.null,end_date.gte.${month}-01`);  

    if (error) throw error;  

    const generatedExpenses = [];  
    const [year, monthNum] = month.split('-').map(Number);  
    const daysInMonth = new Date(year, monthNum, 0).getDate();  

    recurringExpenses.forEach((recurring) => {  
      // Monthly frequency  
      if (recurring.frequency === 'monthly') {  
        const day = recurring.day_of_month || 1;  
        if (day <= daysInMonth) {  
          const date = `${month}-${String(day).padStart(2, '0')}`;  

          // Check if already exists  
          generatedExpenses.push({  
            date,  
            category_id: recurring.category_id,  
            amount: recurring.amount,  
            note: recurring.note || `[Recurring] ${recurring.note || 'Monthly'}`,  
            is_recurring: true,  
            recurring_expense_id: recurring.id,  
          });  
        }  
      }  

      // Weekly frequency  
      if (recurring.frequency === 'weekly') {  
        const startDate = new Date(recurring.start_date);  
        const firstDate = new Date(year, monthNum - 1, 1);  

        for (let d = firstDate; d.getMonth() === monthNum - 1; d.setDate(d.getDate() + 7)) {  
          // Find first occurrence and add weekly  
          if (d >= startDate && (!recurring.end_date || d <= new Date(recurring.end_date))) {  
            const dateStr = d.toISOString().split('T')[0];  
            generatedExpenses.push({  
              date: dateStr,  
              category_id: recurring.category_id,  
              amount: recurring.amount,  
              note: recurring.note || '[Recurring] Weekly',  
              is_recurring: true,  
              recurring_expense_id: recurring.id,  
            });  
          }  
        }  
      }  

      // Daily frequency  
      if (recurring.frequency === 'daily') {  
        const firstDate = new Date(year, monthNum - 1, 1);  
        for (  
          let d = new Date(firstDate);  
          d.getMonth() === monthNum - 1;  
          d.setDate(d.getDate() + 1)  
        ) {  
          if (!recurring.end_date || d <= new Date(recurring.end_date)) {  
            const dateStr = d.toISOString().split('T')[0];  
            generatedExpenses.push({  
              date: dateStr,  
              category_id: recurring.category_id,  
              amount: recurring.amount,  
              note: recurring.note || '[Recurring] Daily',  
              is_recurring: true,  
              recurring_expense_id: recurring.id,  
            });  
          }  
        }  
      }  
    });  

    return generatedExpenses;  
  } catch (err) {  
    console.error('Error generating monthly recurring expenses:', err);  
    throw err;  
  }  
};  

/**  
 * Check if expense already generated for month  
 */  
export const isRecurringExpenseGenerated = async (  
  recurringId,  
  date  
) => {  
  const { data, error } = await supabase  
    .from('daily_expenses')  
    .select('id')  
    .eq('recurring_expense_id', recurringId)  
    .eq('date', date)  
    .limit(1);  

  if (error) throw error;  
  return data && data.length > 0;  
};  

/**  
 * Batch generate all recurring expenses for month  
 */  
export const syncRecurringExpensesForMonth = async (month) => {  
  try {  
    const generated = await generateMonthlyRecurringExpenses(month);  
    let count = 0;

    // Insert to daily_expenses if not exists  
    for (const exp of generated) {  
      const exists = await isRecurringExpenseGenerated(  
        exp.recurring_expense_id,  
        exp.date  
      );  

      if (!exists) {  
        const { error } = await supabase  
          .from('daily_expenses')  
          .insert([{  
            date: exp.date,  
            category_id: exp.category_id,  
            amount: exp.amount,  
            note: exp.note,  
            recurring_expense_id: exp.recurring_expense_id,  
          }]);  

        if (error) {
            console.error('Error inserting recurring expense:', error);  
        } else {
            count++;
        }
      }  
    }  

    return count;  
  } catch (err) {  
    console.error('Error syncing recurring expenses:', err);  
    throw err;  
  }  
};
