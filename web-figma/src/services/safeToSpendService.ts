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

const WidgetData = registerPlugin<any>("WidgetData");

export const updateAndroidWidget = (availableMoney: number, safeToSpendToday: number) => {
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

  if (today.getTime() > targetDate.getTime()) {
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
 * Uses active monthly recurring expenses whose due day hasn't passed yet.
 */
export const getUpcomingBillsThisMonth = async (): Promise<number> => {
  const today = new Date();
  const todayDay = today.getDate();

  try {
    const recurring = await getRecurringExpenses();
    return recurring
      .filter((r) => r.frequency === "monthly" && r.is_active !== false)
      .filter((r) => {
        const dueDay = r.day_of_month || 1;
        return dueDay > todayDay;
      })
      .reduce((sum, r) => sum + r.amount, 0);
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

  // Automatically update the Android widget
  updateAndroidWidget(availableMoney, safeToSpendToday);

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
