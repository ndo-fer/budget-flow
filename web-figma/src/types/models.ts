export type TabId =
  | "home"
  | "wallets"
  | "csv-import"
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

// ── Wallet & Estimated Balance ────────────────────────────────

export type WalletType = "bank" | "ewallet" | "cash" | "other";

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  provider?: string | null;
  confirmed_balance: number;
  estimated_balance: number;
  last_confirmed_at?: string | null;
  confidence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionDirection = "in" | "out";
export type TransactionType = "expense" | "income" | "transfer_out" | "transfer_in" | "adjustment";
export type TransactionSource = "notification" | "screenshot" | "csv" | "receipt" | "manual" | "adjustment";

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  amount: number;
  direction: TransactionDirection;
  type: TransactionType;
  category?: string | null;
  merchant?: string | null;
  note?: string | null;
  source: TransactionSource;
  raw_text?: string | null;
  confidence: number;
  occurred_at: string;
  created_at: string;
  is_duplicate: boolean;
  matched_transaction_id?: string | null;
}

export interface BalanceAdjustment {
  id: string;
  user_id: string;
  wallet_id: string;
  previous_estimated_balance: number;
  new_confirmed_balance: number;
  difference: number;
  reason?: string | null;
  source: "manual" | "screenshot" | "csv";
  created_at: string;
}

export interface NotificationAllowlistItem {
  id: string;
  user_id: string;
  package_name: string;
  app_name: string;
  is_enabled: boolean;
  created_at: string;
}

// ── OCR Result ────────────────────────────────────────────────

export interface BalanceOcrResult {
  walletCandidate?: string;
  balanceCandidate?: number;
  confidence: number;
  rawText: string;
  capturedAt: string;
}

export interface ReceiptOcrResult {
  merchant?: string;
  totalAmount?: number;
  transactionDate?: string;
  paymentMethod?: string;
  items: Array<{ name: string; price?: number }>;
  confidence: number;
  rawText: string;
}

// ── CSV Import ────────────────────────────────────────────────

export interface CsvColumnMapping {
  date: string;
  description: string;
  amount: string;
  direction?: string;
  balance?: string;
  category?: string;
}

export interface CsvImportPreview {
  total: number;
  newCount: number;
  duplicateCount: number;
  reviewCount: number;
  transactions: Partial<WalletTransaction>[];
}

// ── Pattern Analysis ──────────────────────────────────────────

export interface SpendingPattern {
  dailyBurnRate: number;
  weeklyTrend: number;
  categoryBreakdown: Array<{ category: string; amount: number; percent: number }>;
  topMerchants: Array<{ merchant: string; count: number; total: number }>;
  qrisFrequency: number;
  qrisTotal: number;
  recurringTransactions: Array<{ merchant: string; amount: number; frequency: string }>;
  overspendingDays: string[];
  safeToSpendUntilPayday: number;
  unusualAlerts: string[];
}

// ── Safe-to-Spend ─────────────────────────────────────────────

export interface SafeToSpend {
  totalEstimatedBalance: number;
  lockedMoney: number;
  upcomingBills: number;
  availableMoney: number;
  daysUntilNextIncome: number;
  safeToSpendPerDay: number;
  todaySpent: number;
  safeToSpendToday: number;
  isOverDailyLimit: boolean;
  overAmount: number;
}
