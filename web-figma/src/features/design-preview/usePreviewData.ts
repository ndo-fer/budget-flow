/**
 * usePreviewData.ts
 * Fetches real Supabase data for the V2 dark design preview.
 * Accepts a `month` string (YYYY-MM) so tabs can share a single month selector.
 * Returns a `refresh()` function so modals can trigger a reload after mutations.
 */
import { useState, useEffect, useCallback } from "react";
import { getWallets } from "../../services/walletService";
import { getExpensesByMonth } from "../../services/expenseService";
import { getIncomeTransactions, getIncomeSummary, getIncomeSources, getIncomeBySource } from "../../services/incomeService";
import { getCategories } from "../../services/categoryService";
import { getRecurringExpenses } from "../../services/recurringService";
import { calculateSafeToSpend } from "../../services/safeToSpendService";
import { getCurrentMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

export interface PreviewData {
  wallets: any[];
  expenses: any[];
  incomeTransactions: any[];
  incomeSources: any[];
  incomeBySource: any[];
  recurringExpenses: any[];
  categories: any[];
  summary: { totalIncome: number; totalExpenses: number; savings: number };
  safeToSpend: any | null;
  totalBalance: number;
  currentMonth: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const makeEmpty = (month: string): Omit<PreviewData, "refresh"> => ({
  wallets: [],
  expenses: [],
  incomeTransactions: [],
  incomeSources: [],
  incomeBySource: [],
  recurringExpenses: [],
  categories: [],
  summary: { totalIncome: 0, totalExpenses: 0, savings: 0 },
  safeToSpend: null,
  totalBalance: 0,
  currentMonth: month,
  loading: true,
  error: null,
});

export function usePreviewData(month?: string): PreviewData {
  const activeMonth = month || getCurrentMonth();
  const [data, setData] = useState<Omit<PreviewData, "refresh">>(() => makeEmpty(activeMonth));
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setData((prev) => ({ ...prev, loading: true, error: null, currentMonth: activeMonth }));

    Promise.all([
      getWallets().catch(() => []),
      getExpensesByMonth(activeMonth).catch(() => []),
      getIncomeTransactions(activeMonth).catch(() => []),
      getCategories().catch(() => []),
      getIncomeSummary(activeMonth).catch(() => ({
        totalIncome: 0, totalExpenses: 0, savings: 0,
        savingsRate: 0, transactionCount: 0, expenseCount: 0,
      })),
      calculateSafeToSpend().catch(() => null),
      getIncomeSources().catch(() => []),
      getIncomeBySource(activeMonth).catch(() => []),
      getRecurringExpenses().catch(() => []),
    ]).then(([
      wallets,
      expenses,
      incomeTransactions,
      categories,
      summary,
      safeToSpend,
      incomeSources,
      incomeBySource,
      recurringExpenses
    ]) => {
      if (cancelled) return;
      const totalBalance = (wallets as any[]).reduce((s: number, w: any) => s + w.estimated_balance, 0);
      setData({
        wallets: wallets as any[],
        expenses: expenses as any[],
        incomeTransactions: incomeTransactions as any[],
        categories: categories as any[],
        incomeSources: incomeSources as any[],
        incomeBySource: incomeBySource as any[],
        recurringExpenses: recurringExpenses as any[],
        summary: {
          totalIncome: summary.totalIncome,
          totalExpenses: summary.totalExpenses,
          savings: summary.savings,
        },
        safeToSpend,
        totalBalance,
        currentMonth: activeMonth,
        loading: false,
        error: null,
      });
    }).catch((err) => {
      if (cancelled) return;
      setData((prev) => ({ ...prev, loading: false, error: err?.message || "Gagal memuat data" }));
    });

    return () => { cancelled = true; };
  }, [activeMonth, tick]);

  return { ...data, refresh };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Assign Slush-system colors to a category based on index or user-set color */
const SLOT_COLORS = [
  { fill: "#fb4903", bg: "rgba(251,73,3,0.12)", border: "rgba(251,73,3,0.2)" },
  { fill: "#4da2ff", bg: "rgba(77,162,255,0.12)", border: "rgba(77,162,255,0.2)" },
  { fill: "#ffd731", bg: "rgba(255,215,49,0.12)", border: "rgba(255,215,49,0.2)" },
  { fill: "#55db9c", bg: "rgba(85,219,156,0.12)", border: "rgba(85,219,156,0.2)" },
  { fill: "#9c8bf9", bg: "rgba(156,139,249,0.12)", border: "rgba(156,139,249,0.2)" },
  { fill: "#5c4ade", bg: "rgba(92,74,222,0.12)", border: "rgba(92,74,222,0.2)" },
  { fill: "#fb4903", bg: "rgba(251,73,3,0.12)", border: "rgba(251,73,3,0.2)" },
  { fill: "#ffd731", bg: "rgba(255,215,49,0.12)", border: "rgba(255,215,49,0.2)" },
];

export function getCatColor(index: number, userColor?: string) {
  if (userColor && userColor !== "#FF6B6B") {
    const r = parseInt(userColor.slice(1, 3), 16);
    const g = parseInt(userColor.slice(3, 5), 16);
    const b = parseInt(userColor.slice(5, 7), 16);
    return {
      fill: userColor,
      bg: `rgba(${r},${g},${b},0.12)`,
      border: `rgba(${r},${g},${b},0.2)`,
    };
  }
  return SLOT_COLORS[index % SLOT_COLORS.length];
}

/** Wallet gradient by index */
const WALLET_GRADIENTS = [
  { g: "linear-gradient(135deg,#1c6cff,#0d4bbf)", glow: "rgba(28,108,255,0.35)" },
  { g: "linear-gradient(135deg,#00cc4b,#009938)", glow: "rgba(0,204,75,0.3)" },
  { g: "linear-gradient(135deg,#9019e6,#6b0db5)", glow: "rgba(144,25,230,0.3)" },
  { g: "linear-gradient(135deg,#fece4c,#d4a800)", glow: "rgba(254,206,76,0.3)" },
  { g: "linear-gradient(135deg,#ff4433,#cc2211)", glow: "rgba(255,68,51,0.3)" },
  { g: "linear-gradient(135deg,#4da2ff,#1c6cff)", glow: "rgba(77,162,255,0.25)" },
];

export function getWalletStyle(index: number) {
  return WALLET_GRADIENTS[index % WALLET_GRADIENTS.length];
}

/** Format rupiah — delegates to shared formatCurrency utility */
export const rp = (amount: number) => formatCurrency(amount);

/** Format date nicely */
export function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Hari ini, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  if (d.toDateString() === yesterday.toDateString()) return `Kemarin, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + `, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Format month label like "Mei 2026" */
export function fmtMonth(ym: string) {
  const [year, month] = ym.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/** Navigate month: direction = +1 (next) or -1 (prev) */
export function offsetMonth(ym: string, direction: number): string {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month - 1 + direction, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Group transactions by day label */
export function groupByDay(transactions: any[]) {
  const groups: { title: string; txs: any[] }[] = [];
  const today = new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

  const map = new Map<string, { title: string; txs: any[] }>();

  for (const tx of transactions) {
    const d = new Date(tx.occurred_at);
    const key = d.toDateString();
    let title: string;
    if (key === today) title = "Hari ini";
    else if (key === yesterday.toDateString()) title = "Kemarin";
    else title = d.toLocaleDateString("id-ID", { day: "numeric", month: "long" });

    if (!map.has(key)) { map.set(key, { title, txs: [] }); groups.push(map.get(key)!); }
    map.get(key)!.txs.push(tx);
  }

  return groups;
}
