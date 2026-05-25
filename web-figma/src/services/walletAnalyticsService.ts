/**
 * walletAnalyticsService.ts
 *
 * Pattern Analyzer berbasis WalletTransaction data.
 * Melengkapi analyticsService.ts yang pakai daily_expenses (manual).
 */

import { getWalletTransactionsByDateRange, getLastNDaysTransactions } from "./walletTransactionService";
import { getLocalMonthBounds } from "../utils/date";
import type { WalletTransaction } from "../types/models";

// ── Helpers ───────────────────────────────────────────────────

const sum = (txns: WalletTransaction[], dir: "in" | "out") =>
  txns.filter((t) => t.direction === dir).reduce((s, t) => s + t.amount, 0);

// ── QRIS analysis ─────────────────────────────────────────────

export const getQrisInsight = async (days = 7) => {
  const txns = await getLastNDaysTransactions(days);
  const qris = txns.filter(
    (t) => t.direction === "out" && (t.method?.toLowerCase?.() === "qris" || t.note?.toLowerCase?.().includes("qris") || t.raw_text?.toLowerCase?.().includes("qris")),
  );
  const total = qris.reduce((s, t) => s + t.amount, 0);
  const avg = qris.length > 0 ? Math.round(total / qris.length) : 0;

  return { count: qris.length, total, avg, days };
};

// ── Daily burn rate (last N days) ────────────────────────────

export const getDailyBurnRate = async (days = 30) => {
  const txns = await getLastNDaysTransactions(days);
  const outTotal = sum(txns, "out");
  return days > 0 ? Math.round(outTotal / days) : 0;
};

// ── Merchant frequency ────────────────────────────────────────

export const getTopMerchants = async (days = 30, limit = 5) => {
  const txns = await getLastNDaysTransactions(days);
  const map = new Map<string, { merchant: string; count: number; total: number }>();

  txns
    .filter((t) => t.direction === "out" && t.merchant)
    .forEach((t) => {
      const key = t.merchant!;
      const entry = map.get(key) || { merchant: key, count: 0, total: 0 };
      entry.count += 1;
      entry.total += t.amount;
      map.set(key, entry);
    });

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// ── Cashflow by month ────────────────────────────────────────

export const getWalletCashflow = async (month: string) => {
  const { startUtc, endUtc } = getLocalMonthBounds(month);
  const txns = await getWalletTransactionsByDateRange(startUtc, endUtc);

  const income = sum(txns, "in");
  const spending = sum(txns, "out");
  const transfers = txns.filter((t) => t.type === "transfer_in" || t.type === "transfer_out");
  const netTransfer = transfers.reduce((s, t) => s + (t.direction === "in" ? t.amount : -t.amount), 0);

  // Overspending days
  const dayMap = new Map<string, number>();
  txns
    .filter((t) => t.direction === "out")
    .forEach((t) => {
      const day = t.occurred_at.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) || 0) + t.amount);
    });

  const avgDailySpend = spending / 30;
  const overspendingDays = Array.from(dayMap.entries())
    .filter(([, amt]) => amt > avgDailySpend * 1.5)
    .map(([day]) => day);

  return {
    income,
    spending,
    netTransfer,
    transactionCount: txns.length,
    overspendingDays,
    topSourceTypes: (() => {
      const src = new Map<string, number>();
      txns.forEach((t) => src.set(t.source, (src.get(t.source) || 0) + 1));
      return Array.from(src.entries()).sort((a, b) => b[1] - a[1]);
    })(),
  };
};

// ── Recurring detection (simple) ──────────────────────────────

export const detectRecurringPatterns = async (days = 90) => {
  const txns = await getLastNDaysTransactions(days);
  const map = new Map<string, { merchant: string; amount: number; dates: string[] }>();

  txns
    .filter((t) => t.direction === "out" && t.merchant)
    .forEach((t) => {
      const key = `${t.merchant}-${Math.round(t.amount / 1000) * 1000}`;
      const entry = map.get(key) || { merchant: t.merchant!, amount: t.amount, dates: [] };
      entry.dates.push(t.occurred_at.slice(0, 10));
      map.set(key, entry);
    });

  // At least 2 occurrences = likely recurring
  return Array.from(map.values())
    .filter((e) => e.dates.length >= 2)
    .sort((a, b) => b.dates.length - a.dates.length)
    .slice(0, 8);
};
