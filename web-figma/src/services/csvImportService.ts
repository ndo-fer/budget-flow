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
  if (!raw || raw.trim().length === 0) {
    throw new Error("File CSV terlalu pendek atau kosong.");
  }

  // Detect separator based on first line
  let separator = ",";
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === "\n" || char === "\r") {
      break;
    }
    if (char === ";") {
      separator = ";";
      break;
    }
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    const nextChar = raw[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
      if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      if (char === "\r" && nextChar === "\n") {
        i++; // skip \n of CRLF
      }
    } else {
      currentVal += char;
    }
  }

  if (currentRow.length > 0 || currentVal !== "") {
    currentRow.push(currentVal.trim());
    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) {
    throw new Error("File CSV terlalu pendek atau kosong.");
  }

  // Remove BOM if present from first element
  if (rows[0] && rows[0][0]) {
    rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  }

  const headers = rows[0].map((h) => h.trim()).filter(Boolean);
  if (headers.length === 0) {
    throw new Error("File CSV tidak valid atau header kosong.");
  }

  const recordRows: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const rowValues = rows[i];
    if (rowValues.length === 0 || (rowValues.length === 1 && rowValues[0] === "")) continue;
    const rowRecord: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowRecord[header] = (rowValues[idx] || "").trim();
    });
    recordRows.push(rowRecord);
  }

  return { headers, rows: recordRows };
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
    // Only comma present
    const parts = cleaned.split(",");
    if (parts[parts.length - 1].length === 3) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(",", ".");
    }
  } else if (lastDot !== -1) {
    // Only dot present
    const parts = cleaned.split(".");
    if (parts[parts.length - 1].length === 3) {
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
  if (raw.startsWith("-")) return "out";
  return null;
};

// ── Parse date with auto detected format ──────────────────────

export const detectDateFormat = (rows: Record<string, string>[], dateCol: string): "DMY" | "MDY" => {
  let hasFirstPartGreaterThan12 = false;
  let hasSecondPartGreaterThan12 = false;

  for (const row of rows) {
    const raw = (row[dateCol] || "").trim();
    if (!raw) continue;

    const match = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(raw);
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      if (p1 > 12) hasFirstPartGreaterThan12 = true;
      if (p2 > 12) hasSecondPartGreaterThan12 = true;
    }
  }

  if (hasSecondPartGreaterThan12 && !hasFirstPartGreaterThan12) {
    return "MDY";
  }
  return "DMY";
};

const parseCsvDate = (raw: string, format: "DMY" | "MDY"): string | null => {
  if (!raw) return null;
  raw = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const match = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(raw);
  if (match) {
    const [, p1, p2, y] = match;
    const year = y.length === 2 ? `20${y}` : y;
    
    if (format === "MDY") {
      return `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
    } else {
      return `${year}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`;
    }
  }

  const ymdMatch = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/.exec(raw);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
};

// ── Build transaction candidates ──────────────────────────────

export const buildTransactionCandidates = (
  rows: Record<string, string>[],
  mapping: CsvColumnMapping,
  walletId?: string,
): Partial<WalletTransaction>[] => {
  const dateFormat = detectDateFormat(rows, mapping.date);
  const isSingleColumnAmount = !mapping.direction || mapping.direction === mapping.amount;

  return rows
    .map((row) => {
      const dateStr = parseCsvDate(row[mapping.date] || "", dateFormat);
      const rawAmount = row[mapping.amount] || "";
      const amount = parseCsvAmount(rawAmount);
      if (!amount || !dateStr) return null;

      let direction: "in" | "out" = "out";

      if (isSingleColumnAmount) {
        const trimmedAmount = rawAmount.trim();
        direction = trimmedAmount.startsWith("-") ? "out" : "in";
      } else {
        const rawDirection = mapping.direction ? row[mapping.direction] : undefined;
        direction = parseCsvDirection(rawDirection || "") || "out";
      }

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

    // 1. Calculate time bounds
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

    const windowStart = new Date(minTime - 300000).toISOString();
    const windowEnd = new Date(maxTime + 300000).toISOString();

    // 2. Fetch existing transactions in time window
    const { data: existing, error } = await supabase
      .from("wallet_transactions")
      .select("id, wallet_id, amount, direction, occurred_at")
      .eq("user_id", userId)
      .gte("occurred_at", windowStart)
      .lte("occurred_at", windowEnd);

    if (error) throw error;
    const existingList = existing || [];

    // 3. Build hash map for O(N) duplicate checking
    const existingMap = new Map<string, Array<{ time: number }>>();
    for (const ext of existingList) {
      const key = `${ext.wallet_id || "null"}_${ext.amount}_${ext.direction}`;
      const list = existingMap.get(key) || [];
      list.push({ time: new Date(ext.occurred_at).getTime() });
      existingMap.set(key, list);
    }

    const isDuplicateLocal = (tx: Partial<WalletTransaction>): boolean => {
      if (!tx.amount || !tx.occurred_at) return false;
      const txTime = new Date(tx.occurred_at).getTime();
      const key = `${tx.wallet_id || "null"}_${tx.amount}_${tx.direction}`;
      const matches = existingMap.get(key);
      if (!matches) return false;
      return matches.some((m) => Math.abs(txTime - m.time) <= 300000);
    };

    // 4. Process candidates locally
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

