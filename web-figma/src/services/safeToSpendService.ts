/**
 * safeToSpendService.ts
 *
 * Calculates how much the user can safely spend today based on:
 *   available_money = total_estimated_balance - locked_money - upcoming_bills
 *   safe_to_spend_per_day = available_money / days_until_next_income
 *   safe_to_spend_today = safe_to_spend_per_day - today_spent
 */

import { getWallets } from "./walletService";
import { getTodayWalletSpending } from "./walletTransactionService";
import { getRecurringExpenses } from "./recurringService";
import { getCurrentMonth } from "../utils/date";
import type { SafeToSpend } from "../types/models";
import { Capacitor, registerPlugin } from "@capacitor/core";

interface WidgetDataPayload {
  saldo: string;
  limitHarian: string;
  saldoRaw: number;
  limitHarianRaw: number;
  isOverDailyLimit: boolean;
  overAmount: number;
  streak: number;
}

interface WidgetDataPlugin {
  updateWidgetData(options: WidgetDataPayload): Promise<void>;
}

const WidgetData = registerPlugin<WidgetDataPlugin>("WidgetData");

export const updateAndroidWidget = (
  availableMoney: number,
  safeToSpendToday: number,
  isOverDailyLimit: boolean,
  overAmount: number,
  streak: number = 0,
) => {
  if (Capacitor.isNativePlatform()) {
    const formattedSaldo = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(availableMoney);

    const formattedLimit = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(safeToSpendToday);

    WidgetData.updateWidgetData({
      saldo: formattedSaldo,
      limitHarian: formattedLimit,
      saldoRaw: Math.round(availableMoney),
      limitHarianRaw: Math.round(safeToSpendToday),
      isOverDailyLimit,
      overAmount: Math.round(overAmount),
      streak,
    }).catch((err: any) => console.warn("Failed to update Android widget:", err));
  }
};

/**
 * Calculates days until next income (payday).
 * Uses the income plan's next expected date.
 * Falls back to end of month if no plan.
 */
export const getDaysUntilNextIncome = (month: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, mon] = month.split("-").map(Number);

  let paydayDay = 25;
  let useEndOfMonth = false;
  try {
    const stored = localStorage.getItem("bf_payday_day_of_month");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
        paydayDay = parsed;
      }
    } else {
      // Default to 25th of the month to match the edit modal UI default
      paydayDay = 25;
      useEndOfMonth = false;
    }
  } catch {
    paydayDay = 25;
    useEndOfMonth = false;
  }

  let targetDate: Date;
  if (useEndOfMonth) {
    targetDate = new Date(year, mon, 0);
  } else {
    targetDate = new Date(year, mon - 1, paydayDay);
    if (targetDate.getMonth() !== mon - 1) {
      targetDate = new Date(year, mon, 0);
    }
  }
  targetDate.setHours(0, 0, 0, 0);

  if (today.getTime() >= targetDate.getTime()) {
    if (useEndOfMonth) {
      return 1;
    } else {
      let nextMonth = mon + 1;
      let nextYear = year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
      }
      targetDate = new Date(nextYear, nextMonth - 1, paydayDay);
      if (targetDate.getMonth() !== nextMonth - 1) {
        targetDate = new Date(nextYear, nextMonth, 0);
      }
      targetDate.setHours(0, 0, 0, 0);
    }
  }

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
};

/**
 * Calculates the total amount of upcoming bills still pending this month.
 * Counts remaining daily, weekly, and monthly occurrences from tomorrow to the end of the current month.
 */
export const getUpcomingBillsThisMonth = async (): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDay = today.getDate();
  const year = today.getFullYear();
  const monthIdx = today.getMonth(); // 0-indexed
  const endOfMonth = new Date(year, monthIdx + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  try {
    const recurring = await getRecurringExpenses();
    let totalUpcoming = 0;

    for (const r of recurring) {
      if (r.is_active === false) continue;

      const startDate = new Date(r.start_date);
      startDate.setHours(0, 0, 0, 0);

      // Skip if it hasn't started yet
      if (startDate.getTime() > endOfMonth.getTime()) continue;

      // Skip if it already ended
      if (r.end_date) {
        const endDate = new Date(r.end_date);
        endDate.setHours(23, 59, 59, 999);
        if (endDate.getTime() < today.getTime()) continue;
      }

      if (r.frequency === "monthly") {
        const dueDay = r.day_of_month || 1;
        if (dueDay > todayDay) {
          const thisMonthDue = new Date(year, monthIdx, dueDay);
          if (startDate.getTime() <= thisMonthDue.getTime()) {
            totalUpcoming += r.amount;
          }
        }
      } else if (r.frequency === "weekly") {
        const targetDayOfWeek = startDate.getDay();
        let count = 0;
        const scanDate = new Date(today);
        scanDate.setDate(scanDate.getDate() + 1);

        while (scanDate.getTime() <= endOfMonth.getTime()) {
          if (scanDate.getTime() >= startDate.getTime()) {
            if (r.end_date) {
              const endDate = new Date(r.end_date);
              endDate.setHours(23, 59, 59, 999);
              if (scanDate.getTime() > endDate.getTime()) {
                break;
              }
            }

            if (scanDate.getDay() === targetDayOfWeek) {
              count++;
            }
          }
          scanDate.setDate(scanDate.getDate() + 1);
        }
        totalUpcoming += count * r.amount;
      } else if (r.frequency === "daily") {
        const startScan = new Date(today);
        startScan.setDate(startScan.getDate() + 1);

        const effectiveStart = startDate.getTime() > startScan.getTime() ? startDate : startScan;
        
        let effectiveEnd = endOfMonth;
        if (r.end_date) {
          const endDate = new Date(r.end_date);
          endDate.setHours(23, 59, 59, 999);
          if (endDate.getTime() < effectiveEnd.getTime()) {
            effectiveEnd = endDate;
          }
        }

        if (effectiveStart.getTime() <= effectiveEnd.getTime()) {
          const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
          totalUpcoming += diffDays * r.amount;
        }
      }
    }

    return totalUpcoming;
  } catch {
    return 0;
  }
};

export const calculateSafeToSpend = async (): Promise<SafeToSpend> => {
  const month = getCurrentMonth();

  const [wallets, todaySpent, upcomingBills] = await Promise.all([
    getWallets().catch(() => []),
    getTodayWalletSpending().catch(() => 0),
    getUpcomingBillsThisMonth().catch(() => 0),
  ]);

  const totalEstimatedBalance = wallets.reduce((sum, w) => sum + w.estimated_balance, 0);

  // Locked money: money we know is committed (savings targets — simplified to 0 for now)
  const lockedMoney = 0;

  const availableMoney = Math.max(totalEstimatedBalance - lockedMoney - upcomingBills, 0);

  const daysUntilNextIncome = getDaysUntilNextIncome(month);

  const safeToSpendPerDay =
    daysUntilNextIncome > 0 ? availableMoney / daysUntilNextIncome : availableMoney;

  const safeToSpendToday = Math.max(safeToSpendPerDay - todaySpent, 0);
  const isOverDailyLimit = todaySpent > safeToSpendPerDay;
  const overAmount = isOverDailyLimit ? todaySpent - safeToSpendPerDay : 0;

  // Fetch gamification streak to sync with the widget
  let currentStreak = 0;
  try {
    const { getUserGamification } = await import("./gamificationService");
    const gamification = await getUserGamification();
    currentStreak = gamification.current_streak;
  } catch (e) {
    console.warn("Failed to fetch gamification streak for widget:", e);
  }

  // Automatically update the Android widget
  updateAndroidWidget(availableMoney, safeToSpendToday, isOverDailyLimit, overAmount, currentStreak);

  return {
    totalEstimatedBalance,
    lockedMoney,
    upcomingBills,
    availableMoney,
    daysUntilNextIncome,
    safeToSpendPerDay,
    todaySpent,
    safeToSpendToday,
    isOverDailyLimit,
    overAmount,
  };
};
