import supabase from "../lib/supabase";
import { getMonthDateRange } from "../utils/date";
import { getCurrentUserId } from "./queryUtils";

export const getRecurringExpenses = async () => {
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
};

export const createRecurringExpense = async (expenseData: Record<string, unknown>) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert([{ ...expenseData, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRecurringExpense = async (id: string, expenseData: Record<string, unknown>) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .update({ ...expenseData, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRecurringExpense = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
};

const isRecurringExpenseGenerated = async (
  date: string,
  categoryId: string,
  amount: number,
  note: string,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("daily_expenses")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("category_id", categoryId)
    .eq("amount", amount)
    .eq("note", note)
    .limit(1);

  if (error) throw error;
  return Boolean(data && data.length > 0);
};

export const generateMonthlyRecurringExpenses = async (month: string) => {
  const userId = await getCurrentUserId();
  const { endDate } = getMonthDateRange(month);
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .lte("start_date", endDate)
    .or(`end_date.is.null,end_date.gte.${month}-01`);

  if (error) throw error;

  const generated: Array<Record<string, unknown>> = [];
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  (data || []).forEach((recurring) => {
    if (recurring.frequency === "monthly") {
      const day = recurring.day_of_month || 1;
      if (day <= daysInMonth) {
        generated.push({
          date: `${month}-${String(day).padStart(2, "0")}`,
          category_id: recurring.category_id,
          amount: recurring.amount,
          note: recurring.note || "[Recurring] Monthly",
        });
      }
    }
  });

  return generated;
};

export const syncRecurringExpensesForMonth = async (month: string) => {
  const userId = await getCurrentUserId();
  const generated = await generateMonthlyRecurringExpenses(month);
  let count = 0;

  for (const expense of generated) {
    const exists = await isRecurringExpenseGenerated(
      String(expense.date),
      String(expense.category_id),
      Number(expense.amount),
      String(expense.note || ""),
    );
    if (!exists) {
      const { error } = await supabase.from("daily_expenses").insert([
        {
          user_id: userId,
          date: expense.date,
          category_id: expense.category_id,
          amount: expense.amount,
          note: expense.note,
        },
      ]);

      if (!error) {
        count += 1;
      }
    }
  }

  return count;
};
