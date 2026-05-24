/**
 * ocrService.ts
 *
 * Client-side OCR using Tesseract.js (free, WebAssembly, no API key).
 * Supports balance screenshot parsing and receipt scanning.
 *
 * Tesseract.js v5 is used — loads WASM + lang data from CDN lazily.
 */

import type { BalanceOcrResult, ReceiptOcrResult } from "../types/models";

// Lazy import so we don't block the initial bundle
let tesseractPromise: Promise<typeof import("tesseract.js")> | null = null;

const getTesseract = async () => {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js");
  }
  return tesseractPromise;
};

export type OcrProgressCallback = (progress: number, status: string) => void;

// ── Core OCR ──────────────────────────────────────────────────

export const extractTextFromImage = async (
  imageSource: File | Blob | string,
  onProgress?: OcrProgressCallback,
): Promise<string> => {
  const Tesseract = await getTesseract();

  const worker = await Tesseract.createWorker("ind+eng", 1, {
    logger: (m: any) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100), m.status);
      }
    },
    errorHandler: (e: any) => console.warn("[OCR] Worker error:", e),
  });

  try {
    const { data } = await worker.recognize(imageSource);
    return data.text;
  } finally {
    await worker.terminate();
  }
};

// ── Balance Screenshot Parser ─────────────────────────────────

const BALANCE_KEYWORDS = [
  "saldo", "balance", "available", "tersedia", "dana", "total",
];

const WALLET_HINTS: Record<string, string[]> = {
  GoPay: ["gopay", "go-pay"],
  OVO: ["ovo"],
  ShopeePay: ["shopeepay", "shopee"],
  Dana: ["dana"],
  LinkAja: ["linkaja"],
  Jago: ["bank jago", "jago"],
  SeaBank: ["seabank"],
  BCA: ["bca", "mybca"],
  Mandiri: ["mandiri", "livin"],
  BRI: ["bri", "brimo"],
  BNI: ["bni"],
};

const extractCurrencyAmount = (text: string): number | null => {
  // Multiple patterns for Indonesian currency
  const patterns = [
    /Rp\s*([\d.,]+)/gi,
    /IDR\s*([\d.,]+)/gi,
    /(?:saldo|balance|available)[:\s]+Rp?\s*([\d.,]+)/gi,
    /([\d]{1,3}(?:[.,][\d]{3})+)/g, // e.g. 1.234.567 or 1,234,567
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1]
        .replace(/\./g, "") // remove thousand separators (Indonesian style)
        .replace(",", "."); // comma -> decimal
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 100) return num; // filter out very small spurious numbers
    }
    pattern.lastIndex = 0;
  }
  return null;
};

const detectWalletFromText = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  for (const [wallet, hints] of Object.entries(WALLET_HINTS)) {
    if (hints.some((h) => lower.includes(h))) return wallet;
  }
  return undefined;
};

export const parseBalanceScreenshot = async (
  imageSource: File | Blob | string,
  onProgress?: OcrProgressCallback,
): Promise<BalanceOcrResult> => {
  const rawText = await extractTextFromImage(imageSource, onProgress);
  const lower = rawText.toLowerCase();

  // Find balance keyword vicinity
  let balanceCandidate: number | null = null;
  const lines = rawText.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (BALANCE_KEYWORDS.some((kw) => line.includes(kw))) {
      // Check this line and the next 2 lines for an amount
      const searchText = lines.slice(i, i + 3).join(" ");
      const found = extractCurrencyAmount(searchText);
      if (found) {
        balanceCandidate = found;
        break;
      }
    }
  }

  // Fallback: find the largest currency amount in the entire text
  if (!balanceCandidate) {
    const amounts: number[] = [];
    const pattern = /Rp\s*([\d.,]+)/gi;
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const raw = match[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(raw);
      if (!isNaN(num)) amounts.push(num);
    }
    if (amounts.length > 0) {
      // Take the largest amount (likely the balance display)
      balanceCandidate = Math.max(...amounts);
    }
  }

  const walletCandidate = detectWalletFromText(rawText);

  // Confidence based on how much we found
  let confidence = 0.4;
  if (balanceCandidate) confidence += 0.3;
  if (walletCandidate) confidence += 0.2;
  if (BALANCE_KEYWORDS.some((kw) => lower.includes(kw))) confidence += 0.1;

  return {
    walletCandidate,
    balanceCandidate: balanceCandidate ?? undefined,
    confidence: Math.min(confidence, 0.95),
    rawText,
    capturedAt: new Date().toISOString(),
  };
};

// ── Receipt OCR Parser ────────────────────────────────────────

const RECEIPT_TOTAL_KEYWORDS = ["total", "grand total", "subtotal", "jumlah", "amount", "bayar"];
const MERCHANT_POSITION_LINES = 5; // merchant name is usually in the first 5 lines

export const parseReceiptImage = async (
  imageSource: File | Blob | string,
  onProgress?: OcrProgressCallback,
): Promise<ReceiptOcrResult> => {
  const rawText = await extractTextFromImage(imageSource, onProgress);
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Merchant: usually one of the first lines with meaningful text
  let merchant: string | undefined;
  for (let i = 0; i < Math.min(MERCHANT_POSITION_LINES, lines.length); i++) {
    const line = lines[i];
    // Skip lines that look like addresses, phone numbers, or short codes
    if (line.length > 3 && !/^\d+$/.test(line) && !/^\+62/.test(line)) {
      merchant = line;
      break;
    }
  }

  // Total amount: look for lines with total keywords
  let totalAmount: number | null = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    if (RECEIPT_TOTAL_KEYWORDS.some((kw) => line.includes(kw))) {
      const amount = extractCurrencyAmount(lines[i]);
      if (amount) {
        totalAmount = amount;
        break;
      }
      // Check next line too
      if (i + 1 < lines.length) {
        const amount2 = extractCurrencyAmount(lines[i + 1]);
        if (amount2) {
          totalAmount = amount2;
          break;
        }
      }
    }
  }

  // Fallback: take the last (largest) currency amount seen
  if (!totalAmount) {
    const amounts: number[] = [];
    const pattern = /Rp\s*([\d.,]+)/gi;
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const raw = match[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) amounts.push(num);
    }
    if (amounts.length > 0) totalAmount = Math.max(...amounts);
  }

  // Payment method
  const lowerText = rawText.toLowerCase();
  let paymentMethod: string | undefined;
  if (lowerText.includes("qris")) paymentMethod = "QRIS";
  else if (lowerText.includes("debit")) paymentMethod = "Debit";
  else if (lowerText.includes("kredit") || lowerText.includes("credit")) paymentMethod = "Kredit";
  else if (lowerText.includes("tunai") || lowerText.includes("cash")) paymentMethod = "Tunai";

  // Date extraction (simple)
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const dateMatch = datePattern.exec(rawText);
  let transactionDate: string | undefined;
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    transactionDate = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Items: lines with price patterns but not total
  const items: Array<{ name: string; price?: number }> = [];
  for (const line of lines) {
    if (RECEIPT_TOTAL_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))) continue;
    const price = extractCurrencyAmount(line);
    const nameMatch = /^([A-Za-z][A-Za-z\s\d]+)/.exec(line);
    if (price && nameMatch && nameMatch[1].length > 2) {
      items.push({ name: nameMatch[1].trim(), price });
    }
  }

  // Confidence
  let confidence = 0.3;
  if (merchant) confidence += 0.2;
  if (totalAmount) confidence += 0.3;
  if (transactionDate) confidence += 0.1;
  if (paymentMethod) confidence += 0.1;

  return {
    merchant,
    totalAmount: totalAmount ?? undefined,
    transactionDate,
    paymentMethod,
    items: items.slice(0, 20), // cap at 20 items
    confidence: Math.min(confidence, 0.9),
    rawText,
  };
};
