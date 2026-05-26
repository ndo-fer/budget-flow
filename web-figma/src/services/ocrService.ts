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

// ── Canvas Image Preprocessing ────────────────────────────────

const preprocessImageIfNeeded = (imageSource: File | Blob | string): Promise<File | Blob | string> => {
  if (typeof imageSource === "string") {
    return Promise.resolve(imageSource);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Apply contrast and grayscale to make text pop against colored gradients
        ctx.filter = "contrast(1.6) grayscale(1) brightness(1.05)";
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            resolve(blob || imageSource);
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => resolve(imageSource);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(imageSource);
    reader.readAsDataURL(imageSource);
  });
};

// ── Core OCR ──────────────────────────────────────────────────

export const extractTextFromImage = async (
  imageSource: File | Blob | string,
  onProgress?: OcrProgressCallback,
): Promise<string> => {
  const Tesseract = await getTesseract();

  let processedSource = imageSource;
  try {
    processedSource = await preprocessImageIfNeeded(imageSource);
  } catch (err) {
    console.warn("[OCR] Image preprocessing failed, using original:", err);
  }

  const worker = await Tesseract.createWorker("ind+eng", 1, {
    workerPath: "/tesseract/tesseract-worker.min.js",
    langPath: "/tesseract/lang-data",
    corePath: "/tesseract",
    gzip: false,
    logger: (m: any) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100), m.status);
      }
    },
    errorHandler: (e: any) => console.warn("[OCR] Worker error:", e),
  });

  // 15 second timeout to prevent infinite loader hangs
  const recognizePromise = worker.recognize(processedSource);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("OCR scan timed out. Pastikan file asset tesseract tersedia dan koneksi stabil.")), 15000)
  );

  try {
    const { data } = await Promise.race([recognizePromise, timeoutPromise]);
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
  const cleanOcrDigits = (raw: string): string => {
    return raw
      .replace(/[Oo]/g, "0")
      .replace(/[Ii|l]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/[Bb]/g, "8")
      .replace(/[Zz]/g, "2")
      .replace(/[Tt]/g, "7");
  };

  // Patterns that allow common OCR letter substitutions in place of digits
  const patterns = [
    /Rp\s*([0-9OoIi|lSsbBtZz.,]+)/gi,
    /IDR\s*([0-9OoIi|lSsbBtZz.,]+)/gi,
    /(?:saldo|balance|available)[:\s]+Rp?\s*([0-9OoIi|lSsbBtZz.,]+)/gi,
    /([0-9OoIi|lSsbBtZz]{1,3}(?:[.,][0-9OoIi|lSsbBtZz]{3})+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const cleanedDigits = cleanOcrDigits(match[1]);
      const raw = cleanedDigits
        .replace(/\./g, "") // remove thousand separators
        .replace(",", "."); // comma -> decimal
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 100) return num;
    }
    pattern.lastIndex = 0;
  }
  return null;
};

const detectWalletFromText = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  let bestWallet: string | undefined = undefined;
  let earliestIndex = Infinity;

  for (const [wallet, hints] of Object.entries(WALLET_HINTS)) {
    for (const hint of hints) {
      const idx = lower.indexOf(hint);
      if (idx !== -1 && idx < earliestIndex) {
        earliestIndex = idx;
        bestWallet = wallet;
      }
    }
  }

  // If the wallet name was only found deep in the text (e.g. past the first 300 characters),
  // it is likely a false positive from transaction details.
  if (bestWallet && earliestIndex > 300) {
    return undefined;
  }

  return bestWallet;
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

  // Fallback: find currency amounts, prioritizing top area and excluding transaction-like lines
  if (!balanceCandidate) {
    const amounts: { value: number; lineIndex: number }[] = [];
    const TRANSACTION_KEYWORDS = [
      "transfer", "bayar", "pembayaran", "qris", "bi fast", "top-up", "topup", 
      "deposit", "credit", "debit", "mutasi", "rekening sumber", "tujuan", "fee"
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Skip lines that look like transactions or contain +/- indicating mutasi
      const isTransactionLine = 
        /[-+]\s*Rp/i.test(line) || 
        /Rp\s*[-+]/i.test(line) ||
        /[-+]\s*[\d.,]+/i.test(line) ||
        TRANSACTION_KEYWORDS.some(kw => lowerLine.includes(kw));
        
      if (isTransactionLine) continue;
      
      // Try to extract currency amount
      const num = extractCurrencyAmount(line);
      if (num && num > 100) {
        amounts.push({ value: num, lineIndex: i });
      }
    }
    
    if (amounts.length > 0) {
      // Prioritize amounts found in the first 8 lines (header/summary area)
      const topAmounts = amounts.filter(a => a.lineIndex < 8);
      if (topAmounts.length > 0) {
        balanceCandidate = topAmounts[0].value;
      } else {
        // Fallback to the largest overall non-transaction amount
        balanceCandidate = Math.max(...amounts.map(a => a.value));
      }
    }
  }

  const walletCandidate = detectWalletFromText(rawText);

  // Confidence based on location and validity of elements
  let confidence = 0.4;
  
  if (walletCandidate) {
    // If wallet candidate is in the header area (first 250 chars), it's highly confident
    const walletIndex = lower.indexOf(walletCandidate.toLowerCase());
    const isTopWallet = walletIndex !== -1 && walletIndex < 250;
    confidence += isTopWallet ? 0.25 : 0.1;
  }

  if (balanceCandidate) {
    // If balance was found near a keyword, it's highly confident
    const foundWithKeyword = lines.some((line, i) => {
      if (BALANCE_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))) {
        const searchText = lines.slice(i, i + 3).join(" ").toLowerCase();
        const found = extractCurrencyAmount(searchText);
        return found === balanceCandidate;
      }
      return false;
    });
    confidence += foundWithKeyword ? 0.3 : 0.15;
  }

  if (BALANCE_KEYWORDS.some((kw) => lower.includes(kw))) {
    confidence += 0.1;
  }

  // Penalty if multiple conflicting wallets are mentioned (indicates a transfer/transaction list screenshot)
  let walletCount = 0;
  for (const [wallet, hints] of Object.entries(WALLET_HINTS)) {
    if (hints.some((h) => lower.includes(h))) {
      walletCount++;
    }
  }
  if (walletCount > 1) {
    confidence -= 0.15;
  }

  return {
    walletCandidate,
    balanceCandidate: balanceCandidate ?? undefined,
    confidence: Math.max(0.1, Math.min(confidence, 0.95)),
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
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    let line = lines[i];
    // Clean up trailing/leading noise
    line = line.replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim();
    
    // Skip lines that look like addresses, phone numbers, pure numbers, or gibberish
    if (
      line.length > 3 &&
      !/^\d/.test(line) && // Doesn't start with a number
      !/(?:jl|jalan|ruko|plaza|blok)\.?\s/i.test(line) && // Not an address
      /[aeiou]/i.test(line) && // Contains vowels
      line.replace(/[^0-9]/g, "").length < 5 // Doesn't contain many numbers (like a phone/NPWP)
    ) {
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

  // Fallback: take the largest currency amount seen in the entire text
  if (!totalAmount) {
    const amounts: number[] = [];
    // Match standard Indonesian currency patterns like 50.000, 50,000, or Rp50.000
    const pattern = /(?:Rp\s*)?(\d{1,3}(?:[.,]\d{3})+)/gi;
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const raw = match[1].replace(/[.,]/g, ""); // Strip all separators
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 1000) amounts.push(num); // Minimum 1000 for a receipt
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
