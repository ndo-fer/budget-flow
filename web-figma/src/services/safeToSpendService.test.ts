import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDaysUntilNextIncome } from "./safeToSpendService";

describe("safeToSpendService", () => {
  describe("getDaysUntilNextIncome", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calculates correct days remaining for mid-month dates", () => {
      // Set local system time to May 25, 2026
      const mockDate = new Date("2026-05-25T14:00:00");
      vi.setSystemTime(mockDate);

      // Remaining days: 25, 26, 27, 28, 29, 30, 31 (which is 6 days delta to May 31)
      expect(getDaysUntilNextIncome("2026-05")).toBe(6);
    });

    it("returns 1 day on the last day of the month", () => {
      const mockDate = new Date("2026-05-31T09:00:00");
      vi.setSystemTime(mockDate);

      expect(getDaysUntilNextIncome("2026-05")).toBe(1);
    });

    it("returns 1 day if today is past the end of the specified month", () => {
      const mockDate = new Date("2026-06-05T09:00:00");
      vi.setSystemTime(mockDate);

      expect(getDaysUntilNextIncome("2026-05")).toBe(1);
    });
  });
});
