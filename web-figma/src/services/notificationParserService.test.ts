import { describe, it, expect } from "vitest";
import { isSensitiveNotification, parseNotification, getAppFriendlyName } from "./notificationParserService";

describe("notificationParserService", () => {
  describe("isSensitiveNotification", () => {
    it("flags standard OTP messages as sensitive", () => {
      expect(isSensitiveNotification("Kode OTP Anda adalah 459123. JANGAN BAGIKAN KEPADA SIAPAPUN.")).toBe(true);
      expect(isSensitiveNotification("PIN/Verification code is 992-120. Do not share.")).toBe(true);
    });

    it("does not flag regular transaction messages as sensitive", () => {
      expect(isSensitiveNotification("Pembelian di Merchant A sebesar Rp 50.000 sukses.")).toBe(false);
      expect(isSensitiveNotification("Transfer masuk dari Tokopedia Rp 120.000.")).toBe(false);
    });
  });

  describe("parseNotification", () => {
    it("returns null for sensitive notifications (OTP)", () => {
      const result = parseNotification("Kode OTP Jago: 881290. Rahasia.", "id.co.bankjago.android");
      expect(result).toBeNull();
    });

    it("returns null when no amount matches", () => {
      const result = parseNotification("Transaksi Anda berhasil diproses.", "com.bca");
      expect(result).toBeNull();
    });

    it("parses QRIS debit transactions correctly", () => {
      const text = "Transaksi QRIS senilai Rp 50.000 di Kopi Kenangan berhasil dilakukan.";
      const result = parseNotification(text, "id.co.bankjago.android");
      
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(50000);
      expect(result?.direction).toBe("out");
      expect(result?.merchant).toBe("Kopi Kenangan");
      expect(result?.method).toBe("QRIS");
      expect(result?.walletCandidate).toBe("Jago");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it("parses credit/deposit transactions correctly", () => {
      const text = "Dana masuk sebesar Rp 250.000 dari BUDI UTOMO berhasil diterima.";
      const result = parseNotification(text, "com.gojek.app");
      
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(250000);
      expect(result?.direction).toBe("in");
      expect(result?.merchant).toBe("BUDI UTOMO");
      expect(result?.walletCandidate).toBe("GoPay");
    });

    it("parses merchant incoming payment transactions automatically as incoming direction", () => {
      const text = "Pembayaran Rp 15.000 dari Susi Sukses.";
      const result = parseNotification(text, "com.gojek.merchant");
      
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(15000);
      expect(result?.direction).toBe("in"); // GoPay merchant always receives payments
    });

    it("extracts remaining balance when present in the notification", () => {
      const text1 = "Transaksi QRIS senilai Rp 50.000 di Kopi Kenangan berhasil. Sisa saldo Rp 150.000";
      const res1 = parseNotification(text1, "id.co.bankjago.android");
      expect(res1?.remainingBalance).toBe(150000);

      const text2 = "Pembelian Rp 35.000 berhasil, Saldo Rp 12.000.000";
      const res2 = parseNotification(text2, "com.bca");
      expect(res2?.remainingBalance).toBe(12000000);

      const text3 = "Dana masuk Rp 100.000, Saldo akhir Anda Rp 1.100.000";
      const res3 = parseNotification(text3, "com.gojek.app");
      expect(res3?.remainingBalance).toBe(1100000);
    });
  });

  describe("getAppFriendlyName", () => {
    it("returns friendly names for known package IDs", () => {
      expect(getAppFriendlyName("com.gojek.app")).toBe("GoPay");
      expect(getAppFriendlyName("id.co.mandiri.livin")).toBe("Livin Mandiri");
      expect(getAppFriendlyName("com.google.android.gm")).toBe("Gmail");
      expect(getAppFriendlyName("com.google.android.apps.messaging")).toBe("SMS");
    });

    it("returns raw package name if not found in lookup mapping", () => {
      expect(getAppFriendlyName("com.unknown.bank")).toBe("com.unknown.bank");
    });
  });
});
