export type TabId =
  | "home"
  | "budget"
  | "income"
  | "history"
  | "recurring"
  | "analytics"
  | "settings";

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  budget_amount: number;
  priority?: number;
  is_active?: boolean;
}

export interface ExpenseRecord {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  category_id: string;
  recurring_expense_id?: string | null;
  budget_categories?: BudgetCategory | null;
}

export interface MonthlyPlan {
  id: string;
  month: string;
  income: number;
}

export interface IncomeSource {
  id: string;
  source_name: string;
  amount: number;
  frequency: string;
  is_active?: boolean;
}

export interface IncomeTransaction {
  id: string;
  income_source_id: string;
  amount: number;
  date: string;
  notes?: string | null;
  income_sources?: Pick<IncomeSource, "source_name" | "frequency"> | null;
}

export interface RecurringExpense {
  id: string;
  category_id: string;
  amount: number;
  note?: string | null;
  frequency: "daily" | "weekly" | "monthly";
  day_of_month?: number | null;
  start_date: string;
  end_date?: string | null;
  is_active?: boolean;
  budget_categories?: BudgetCategory | null;
}

export interface BudgetComparisonItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  utilization: number;
  status: "over" | "under" | "on-track";
  transactionCount: number;
}

export interface AlertStatus {
  income?: number;
  totalSpending?: number;
  remaining?: number;
  percentUsed?: number;
  isOverBudget?: boolean;
  alertLevel?: "safe" | "info" | "warning" | "danger";
  categoryName?: string;
  categoryColor?: string;
  budget?: number;
  spending?: number;
}
