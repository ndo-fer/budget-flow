/**
 * csvImportService.ts
 *
 * Flexible CSV import with:
 *  - Auto-detect common column names
 *  - Manual column mapping UI data
 *  - Preview before save
 *  - Duplicate detection
 */

import type { CsvColumnMapping, CsvImportPreview, WalletTransaction } from "../types/models";
import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";

// ── CSV Parsing ───────────────────────────────────────────────

export const parseRawCsv = (raw: string): { headers: string[]; rows: Record<string, string>[] } => {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) throw new Error("File CSV terlalu pendek atau kosong.");

  // Detect separator (comma or semicolon)
  const firstLine = lines[0];
  const separator = firstLine.includes(";") ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0])
    .map((h) => h.replace(/^\uFEFF/, "").trim())
    .filter(Boolean);

  if (headers.length === 0) {
    throw new Error("File CSV tidak valid atau header kosong.");
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
};

// ── Auto-detect column mapping ────────────────────────────────

const DATE_ALIASES = ["date", "tanggal", "tgl", "waktu", "time", "datetime"];
const DESCRIPTION_ALIASES = ["description", "deskripsi", "keterangan", "memo", "note", "notes", "narasi"];
const AMOUNT_ALIASES = ["amount", "nominal", "jumlah", "nilai", "debit", "credit", "kredit"];
const DIRECTION_ALIASES = ["type", "tipe", "jenis", "cr/db", "d/c", "debit/kredit"];
const BALANCE_ALIASES = ["balance", "saldo", "saldo akhir"];
const CATEGORY_ALIASES = ["category", "kategori", "jenis transaksi"];

const findBestMatch = (headers: string[], aliases: string[]): string | undefined => {
  for (const alias of aliases) {
    const found = headers.find((h) => h.toLowerCase().includes(alias.toLowerCase()));
    if (found) return found;
  }
  return undefined;
};

export const autoDetectMapping = (headers: string[]): Partial<CsvColumnMapping> => ({
  date: findBestMatch(headers, DATE_ALIASES),
  description: findBestMatch(headers, DESCRIPTION_ALIASES),
  amount: findBestMatch(headers, AMOUNT_ALIASES),
  direction: findBestMatch(headers, DIRECTION_ALIASES),
  balance: findBestMatch(headers, BALANCE_ALIASES),
  category: findBestMatch(headers, CATEGORY_ALIASES),
});

// ── Parse amount from CSV cell ────────────────────────────────

const parseCsvAmount = (raw: string): number | null => {
  if (!raw) return null;
  
  // Clean prefix like Rp or currency symbols
  let cleaned = raw.replace(/[Rp$\s]/gi, "").trim();

  // Auto-detect format
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastDot > lastComma) {
      // English format: 1,234.56 -> remove commas, keep dot
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // Indonesian format: 1.234,56 -> remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
  } else if (lastComma !== -1) {
    // Only comma present: could be 1,234 (English thousand) or 123,45 (Indonesian decimal)
    const parts = cleaned.split(",");
    if (parts[parts.length - 1].length === 3) {
      // Thousand separator
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // Decimal comma
      cleaned = cleaned.replace(",", ".");
    }
  } else if (lastDot !== -1) {
    // Only dot present: could be 1.234 (Indonesian thousand) or 123.45 (English decimal)
    const parts = cleaned.split(".");
    if (parts[parts.length - 1].length === 3) {
      // Thousand separator
      cleaned = cleaned.replace(/\./g, "");
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.abs(num);
};

// ── Parse direction ───────────────────────────────────────────

const parseCsvDirection = (raw: string): "in" | "out" | null => {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (["d", "db", "debit", "dr", "out", "keluar", "expense"].includes(lower)) return "out";
  if (["c", "cr", "credit", "kredit", "in", "masuk", "income"].includes(lower)) return "in";
  // Check if value is negative (some exports use negative for debit)
  if (raw.startsWith("-")) return "out";
  return null;
};

// ── Parse date ────────────────────────────────────────────────

const parseCsvDate = (raw: string): string | null => {
  if (!raw) return null;
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // Indonesian format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(raw);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
};

// ── Build transaction candidates ──────────────────────────────

export const buildTransactionCandidates = (
  rows: Record<string, string>[],
  mapping: CsvColumnMapping,
  walletId?: string,
): Partial<WalletTransaction>[] => {
  return rows
    .map((row) => {
      const dateStr = parseCsvDate(row[mapping.date] || "");
      const rawAmount = row[mapping.amount] || "";
      const amount = parseCsvAmount(rawAmount);
      if (!amount || !dateStr) return null;

      const rawDirection = mapping.direction ? row[mapping.direction] : undefined;
      const direction: "in" | "out" = parseCsvDirection(rawDirection || "") || "out";

      return {
        wallet_id: walletId,
        amount,
        direction,
        type: (direction === "in" ? "income" : "expense") as any,
        note: row[mapping.description] || undefined,
        category: mapping.category ? row[mapping.category] || undefined : undefined,
        source: "csv" as const,
        confidence: 0.95,
        occurred_at: new Date(dateStr + "T12:00:00").toISOString(),
        is_duplicate: false,
      } as Partial<WalletTransaction>;
    })
    .filter((tx): tx is Partial<WalletTransaction> => tx !== null);
};

// ── Preview with duplicate check ──────────────────────────────

export const buildImportPreview = async (
  candidates: Partial<WalletTransaction>[],
): Promise<CsvImportPreview> => {
  if (candidates.length === 0) {
    return {
      total: 0,
      newCount: 0,
      duplicateCount: 0,
      reviewCount: 0,
      transactions: [],
    };
  }

  let newCount = 0;
  let duplicateCount = 0;
  let reviewCount = 0;

  try {
    const userId = await getCurrentUserId();

    // 1. Calculate time bounds (min/max occurred_at)
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const tx of candidates) {
      if (tx.occurred_at) {
        const time = new Date(tx.occurred_at).getTime();
        if (time < minTime) minTime = time;
        if (time > maxTime) maxTime = time;
      }
    }

    if (minTime === Infinity || maxTime === -Infinity) {
      return {
        total: candidates.length,
        newCount: 0,
        duplicateCount: 0,
        reviewCount: candidates.length,
        transactions: candidates.map((tx) => ({ ...tx, is_duplicate: false })),
      };
    }

    // Add 5-minute buffer on both ends of the window (5 * 60 * 1000 = 300000ms)
    const windowStart = new Date(minTime - 300000).toISOString();
    const windowEnd = new Date(maxTime + 300000).toISOString();

    // 2. Fetch existing transactions inside the window once
    const { data: existing, error } = await supabase
      .from("wallet_transactions")
      .select("id, wallet_id, amount, direction, occurred_at")
      .eq("user_id", userId)
      .gte("occurred_at", windowStart)
      .lte("occurred_at", windowEnd);

    if (error) throw error;
    const existingList = existing || [];

    // Helper function for in-memory check
    const isDuplicateLocal = (tx: Partial<WalletTransaction>): boolean => {
      if (!tx.amount || !tx.occurred_at) return false;
      const txTime = new Date(tx.occurred_at).getTime();

      return existingList.some((ext) => {
        if (tx.wallet_id !== ext.wallet_id) return false;
        if (tx.amount !== ext.amount) return false;
        if (tx.direction !== ext.direction) return false;
        const extTime = new Date(ext.occurred_at).getTime();
        return Math.abs(txTime - extTime) <= 300000;
      });
    };

    // 3. Process candidates locally
    const processed = candidates.map((tx) => {
      if (!tx.amount || !tx.occurred_at) {
        reviewCount++;
        return { ...tx, is_duplicate: false };
      }

      const isDup = isDuplicateLocal(tx);
      if (isDup) {
        duplicateCount++;
        return { ...tx, is_duplicate: true };
      } else {
        newCount++;
        return { ...tx, is_duplicate: false };
      }
    });

    return {
      total: candidates.length,
      newCount,
      duplicateCount,
      reviewCount,
      transactions: processed,
    };
  } catch (err) {
    console.error("Error building CSV import preview:", err);
    return {
      total: candidates.length,
      newCount: 0,
      duplicateCount: 0,
      reviewCount: candidates.length,
      transactions: candidates.map((tx) => ({ ...tx, is_duplicate: false })),
    };
  }
};
