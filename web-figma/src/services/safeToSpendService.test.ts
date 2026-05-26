import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase to avoid WebSocket constructor errors in Node environment
vi.mock("../lib/supabase", () => {
  return {
    default: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      },
    },
  };
});

// Mock Capacitor core
vi.mock("@capacitor/core", () => {
  return {
    Capacitor: {
      isNativePlatform: vi.fn(() => false),
    },
    registerPlugin: vi.fn(() => ({
      updateWidgetData: vi.fn(() => Promise.resolve()),
    })),
  };
});

// Mock localStorage for Node test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value.toString();
  }),
  clear: vi.fn(() => {
    for (const k in store) {
      delete store[k];
    }
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  })
};
global.localStorage = localStorageMock as any;

import { getDaysUntilNextIncome } from "./safeToSpendService";

describe("safeToSpendService", () => {
  describe("getDaysUntilNextIncome", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      localStorage.clear();
    });

    afterEach(() => {
      vi.useRealTimers();
      localStorage.clear();
    });

    it("defaults to the 25th of the month and calculates correct days remaining before payday", () => {
      // Set local system time to May 20, 2026
      const mockDate = new Date("2026-05-20T10:00:00");
      vi.setSystemTime(mockDate);

      // Payday defaults to May 25, 2026. Remaining: 20 -> 25 is 5 days.
      expect(getDaysUntilNextIncome("2026-05")).toBe(5);
    });

    it("returns 1 day if today is exactly the payday", () => {
      // Set local system time to May 25, 2026
      const mockDate = new Date("2026-05-25T14:00:00");
      vi.setSystemTime(mockDate);

      expect(getDaysUntilNextIncome("2026-05")).toBe(1);
    });

    it("rolls over to next month's payday if today is past the current month's payday", () => {
      // Set local system time to May 26, 2026 (past May 25)
      const mockDate = new Date("2026-05-26T09:00:00");
      vi.setSystemTime(mockDate);

      // Next payday is June 25, 2026. Difference: May 26 to June 25 is 30 days.
      expect(getDaysUntilNextIncome("2026-05")).toBe(30);
    });

    it("respects custom payday configured in localStorage", () => {
      localStorage.setItem("bf_payday_day_of_month", "10");

      // Set local system time to May 5, 2026
      const mockDate = new Date("2026-05-05T09:00:00");
      vi.setSystemTime(mockDate);

      // Custom payday is May 10, 2026. Remaining: 5 -> 10 is 5 days.
      expect(getDaysUntilNextIncome("2026-05")).toBe(5);
    });
  });
});
