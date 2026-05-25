import { describe, it, expect } from "vitest";
import { formatCurrency, formatCompactCurrency, parseRawCurrencyInput } from "./format";

describe("format utilities", () => {
  describe("formatCurrency", () => {
    it("formats amounts in IDR", () => {
      expect(formatCurrency(150000)).toBe("Rp 150.000");
    });
  });

  describe("formatCompactCurrency", () => {
    it("compacts millions to 'jt'", () => {
      expect(formatCompactCurrency(1500000)).toBe("Rp 1,5jt");
      expect(formatCompactCurrency(2000000)).toBe("Rp 2jt");
    });

    it("compacts thousands to 'rb'", () => {
      expect(formatCompactCurrency(15000)).toBe("Rp 15rb");
    });
  });

  describe("parseRawCurrencyInput", () => {
    it("parses numbers directly", () => {
      expect(parseRawCurrencyInput(150000)).toBe(150000);
    });

    it("parses simple clean numeric strings", () => {
      expect(parseRawCurrencyInput("150000")).toBe(150000);
    });

    it("strips Rp prefix and spaces", () => {
      expect(parseRawCurrencyInput("Rp 150000")).toBe(150000);
      expect(parseRawCurrencyInput("Rp. 150.000")).toBe(150000);
    });

    it("removes thousands separators correctly", () => {
      expect(parseRawCurrencyInput("150.000")).toBe(150000);
      expect(parseRawCurrencyInput("1.500.000")).toBe(1500000);
    });

    it("handles standard Indonesian cents suffix (,00)", () => {
      expect(parseRawCurrencyInput("150.000,00")).toBe(150000);
      expect(parseRawCurrencyInput("Rp 75.500,00")).toBe(75500);
    });

    it("handles decimal dot suffix (.00)", () => {
      expect(parseRawCurrencyInput("150000.00")).toBe(150000);
      expect(parseRawCurrencyInput("150,000.00")).toBe(150000);
    });

    it("handles decimal dot suffix with single digit (.0 or ,0)", () => {
      expect(parseRawCurrencyInput("150000.0")).toBe(150000);
      expect(parseRawCurrencyInput("150.000,0")).toBe(150000);
    });

    it("returns 0 for empty or invalid values", () => {
      expect(parseRawCurrencyInput("")).toBe(0);
      expect(parseRawCurrencyInput("invalid")).toBe(0);
    });
  });
});
