import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  getMonthDateRange, 
  getDaysInMonth, 
  getToday, 
  getCurrentMonth, 
  formatHumanDate, 
  formatMonthLabel, 
  shiftMonth 
} from "./date";

describe("date utilities", () => {
  describe("getMonthDateRange", () => {
    it("returns correct ranges for regular months", () => {
      const range = getMonthDateRange("2026-05");
      expect(range.startDate).toBe("2026-05-01");
      expect(range.endDate).toBe("2026-05-31");
      expect(range.lastDay).toBe(31);
    });

    it("handles leap years correctly", () => {
      const range = getMonthDateRange("2024-02");
      expect(range.endDate).toBe("2024-02-29");
      expect(range.lastDay).toBe(29);
    });

    it("handles invalid formats safely", () => {
      expect(getMonthDateRange("")).toEqual({ startDate: "", endDate: "", lastDay: 0 });
      expect(getMonthDateRange("invalid")).toEqual({ startDate: "", endDate: "", lastDay: 0 });
    });
  });

  describe("getDaysInMonth", () => {
    it("returns 30 for November", () => {
      expect(getDaysInMonth("2026-11")).toBe(30);
    });
  });

  describe("getToday & getCurrentMonth (timezone safety)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("evaluates current date based on local time, avoiding UTC offset shift in early morning", () => {
      // Simulate UTC time: 2026-05-24T20:00:00Z (8:00 PM UTC)
      // Equivalent local time in Jakarta (UTC+7): 2026-05-25T03:00:00+07:00 (3:00 AM WIB)
      const mockDate = new Date("2026-05-24T20:00:00Z");
      vi.setSystemTime(mockDate);

      // In the old implementation (using toISOString()), getToday() would return "2026-05-24" (UTC date)
      // But in the local-date implementation, it should evaluate to local Jakarta date "2026-05-25"
      expect(getToday()).toBe("2026-05-25");
      expect(getCurrentMonth()).toBe("2026-05");
    });
  });

  describe("formatting", () => {
    it("formats human date in Indonesian format", () => {
      const formatted = formatHumanDate("2026-05-25");
      expect(formatted).toContain("Mei");
      expect(formatted).toContain("2026");
    });

    it("formats month label in Indonesian format", () => {
      const label = formatMonthLabel("2026-05");
      expect(label).toContain("Mei 2026");
    });
  });

  describe("shiftMonth", () => {
    it("shifts forwards correctly", () => {
      expect(shiftMonth("2026-05", 2)).toBe("2026-07");
    });

    it("shifts backwards correctly across years", () => {
      expect(shiftMonth("2026-01", -2)).toBe("2025-11");
    });
  });
});
