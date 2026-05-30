import supabase from "../lib/supabase";
import { getMonthDateRange, toLocalDateString } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

const parseLocalDate = (dateStr: string): Date => {
  const cleanDate = dateStr.split("T")[0];
  const [y, m, d] = cleanDate.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const getRecurringExpenses = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select(`
        *,
        budget_categories (
          id,
          name,
          color,
          budget_amount
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching recurring expenses:", err);
    throw err;
  }
};

export const createRecurringExpense = async (expenseData: any) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("recurring_expenses")
      .insert([{ ...expenseData, user_id: userId }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error creating recurring expense:", err);
    throw err;
  }
};

export const updateRecurringExpense = async (id: string | number, expenseData: any) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("recurring_expenses")
      .update({
        ...expenseData,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating recurring expense:", err);
    throw err;
  }
};

export const deleteRecurringExpense = async (id: string | number) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from("recurring_expenses")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting recurring expense:", err);
    throw err;
  }
};

export const generateMonthlyRecurringExpenses = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const { endDate } = getMonthDateRange(month);
    const { data: recurringExpenses, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .lte("start_date", endDate)
      .or(`end_date.is.null,end_date.gte.${month}-01`);

    if (error) throw error;

    const generatedExpenses: any[] = [];
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const expensesList = recurringExpenses || [];
    expensesList.forEach((recurring) => {
      // Monthly frequency
      if (recurring.frequency === "monthly") {
        const day = recurring.day_of_month || 1;
        if (day <= daysInMonth) {
          const date = `${month}-${String(day).padStart(2, "0")}`;

          generatedExpenses.push({
            date,
            category_id: recurring.category_id,
            amount: recurring.amount,
            note: recurring.note || `[Recurring] Monthly`,
            is_recurring: true,
            recurring_expense_id: recurring.id,
          });
        }
      }

      // Weekly frequency
      if (recurring.frequency === "weekly") {
        const startDate = parseLocalDate(recurring.start_date);
        const targetDayOfWeek = startDate.getDay(); // 0 (Sunday) to 6 (Saturday)

        // Find the first date in the target month that matches targetDayOfWeek
        let d = new Date(year, monthNum - 1, 1);
        while (d.getDay() !== targetDayOfWeek) {
          d.setDate(d.getDate() + 1);
        }

        // Loop weekly until we move out of the target month
        while (d.getMonth() === monthNum - 1) {
          if (
            d >= startDate &&
            (!recurring.end_date || d <= parseLocalDate(recurring.end_date))
          ) {
            const dateStr = toLocalDateString(d);
            generatedExpenses.push({
              date: dateStr,
              category_id: recurring.category_id,
              amount: recurring.amount,
              note: recurring.note || "[Recurring] Weekly",
              is_recurring: true,
              recurring_expense_id: recurring.id,
            });
          }
          d.setDate(d.getDate() + 7);
        }
      }

      // Daily frequency
      if (recurring.frequency === "daily") {
        const startDate = parseLocalDate(recurring.start_date);
        const firstDate = new Date(year, monthNum - 1, 1);
        for (
          let d = new Date(firstDate);
          d.getMonth() === monthNum - 1;
          d.setDate(d.getDate() + 1)
        ) {
          if (
            d >= startDate &&
            (!recurring.end_date || d <= parseLocalDate(recurring.end_date))
          ) {
            const dateStr = toLocalDateString(d);
            generatedExpenses.push({
              date: dateStr,
              category_id: recurring.category_id,
              amount: recurring.amount,
              note: recurring.note || "[Recurring] Daily",
              is_recurring: true,
              recurring_expense_id: recurring.id,
            });
          }
        }
      }
    });

    return generatedExpenses;
  } catch (err) {
    console.error("Error generating monthly recurring expenses:", err);
    throw err;
  }
};

export const isRecurringExpenseGenerated = async (recurringId: string | number, date: string) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("recurring_expense_id", recurringId)
      .gte("occurred_at", `${date}T00:00:00Z`)
      .lte("occurred_at", `${date}T23:59:59Z`)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (err) {
    console.error("Error checking if recurring expense generated:", err);
    throw err;
  }
};

export const syncRecurringExpensesForMonth = async (month: string) => {
  try {
    const userId = await getCurrentUserId();
    const generated = await generateMonthlyRecurringExpenses(month);
    if (generated.length === 0) return 0;

    const { startDate, endDate } = getMonthDateRange(month);

    // Fetch existing recurring transactions for this month in one single query
    const { data: existingTransactions, error: selectError } = await supabase
      .from("wallet_transactions")
      .select("recurring_expense_id, occurred_at")
      .eq("user_id", userId)
      .is("is_duplicate", false)
      .gte("occurred_at", `${startDate}T00:00:00Z`)
      .lte("occurred_at", `${endDate}T23:59:59Z`)
      .not("recurring_expense_id", "is", null);

    if (selectError) throw selectError;

    // Create a set of keys combining id and date for fast lookups
    const existingKeys = new Set(
      (existingTransactions || []).map((tx) => {
        const txDate = tx.occurred_at.split("T")[0];
        return `${tx.recurring_expense_id}_${txDate}`;
      })
    );

    // Filter out expenses that are already sync'd
    const toInsert = generated
      .filter((exp) => {
        const key = `${exp.recurring_expense_id}_${exp.date}`;
        return !existingKeys.has(key);
      })
      .map((exp) => ({
        user_id: userId,
        occurred_at: `${exp.date}T12:00:00Z`,
        category_id: exp.category_id,
        amount: exp.amount,
        note: exp.note,
        recurring_expense_id: exp.recurring_expense_id,
        type: "expense",
        direction: "out",
        source: "manual",
        confidence: 1.0,
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("wallet_transactions")
        .insert(toInsert);

      if (insertError) throw insertError;
    }

    return toInsert.length;
  } catch (err) {
    console.error("Error syncing recurring expenses:", err);
    throw err;
  }
};
