import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocked functions before they are hoisted
const { mockRecognize, mockTerminate, mockCreateWorker } = vi.hoisted(() => {
  const recognizeFn = vi.fn();
  const terminateFn = vi.fn();
  const createWorkerFn = vi.fn(() =>
    Promise.resolve({
      recognize: recognizeFn,
      terminate: terminateFn,
    })
  );
  return {
    mockRecognize: recognizeFn,
    mockTerminate: terminateFn,
    mockCreateWorker: createWorkerFn,
  };
});

vi.mock("tesseract.js", () => ({
  createWorker: mockCreateWorker,
}));

import {
  parseBalanceScreenshot,
  parseReceiptImage,
} from "./ocrService";

describe("ocrService parsing logic", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateWorker.mockClear();
    mockRecognize.mockClear();
    mockTerminate.mockClear();
  });

  describe("parseBalanceScreenshot", () => {
    it("successfully parses Jago balance screenshot", async () => {
      mockRecognize.mockResolvedValue({
        data: {
          text: `
            Bank Jago
            Available Balance: Rp 5.250.ooo
            Transfer history
          `,
        },
      });

      const result = await parseBalanceScreenshot("mock_image_path");

      expect(result.walletCandidate).toBe("Jago");
      expect(result.balanceCandidate).toBe(5250000);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("successfully parses GoPay balance with OCR letter substitutions", async () => {
      mockRecognize.mockResolvedValue({
        data: {
          text: `
            Gopay
            Saldo Anda
            Rp 1.s5o.2oo
          `,
        },
      });

      const result = await parseBalanceScreenshot("mock_image_path");

      expect(result.walletCandidate).toBe("GoPay");
      expect(result.balanceCandidate).toBe(1550200); // s -> 5, o -> 0
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("handles multiple conflicting wallets with confidence penalty", async () => {
      mockRecognize.mockResolvedValue({
        data: {
          text: `
            Transfer from BCA to OVO
            Amount Rp 50.000
          `,
        },
      });

      const result = await parseBalanceScreenshot("mock_image_path");
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe("parseReceiptImage", () => {
    it("successfully parses merchant, total amount, payment method, and date from receipt text", async () => {
      mockRecognize.mockResolvedValue({
        data: {
          text: `
            Kopi Kenangan
            Grand Indonesia
            Telp: 021-123456
            ---------------------
            1x Es Kopi Susu Rp 22.000
            1x Roti Coklat   Rp 15.000
            ---------------------
            TOTAL          Rp 37.000
            Bayar: QRIS
            Tanggal: 25/05/2026 14:30
          `,
        },
      });

      const result = await parseReceiptImage("mock_image_path");

      expect(result.merchant).toBe("Kopi Kenangan");
      expect(result.totalAmount).toBe(37000);
      expect(result.paymentMethod).toBe("QRIS");
      expect(result.transactionDate).toBe("2026-05-25");
      expect(result.items).toContainEqual({ name: "Es Kopi Susu", price: 22000 });
      expect(result.items).toContainEqual({ name: "Roti Coklat", price: 15000 });
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });
});
