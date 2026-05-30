import { describe, it, expect, vi } from "vitest";
import { 
  parseRawCsv, 
  autoDetectMapping, 
  buildTransactionCandidates,
  buildImportPreview
} from "./csvImportService";

// Mock Supabase
vi.mock("../lib/supabase", () => {
  return {
    default: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    },
  };
});

// Mock query utilities
vi.mock("./queryUtils", () => {
  return {
    getCurrentUserId: vi.fn(() => Promise.resolve("mock-user-id")),
  };
});

describe("csvImportService", () => {
  describe("parseRawCsv", () => {
    it("successfully parses comma-separated CSV with headers", () => {
      const csv = `Tanggal,Keterangan,Nominal,Jenis\n2026-05-01,Makan siang,35000,Debit\n2026-05-02,Transfer masuk,100000,Kredit`;
      const { headers, rows } = parseRawCsv(csv);
      
      expect(headers).toEqual(["Tanggal", "Keterangan", "Nominal", "Jenis"]);
      expect(rows).toHaveLength(2);
      expect(rows[0]["Keterangan"]).toBe("Makan siang");
      expect(rows[1]["Nominal"]).toBe("100000");
    });

    it("successfully parses semicolon-separated CSV", () => {
      const csv = `Date;Description;Amount;Type\n2026-05-01;"Kopi, Gula";15000;Debit`;
      const { headers, rows } = parseRawCsv(csv);
      
      expect(headers).toEqual(["Date", "Description", "Amount", "Type"]);
      expect(rows).toHaveLength(1);
      expect(rows[0]["Description"]).toBe("Kopi, Gula");
      expect(rows[0]["Amount"]).toBe("15000");
    });

    it("throws error for empty CSV inputs", () => {
      expect(() => parseRawCsv("")).toThrow("File CSV terlalu pendek atau kosong.");
      expect(() => parseRawCsv("HeaderOnly")).toThrow("File CSV terlalu pendek atau kosong.");
    });
  });

  describe("autoDetectMapping", () => {
    it("auto detects standard column names correctly", () => {
      const headers = ["tgl", "narasi", "jumlah", "tipe", "saldo akhir", "kategori"];
      const mapping = autoDetectMapping(headers);

      expect(mapping.date).toBe("tgl");
      expect(mapping.description).toBe("narasi");
      expect(mapping.amount).toBe("jumlah");
      expect(mapping.direction).toBe("tipe");
      expect(mapping.balance).toBe("saldo akhir");
      expect(mapping.category).toBe("kategori");
    });
  });

  describe("buildTransactionCandidates", () => {
    it("converts raw rows into correct wallet transaction candidates, detecting amount formats", () => {
      const rows = [
        { Date: "2026-05-01", Memo: "Beli Makan", Value: "Rp 25.000,00", Type: "Debit" },
        { Date: "25/05/2026", Memo: "Transfer Masuk", Value: "1,500.50", Type: "Kredit" },
      ];
      const mapping = {
        date: "Date",
        description: "Memo",
        amount: "Value",
        direction: "Type"
      };

      const candidates = buildTransactionCandidates(rows, mapping, "wallet-123");
      expect(candidates).toHaveLength(2);

      // Candidate 1 (Indonesian currency format)
      expect(candidates[0].wallet_id).toBe("wallet-123");
      expect(candidates[0].amount).toBe(25000);
      expect(candidates[0].direction).toBe("out");
      expect(candidates[0].note).toBe("Beli Makan");
      expect(candidates[0].occurred_at).toBe(new Date("2026-05-01T12:00:00").toISOString());

      // Candidate 2 (English currency format)
      expect(candidates[1].amount).toBe(1500.5);
      expect(candidates[1].direction).toBe("in");
      expect(candidates[1].occurred_at).toBe(new Date("2026-05-25T12:00:00").toISOString());
    });
  });

  describe("buildImportPreview", () => {
    it("builds correct summary and marks duplicates based on window check", async () => {
      const candidates = [
        {
          wallet_id: "wallet-123",
          amount: 50000,
          direction: "out" as const,
          occurred_at: "2026-05-01T12:00:00.000Z",
        },
      ];

      const preview = await buildImportPreview(candidates);
      expect(preview.total).toBe(1);
      expect(preview.newCount).toBe(1);
      expect(preview.duplicateCount).toBe(0);
      expect(preview.transactions).toHaveLength(1);
      expect(preview.transactions[0].is_duplicate).toBe(false);
    });
  });

  describe("advanced csv behaviors", () => {
    it("handles newlines inside quoted fields", () => {
      const csv = `Tanggal,Keterangan,Nominal\n2026-05-01,"Beli makan siang\ndi warung bakso",35000`;
      const { headers, rows } = parseRawCsv(csv);
      expect(headers).toEqual(["Tanggal", "Keterangan", "Nominal"]);
      expect(rows).toHaveLength(1);
      expect(rows[0]["Keterangan"]).toBe("Beli makan siang\ndi warung bakso");
    });

    it("auto-detects US vs International date format", () => {
      const idCsv = [
        { Tanggal: "25/05/2026", Nominal: "10000" }
      ];
      const usCsv = [
        { Tanggal: "05/25/2026", Nominal: "10000" }
      ];

      const idCandidates = buildTransactionCandidates(idCsv, { date: "Tanggal", amount: "Nominal" });
      const usCandidates = buildTransactionCandidates(usCsv, { date: "Tanggal", amount: "Nominal" });

      expect(idCandidates[0].occurred_at).toBe(new Date("2026-05-25T12:00:00").toISOString());
      expect(usCandidates[0].occurred_at).toBe(new Date("2026-05-25T12:00:00").toISOString());
    });

    it("correctly handles single-column positive/negative amount direction mapping", () => {
      const rows = [
        { Tanggal: "2026-05-01", Nominal: "-50000" },
        { Tanggal: "2026-05-02", Nominal: "150000" },
      ];
      const mapping = {
        date: "Tanggal",
        amount: "Nominal",
      };

      const candidates = buildTransactionCandidates(rows, mapping);
      expect(candidates).toHaveLength(2);
      expect(candidates[0].direction).toBe("out");
      expect(candidates[0].amount).toBe(50000);
      expect(candidates[1].direction).toBe("in");
      expect(candidates[1].amount).toBe(150000);
    });
  });
});
