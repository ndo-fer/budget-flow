import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSelect = vi.fn();
vi.mock("../lib/supabase", () => {
  return {
    default: {
      from: vi.fn(() => ({
        select: mockSelect,
      })),
    },
  };
});

// Mock queryUtils
vi.mock("./queryUtils", () => {
  return {
    getCurrentUserId: vi.fn(() => Promise.resolve("test-user-id")),
  };
});

import { generateMonthlyRecurringExpenses } from "./recurringService";

describe("recurringService", () => {
  describe("generateMonthlyRecurringExpenses", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("generates monthly recurring expenses on the exact day of month", async () => {
      const mockRecurring = [
        {
          id: 1,
          frequency: "monthly",
          amount: 50000,
          day_of_month: 15,
          category_id: 10,
          start_date: "2026-05-01",
          is_active: true,
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        eq2: vi.fn().mockReturnThis(), // mock other chain calls if any
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: mockRecurring, error: null }),
      });

      const result = await generateMonthlyRecurringExpenses("2026-05");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: "2026-05-15",
        category_id: 10,
        amount: 50000,
        note: "[Recurring] Monthly",
        is_recurring: true,
        recurring_expense_id: 1,
      });
    });

    it("generates weekly recurring expenses on the correct day of week", async () => {
      const mockRecurring = [
        {
          id: 2,
          frequency: "weekly",
          amount: 20000,
          category_id: 11,
          // 2026-05-01 is a Friday. So occurrences should be Fridays: May 1, May 8, May 15, May 22, May 29.
          start_date: "2026-05-01",
          is_active: true,
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: mockRecurring, error: null }),
      });

      const result = await generateMonthlyRecurringExpenses("2026-05");

      expect(result).toHaveLength(5);
      const dates = result.map((r) => r.date);
      expect(dates).toEqual([
        "2026-05-01",
        "2026-05-08",
        "2026-05-15",
        "2026-05-22",
        "2026-05-29",
      ]);
      // Verify all resolved dates are indeed Fridays (getDay() === 5)
      dates.forEach((d) => {
        expect(new Date(d).getDay()).toBe(5);
      });
    });

    it("enforces start_date bounds for daily recurring expenses", async () => {
      const mockRecurring = [
        {
          id: 3,
          frequency: "daily",
          amount: 1000,
          category_id: 12,
          // Starts on May 20, 2026. Should only generate occurrences from May 20 to May 31.
          start_date: "2026-05-20",
          is_active: true,
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: mockRecurring, error: null }),
      });

      const result = await generateMonthlyRecurringExpenses("2026-05");

      // May 20 to May 31 inclusive is 12 days
      expect(result).toHaveLength(12);
      expect(result[0].date).toBe("2026-05-20");
      expect(result[result.length - 1].date).toBe("2026-05-31");
    });
  });
});
