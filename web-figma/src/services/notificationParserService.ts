/**
 * notificationParserService.ts
 *
 * Rule-based parser for Indonesian financial notification texts.
 * Extracts: amount, direction, merchant, method, wallet candidate.
 *
 * Deliberately conservative: only returns high-confidence results.
 * Does NOT process OTP, PIN, password, or verification codes.
 */

export interface ParsedNotification {
  direction: "in" | "out";
  amount: number;
  merchant?: string;
  method?: string;
  walletCandidate?: string;
  confidence: number;
  rawText: string;
}

// ── Security: OTP / sensitive notification filter ─────────────

const SENSITIVE_KEYWORDS = [
  "OTP",
  "kode verifikasi",
  "kode otp",
  "verification code",
  "login code",
  "password",
  "PIN",
  "kode rahasia",
  "jangan bagikan",
  "do not share",
  "two-factor",
  "2FA",
];

export const isSensitiveNotification = (text: string): boolean => {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
};

// ── Amount extraction ─────────────────────────────────────────

const AMOUNT_PATTERNS = [
  /Rp\s*([\d.,]+)/gi,
  /IDR\s*([\d.,]+)/gi,
  /senilai\s*Rp\s*([\d.,]+)/gi,
  /sebesar\s*Rp\s*([\d.,]+)/gi,
  /total\s*Rp\s*([\d.,]+)/gi,
];

const parseAmount = (text: string): number | null => {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const raw = match[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) return num;
    }
    pattern.lastIndex = 0;
  }
  return null;
};

// ── Direction detection ───────────────────────────────────────

const OUT_KEYWORDS = [
  "pembayaran",
  "bayar",
  "transfer ke",
  "kirim ke",
  "debit",
  "tarik tunai",
  "penarikan",
  "pembelian",
  "berhasil ke",
  "keluar",
  "deducted",
  "spent",
  "charged",
  "transaksi qris",
  "qris berhasil",
  "belanja",
];

const IN_KEYWORDS = [
  "masuk",
  "diterima",
  "kredit",
  "top up",
  "topup",
  "isi ulang",
  "refund",
  "cashback",
  "cash back",
  "transfer dari",
  "kiriman dari",
  "received",
  "credit",
  "incoming",
  "uang masuk",
];

const detectDirection = (text: string): "in" | "out" | null => {
  const lower = text.toLowerCase();
  const outScore = OUT_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const inScore = IN_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  if (outScore > inScore) return "out";
  if (inScore > outScore) return "in";
  return null;
};

// ── Merchant extraction ───────────────────────────────────────

const extractMerchant = (text: string): string | undefined => {
  // "di [Merchant Name]" pattern
  const diMatch = /di\s+([A-Z][a-zA-Z\s&.']+?)(?:\.|,|\n|$)/i.exec(text);
  if (diMatch) return diMatch[1].trim();

  // "ke [Merchant/Person]" pattern
  const keMatch = /(?:transfer ke|kirim ke|bayar ke)\s+([A-Z][a-zA-Z\s&.']+?)(?:\.|,|\n|$)/i.exec(text);
  if (keMatch) return keMatch[1].trim();

  return undefined;
};

// ── Wallet candidate detection ────────────────────────────────

const WALLET_HINTS: Record<string, string[]> = {
  GoPay: ["gopay", "go-pay", "gojek"],
  OVO: ["ovo"],
  ShopeePay: ["shopeepay", "shopee pay", "shopee"],
  Dana: ["dana"],
  LinkAja: ["linkaja", "link aja"],
  Jago: ["jago", "bank jago"],
  SeaBank: ["seabank", "sea bank"],
  BCA: ["bca", "m-banking bca", "myBCA"],
  Mandiri: ["mandiri", "livin"],
  BRI: ["bri", "brimo"],
  BNI: ["bni", "bni mobile"],
};

const detectWalletCandidate = (appName: string, text: string): string | undefined => {
  const combined = `${appName} ${text}`.toLowerCase();
  for (const [wallet, hints] of Object.entries(WALLET_HINTS)) {
    if (hints.some((h) => combined.includes(h))) return wallet;
  }
  return undefined;
};

// ── Payment method ────────────────────────────────────────────

const detectMethod = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  if (lower.includes("qris")) return "QRIS";
  if (lower.includes("transfer")) return "Transfer";
  if (lower.includes("debit")) return "Debit";
  if (lower.includes("kredit") || lower.includes("credit")) return "Kredit";
  if (lower.includes("tunai") || lower.includes("cash")) return "Tunai";
  return undefined;
};

// ── Main parser ───────────────────────────────────────────────

export const parseNotification = (
  text: string,
  appName = "",
): ParsedNotification | null => {
  // Security gate: skip OTP / sensitive notifications
  if (isSensitiveNotification(text)) return null;

  const amount = parseAmount(text);
  if (!amount) return null;

  const direction = detectDirection(text);
  if (!direction) return null;

  const merchant = extractMerchant(text);
  const method = detectMethod(text);
  const walletCandidate = detectWalletCandidate(appName, text);

  // Confidence based on what we extracted
  let confidence = 0.6;
  if (merchant) confidence += 0.1;
  if (method) confidence += 0.1;
  if (walletCandidate) confidence += 0.1;
  if (method === "QRIS") confidence = Math.min(confidence + 0.05, 0.95);

  return {
    direction,
    amount,
    merchant,
    method,
    walletCandidate,
    confidence: Math.min(confidence, 0.95),
    rawText: text,
  };
};

// ── Common Indonesian financial apps ─────────────────────────

export const DEFAULT_ALLOWLIST_APPS = [
  { package_name: "com.gojek.app", app_name: "Gojek (GoPay)" },
  { package_name: "com.ubercab.driver", app_name: "OVO" },
  { package_name: "com.shopee.id", app_name: "Shopee (ShopeePay)" },
  { package_name: "id.dana", app_name: "Dana" },
  { package_name: "com.telkom.tcash", app_name: "LinkAja" },
  { package_name: "com.btpn.jenius", app_name: "Jenius" },
  { package_name: "id.co.bankjago.android", app_name: "Bank Jago" },
  { package_name: "com.seamoney.android", app_name: "SeaBank" },
  { package_name: "com.bca", app_name: "myBCA" },
  { package_name: "com.bri.brimo", app_name: "BRImo" },
  { package_name: "id.co.mandiri.mobile", app_name: "Livin' Mandiri" },
  { package_name: "com.bni.mobilebanking", app_name: "BNI Mobile Banking" },
];
