/**
 * notificationService.ts
 *
 * Handles browser notification permission, scheduling, and
 * triggering for Budget Flow's web app.
 *
 * Strategy (web-only, no server required):
 *  – requestPermission()  → ask user once
 *  – checkAndNotify()     → run on app open: budget alert +
 *                           upcoming recurring + no-input reminder
 *  – scheduleHourlyCheck()→ keeps checking while app is open
 *  – registerServiceWorker() → enables PWA + push-ready SW
 *  – tryRegisterPeriodicSync() → Chrome-only background reminder
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const STORAGE_KEY_LAST_REMINDER = "bf_last_reminder_date";
const STORAGE_KEY_LAST_BUDGET_ALERT = "bf_last_budget_alert";
const STORAGE_KEY_LAST_DAILY_LIMIT_ALERT = "bf_last_daily_limit_alert";
const STORAGE_KEY_DAILY_LIMIT_PERSISTENT_DATE = "bf_daily_limit_persistent_date";
const DAILY_LIMIT_PERSISTENT_NOTIFICATION_ID = 42001;

const ensureNativeNotificationReady = async (): Promise<boolean> => {
  try {
    await LocalNotifications.createChannel({
      id: "budget-flow-alerts",
      name: "Budget Flow Alerts",
      description: "Notifikasi penting seputar budget dan pengeluaran harian",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    const perm = await LocalNotifications.checkPermissions();
    return perm.display === "granted";
  } catch (e) {
    console.warn("[LocalNotifications] Failed to ensure channel/permission", e);
    return false;
  }
};

// ── Permission ────────────────────────────────────────────────

export const getPermissionStatus = (): NotificationPermission | "unsupported" => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Create a high-priority notification channel for Android 8.0+
      await LocalNotifications.createChannel({
        id: "budget-flow-alerts",
        name: "Budget Flow Alerts",
        description: "Notifikasi penting seputar budget dan pengeluaran harian",
        importance: 5, // High importance (heads-up pop-up alert)
        visibility: 1, // Public visibility
        vibration: true,
      });

      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted';
    } catch (e) {
      console.warn("[LocalNotifications] Failed to setup channel/permissions", e);
      return false;
    }
  }

  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
};

// ── Show notification ─────────────────────────────────────────

const showNotification = async (
  title: string,
  body: string,
  options?: { tag?: string; requireInteraction?: boolean; icon?: string },
) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const canNotify = await ensureNativeNotificationReady();
      if (!canNotify) return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000), // Random ID
            title,
            body,
            channelId: "budget-flow-alerts", // Reference Android notification channel
            schedule: { at: new Date(Date.now() + 2000) },
            sound: undefined, // Default system sound
          }
        ]
      });
      return;
    } catch (e) {
      console.warn("[Capacitor] Local notification failed", e);
    }
  }

  if (Notification.permission !== "granted") return;

  // Use service worker if available (works when tab is in background)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
      tag: options?.tag ?? "budget-flow",
      requireInteraction: options?.requireInteraction ?? false,
    });
  } else {
    new Notification(title, {
      body,
      icon: "/logo-mark.png",
      tag: options?.tag,
      requireInteraction: options?.requireInteraction,
    });
  }
};

// ── Smart check ───────────────────────────────────────────────

/**
 * Fire a native/web push notification when the user exceeds their daily
 * Safe-to-Spend limit. Deduped to once per day unless the limit is exceeded further.
 */
export const notifyDailyLimitExceeded = async (overAmount: number) => {
  const today = new Date().toISOString().slice(0, 10);
  const lastAlert = localStorage.getItem(STORAGE_KEY_LAST_DAILY_LIMIT_ALERT);
  const lastAmountStr = localStorage.getItem("bf_last_daily_limit_over_amount");
  const lastAmount = lastAmountStr ? parseFloat(lastAmountStr) : 0;

  // Allow triggering again if the amount exceeded is significantly higher than before,
  // which makes testing and real usage updates work correctly.
  if (lastAlert === today && overAmount <= lastAmount + 1000) {
    console.log("[Notification] Daily limit exceeded alert skipped: already fired for today.");
    return;
  }

  const formatted = Math.round(overAmount).toLocaleString("id-ID");
  await showNotification(
    "🚨 Kamu Lewat Batas Harian!",
    `Pengeluaran hari ini melebihi limit aman sebesar Rp ${formatted}. Kurangi pengeluaran besok ya!`,
    { tag: "daily-limit-exceeded", requireInteraction: true },
  );
  localStorage.setItem(STORAGE_KEY_LAST_DAILY_LIMIT_ALERT, today);
  localStorage.setItem("bf_last_daily_limit_over_amount", overAmount.toString());
};

const clearDailyLimitPersistentNotification = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: DAILY_LIMIT_PERSISTENT_NOTIFICATION_ID }],
    });
  } catch (e) {
    console.warn("[LocalNotifications] Failed to clear daily limit persistent notification", e);
  }
};

const upsertDailyLimitPersistentNotification = async (overAmount: number) => {
  if (!Capacitor.isNativePlatform()) return;

  const formatted = Math.round(overAmount).toLocaleString("id-ID");
  try {
    const canNotify = await ensureNativeNotificationReady();
    if (!canNotify) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_LIMIT_PERSISTENT_NOTIFICATION_ID,
          title: "🚨 Batas Harian Terlewati",
          body: `Kelebihan Rp ${formatted}. Notif ini akan tetap tampil sampai ganti hari.`,
          channelId: "budget-flow-alerts",
          schedule: { at: new Date(Date.now() + 2000) },
          ongoing: true,
          autoCancel: false,
          extra: { action: "open_history" },
        } as any,
      ],
    });
  } catch (e) {
    console.warn("[LocalNotifications] Failed to set persistent daily limit notification", e);
  }
};

export const syncDailyLimitPersistentNotification = async (
  isOverDailyLimit: boolean,
  overAmount: number,
) => {
  const today = new Date().toISOString().slice(0, 10);
  const storedDate = localStorage.getItem(STORAGE_KEY_DAILY_LIMIT_PERSISTENT_DATE);

  if (storedDate && storedDate !== today) {
    await clearDailyLimitPersistentNotification();
    localStorage.removeItem(STORAGE_KEY_DAILY_LIMIT_PERSISTENT_DATE);
  }

  if (isOverDailyLimit && overAmount > 0) {
    await upsertDailyLimitPersistentNotification(overAmount);
    localStorage.setItem(STORAGE_KEY_DAILY_LIMIT_PERSISTENT_DATE, today);
    return;
  }

  await clearDailyLimitPersistentNotification();
  localStorage.removeItem(STORAGE_KEY_DAILY_LIMIT_PERSISTENT_DATE);
};

export const checkAndNotify = async () => {
  // Allow through on native (Capacitor) or when web permission granted
  const isNative = Capacitor.isNativePlatform();
  if (!isNative && Notification.permission !== "granted") return;

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Lazy-import to avoid circular deps at module load time
    const [{ checkBudgetStatus, checkDailyBudget }, { getRecurringExpenses }, { hasAnyExpenses }] =
      await Promise.all([
        import("./alertService"),
        import("./recurringService"),
        import("./expenseService"),
      ]);

    const month = today.slice(0, 7);

    const [monthlyStatus, dailyStatus, recurring, hasExpenses] = await Promise.allSettled([
      checkBudgetStatus(month),
      checkDailyBudget(today),
      getRecurringExpenses(),
      hasAnyExpenses(),
    ]);

    // 1️⃣  Budget exceeded alert (sticky, once per day)
    const lastBudgetAlert = localStorage.getItem(STORAGE_KEY_LAST_BUDGET_ALERT);
    if (
      monthlyStatus.status === "fulfilled" &&
      monthlyStatus.value?.isOverBudget &&
      lastBudgetAlert !== today
    ) {
      const status = monthlyStatus.value;
      showNotification("⚠️ Budget Bulanan Terlewati!", `Pengeluaran sudah melebihi income bulan ini. Cek ringkasan sekarang.`, {
        tag: "budget-exceeded",
        requireInteraction: true,
      });
      localStorage.setItem(STORAGE_KEY_LAST_BUDGET_ALERT, today);
    }

    // 2️⃣  Daily Safe-to-Spend over-limit alert (via safeToSpendService)
    // Note: the primary trigger for this is notifyDailyLimitExceeded()
    // called directly from HomeScreen after calculateSafeToSpend().
    // This secondary check is a fallback for periodic runs.
    if (
      dailyStatus.status === "fulfilled" &&
      dailyStatus.value?.isOverBudget
    ) {
      const lastLimitAlert = localStorage.getItem(STORAGE_KEY_LAST_DAILY_LIMIT_ALERT);
      if (lastLimitAlert !== today) {
        showNotification("📊 Batas Harian Terlewati", `Pengeluaran hari ini sudah melewati batas aman. Hati-hati!`, {
          tag: "daily-limit-exceeded",
          requireInteraction: false,
        });
        localStorage.setItem(STORAGE_KEY_LAST_DAILY_LIMIT_ALERT, today);
      }
    }

    // 3️⃣  No-input reminder (once per day)
    const lastReminder = localStorage.getItem(STORAGE_KEY_LAST_REMINDER);
    if (lastReminder !== today) {
      const hasInput =
        hasExpenses.status === "fulfilled" && hasExpenses.value;
      if (!hasInput) {
        showNotification("💰 Belum ada catatan hari ini", "Jangan lupa input pengeluaran supaya budget-mu tetap akurat.", {
          tag: "daily-reminder",
        });
      }
      localStorage.setItem(STORAGE_KEY_LAST_REMINDER, today);
    }

    // 4️⃣  Upcoming recurring expense reminder (H-1 and H-0)
    if (recurring.status === "fulfilled") {
      const todayDate = new Date();
      const todayDay = todayDate.getDate();
      const tomorrowDay = todayDay + 1;

      const upcoming = (recurring.value || []).filter((item: any) => {
        if (item.frequency !== "monthly" || !item.day_of_month) return false;
        return item.day_of_month === todayDay || item.day_of_month === tomorrowDay;
      });

      for (const item of upcoming) {
        const isToday = item.day_of_month === todayDay;
        const label = item.budget_categories?.name ?? "Recurring expense";
        const amount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(item.amount);

        showNotification(
          isToday ? `🔔 Jatuh tempo hari ini: ${label}` : `⏰ Besok jatuh tempo: ${label}`,
          `${amount} — jangan sampai kelewatan!`,
          { tag: `recurring-${item.id}` },
        );
      }
    }
  } catch {
    // Silently fail — notifications are non-critical
  }
};

// ── Hourly scheduler (while app is open) ─────────────────────

export const scheduleHourlyCheck = (): (() => void) => {
  // Run once immediately on mount
  checkAndNotify();

  // Then every hour
  const interval = setInterval(checkAndNotify, 60 * 60 * 1000);
  return () => clearInterval(interval);
};

// ── Service Worker registration ───────────────────────────────

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[BudgetFlow] Service Worker registered:", registration.scope);
    return registration;
  } catch (err) {
    console.warn("[BudgetFlow] Service Worker registration failed:", err);
    return null;
  }
};

// ── Periodic Sync (Chrome Android only) ──────────────────────

export const tryRegisterPeriodicSync = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-expect-error – periodicSync is not in all TS libs yet
    if (!("periodicSync" in registration)) return false;

    // @ts-expect-error
    const status = await navigator.permissions.query({ name: "periodic-background-sync" });
    if (status.state !== "granted") return false;

    // @ts-expect-error
    await registration.periodicSync.register("daily-budget-reminder", {
      minInterval: 6 * 60 * 60 * 1000, // every 6 hours
    });

    return true;
  } catch {
    return false;
  }
};
