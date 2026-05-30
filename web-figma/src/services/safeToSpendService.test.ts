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

import { getDaysUntilNextIncome, getUpcomingBillsThisMonth } from "./safeToSpendService";
import { getRecurringExpenses } from "./recurringService";

// Mock recurringService
vi.mock("./recurringService", () => {
  return {
    getRecurringExpenses: vi.fn(() => Promise.resolve([])),
  };
});

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

    it("rolls over and returns days until next payday if today is exactly the payday", () => {
      // Set local system time to May 25, 2026
      const mockDate = new Date("2026-05-25T14:00:00");
      vi.setSystemTime(mockDate);

      // Payday rolls over to June 25, 2026. May 25 to June 25 is 31 days.
      expect(getDaysUntilNextIncome("2026-05")).toBe(31);
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

  describe("getUpcomingBillsThisMonth", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("correctly evaluates monthly, weekly, and daily upcoming bills based on date bounds", async () => {
      // Mock system time to May 20, 2026 (Wednesday)
      const mockDate = new Date("2026-05-20T10:00:00");
      vi.setSystemTime(mockDate);

      const mockRecurring = [
        // Monthly bill - due on 25th (upcoming)
        {
          id: 1,
          amount: 100000,
          frequency: "monthly",
          day_of_month: 25,
          start_date: "2026-05-01",
          is_active: true,
        },
        // Monthly bill - due on 15th (already passed)
        {
          id: 2,
          amount: 50000,
          frequency: "monthly",
          day_of_month: 15,
          start_date: "2026-05-01",
          is_active: true,
        },
        // Weekly bill - starts May 1 (Friday), occurrences left in May: May 22, May 29 (2 occurrences left)
        {
          id: 3,
          amount: 30000,
          frequency: "weekly",
          start_date: "2026-05-01",
          is_active: true,
        },
        // Daily bill - 11 remaining days (May 21 to May 31)
        {
          id: 4,
          amount: 1000,
          frequency: "daily",
          start_date: "2026-05-01",
          is_active: true,
        },
        // Future bill - starts next month, should be ignored
        {
          id: 5,
          amount: 99000,
          frequency: "monthly",
          day_of_month: 28,
          start_date: "2026-06-01",
          is_active: true,
        },
        // Ended bill - ended May 10, should be ignored
        {
          id: 6,
          amount: 45000,
          frequency: "daily",
          start_date: "2026-05-01",
          end_date: "2026-05-10",
          is_active: true,
        }
      ];

      (getRecurringExpenses as any).mockResolvedValue(mockRecurring);

      const total = await getUpcomingBillsThisMonth();
      
      // Expected total:
      // Monthly 1: 100,000
      // Monthly 2: 0 (passed)
      // Weekly 3: 2 * 30,000 = 60,000
      // Daily 4: 11 * 1,000 = 11,000
      // Future 5: 0
      // Ended 6: 0
      // Total = 171,000
      expect(total).toBe(171000);
    });
  });
});
