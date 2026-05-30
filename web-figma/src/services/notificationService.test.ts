import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Simple localStorage mock for node environment
class LocalStorageMock {
  private store: { [key: string]: string } = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock() as any;

// Use vi.hoisted to declare mocked functions before they are hoisted
const {
  mockSchedule,
  mockCancel,
  mockCheckPermissions,
  mockRequestPermissions,
  mockCreateChannel
} = vi.hoisted(() => ({
  mockSchedule: vi.fn(),
  mockCancel: vi.fn(),
  mockCheckPermissions: vi.fn(() => Promise.resolve({ display: "granted" })),
  mockRequestPermissions: vi.fn(() => Promise.resolve({ display: "granted" })),
  mockCreateChannel: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: mockSchedule,
    cancel: mockCancel,
    checkPermissions: mockCheckPermissions,
    requestPermissions: mockRequestPermissions,
    createChannel: mockCreateChannel,
  },
}));

import {
  notifyDailyLimitExceeded,
  syncDailyLimitPersistentNotification,
} from "./notificationService";

describe("notificationService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("notifyDailyLimitExceeded", () => {
    it("schedules a notification when daily limit is exceeded", async () => {
      const mockDate = new Date("2026-05-25T12:00:00Z");
      vi.setSystemTime(mockDate);

      await notifyDailyLimitExceeded(15000);

      expect(mockSchedule).toHaveBeenCalledTimes(1);
      const scheduled = mockSchedule.mock.calls[0][0].notifications[0];
      expect(scheduled.title).toBe("🚨 Kamu Lewat Batas Harian!");
      expect(scheduled.body).toContain("Rp 15.000");

      expect(localStorage.getItem("bf_last_daily_limit_alert")).toBe("2026-05-25");
      expect(localStorage.getItem("bf_last_daily_limit_over_amount")).toBe("15000");
    });

    it("throttles subsequent alerts on the same day if the amount did not increase significantly", async () => {
      const mockDate = new Date("2026-05-25T12:00:00Z");
      vi.setSystemTime(mockDate);

      // First alert
      await notifyDailyLimitExceeded(15000);
      expect(mockSchedule).toHaveBeenCalledTimes(1);

      // Reset mock to check if it's called again
      mockSchedule.mockClear();

      // Second alert on same day with tiny increase (+500)
      await notifyDailyLimitExceeded(15500);
      expect(mockSchedule).not.toHaveBeenCalled();

      // Third alert on same day with significant increase (+2000)
      await notifyDailyLimitExceeded(17500);
      expect(mockSchedule).toHaveBeenCalledTimes(1);
    });
  });

  describe("syncDailyLimitPersistentNotification", () => {
    it("schedules persistent notification if over limit", async () => {
      const mockDate = new Date("2026-05-25T12:00:00Z");
      vi.setSystemTime(mockDate);

      await syncDailyLimitPersistentNotification(true, 25000);

      expect(mockSchedule).toHaveBeenCalledTimes(1);
      const scheduled = mockSchedule.mock.calls[0][0].notifications[0];
      expect(scheduled.id).toBe(42001); // DAILY_LIMIT_PERSISTENT_NOTIFICATION_ID
      expect(scheduled.ongoing).toBe(true);
      expect(scheduled.body).toContain("25.000");

      expect(localStorage.getItem("bf_daily_limit_persistent_date")).toBe("2026-05-25");
    });

    it("cancels persistent notification if under limit", async () => {
      const mockDate = new Date("2026-05-25T12:00:00Z");
      vi.setSystemTime(mockDate);

      await syncDailyLimitPersistentNotification(false, 0);

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(mockCancel.mock.calls[0][0].notifications[0].id).toBe(42001);
      expect(localStorage.getItem("bf_daily_limit_persistent_date")).toBeNull();
    });
  });
});
