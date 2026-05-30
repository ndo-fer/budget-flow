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
  remainingBalance?: number;
}

// ── Security: OTP / sensitive notification filter ─────────────

const SENSITIVE_KEYWORDS = [
  "OTP",
  "kode verifikasi",
  "kode otp",
  "verification code",
  "login code",
  "password",
  "kata sandi",
  "sandi",
  "PIN",
  "kode rahasia",
  "jangan bagikan",
  "do not share",
  "two-factor",
  "2FA",
  "tfa",
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
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const raw = match[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        pattern.lastIndex = 0;
        return num;
      }
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
  "dana masuk",
  "transfer masuk",
  "pembayaran masuk",
  "pembayaran diterima",
];

const detectDirection = (text: string, packageName = ""): "in" | "out" | null => {
  const lower = text.toLowerCase();
  const lowerPkg = packageName.toLowerCase();

  // 1. Merchant / Seller apps always receive incoming payments
  if (
    lowerPkg.includes("merchant") ||
    lowerPkg.includes("seller") ||
    lowerPkg.includes("partner")
  ) {
    return "in";
  }

  // 2. Keyword scoring
  const outScore = OUT_KEYWORDS.filter((kw) => {
    // Avoid false positive matching 'bayar' inside 'pembayaran' unless it is 'pembayaran ke/untuk'
    if (kw === "bayar" && lower.includes("pembayaran")) {
      return lower.includes("pembayaran ke") || lower.includes("pembayaran untuk");
    }
    // Avoid false positive matching 'pembayaran' inside 'pembayaran masuk'
    if (kw === "pembayaran" && lower.includes("pembayaran masuk")) {
      return false;
    }
    return lower.includes(kw);
  }).length;

  const inScore = IN_KEYWORDS.filter((kw) => lower.includes(kw)).length;

  if (outScore > inScore) return "out";
  if (inScore > outScore) return "in";
  return null;
};

// ── Merchant extraction ───────────────────────────────────────

const extractMerchant = (text: string): string | undefined => {
  // 1. "di [Merchant Name]" pattern
  const diMatch = /\bdi\s+([A-Z0-9][a-zA-Z0-9&.']*(?:\s+[A-Z0-9][a-zA-Z0-9&.']*)*)/.exec(text);
  if (diMatch) return diMatch[1].trim();

  // 2. "ke [Merchant/Person]" pattern
  const keMatch = /\b(?:transfer ke|kirim ke|bayar ke)\s+([A-Z0-9][a-zA-Z0-9&.']*(?:\s+[A-Z0-9][a-zA-Z0-9&.']*)*)/.exec(text);
  if (keMatch) return keMatch[1].trim();

  // 3. "dari [Sender/Merchant]" pattern (common in credit/deposit texts)
  const dariMatch = /\b(?:dari|from)\s+([A-Z0-9][a-zA-Z0-9&.']*(?:\s+[A-Z0-9][a-zA-Z0-9&.']*)*)/.exec(text);
  if (dariMatch) return dariMatch[1].trim();

  // 4. General "ke [Name]" fallback pattern
  const simpleKeMatch = /\bke\s+([A-Z0-9][a-zA-Z0-9&.']*(?:\s+[A-Z0-9][a-zA-Z0-9&.']*)*)/.exec(text);
  if (simpleKeMatch) return simpleKeMatch[1].trim();

  // 5. "Penerima [Name]" pattern (common in Livin email/notif layout)
  const penerimaMatch = /\b(?:penerima|recipient)\s*[\n:]*\s*([A-Z0-9][a-zA-Z0-9&.']*(?:\s+[A-Z0-9][a-zA-Z0-9&.']*)*)/i.exec(text);
  if (penerimaMatch) return penerimaMatch[1].trim();

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

const BALANCE_PATTERNS = [
  /(?:sisa\s*)?saldo(?:\s+[\w\s]{1,20})?\s*(?::)?\s*Rp\s*([\d.,]+)/i,
  /sisa\s*limit(?:\s+[\w\s]{1,20})?\s*(?::)?\s*Rp\s*([\d.,]+)/i,
  /balance(?:\s+[\w\s]{1,20})?\s*(?::)?\s*Rp\s*([\d.,]+)/i,
  /balance\s*(?:is)?\s*IDR\s*([\d.,]+)/i,
];

const parseRemainingBalance = (text: string, txAmount: number): number | undefined => {
  for (const pattern of BALANCE_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const raw = match[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(raw);
      if (!isNaN(num) && num !== txAmount) {
        pattern.lastIndex = 0;
        return num;
      }
    }
    pattern.lastIndex = 0;
  }
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

  const direction = detectDirection(text, appName);
  if (!direction) return null;

  const merchant = extractMerchant(text);
  const method = detectMethod(text);
  const walletCandidate = detectWalletCandidate(appName, text);
  const remainingBalance = parseRemainingBalance(text, amount);

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
    remainingBalance,
  };
};

// ── Common Indonesian financial apps ─────────────────────────

export const DEFAULT_ALLOWLIST_APPS = [
  { package_name: "com.gojek.app", app_name: "Gojek (GoPay)" },
  { package_name: "com.gopay.app", app_name: "GoPay Standalone" },
  { package_name: "com.gojek.merchant", app_name: "GoPay Merchant" },
  { package_name: "com.gopay.merchant", app_name: "GoPay Merchant (Standalone)" },
  { package_name: "com.grab.merchant", app_name: "GrabMerchant" },
  { package_name: "com.shopee.partner", app_name: "Shopee Partner (Merchant)" },
  { package_name: "ovo.id", app_name: "OVO" },
  { package_name: "com.shopee.id", app_name: "Shopee (ShopeePay)" },
  { package_name: "id.dana", app_name: "Dana" },
  { package_name: "com.telkom.tcash", app_name: "LinkAja" },
  { package_name: "com.btpn.jenius", app_name: "Jenius" },
  { package_name: "id.co.bankjago.android", app_name: "Bank Jago" },
  { package_name: "com.seamoney.android", app_name: "SeaBank" },
  { package_name: "com.bca", app_name: "myBCA" },
  { package_name: "com.bri.brimo", app_name: "BRImo" },
  { package_name: "id.co.mandiri.mobile", app_name: "Livin' Mandiri (Classic)" },
  { package_name: "id.co.mandiri.livin", app_name: "Livin' Mandiri (New)" },
  { package_name: "com.bni.mobilebanking", app_name: "BNI Mobile Banking" },
  // Email Clients
  { package_name: "com.google.android.gm", app_name: "Gmail" },
  { package_name: "com.microsoft.office.outlook", app_name: "Outlook" },
  { package_name: "com.samsung.android.email.provider", app_name: "Samsung Email" },
  // SMS Clients
  { package_name: "com.google.android.apps.messaging", app_name: "Google Messages (SMS)" },
  { package_name: "com.samsung.android.messaging", app_name: "Samsung Messages (SMS)" },
  { package_name: "com.android.mms", app_name: "Stock SMS (MMS)" }
];

export const getAppFriendlyName = (packageName: string): string => {
  const mapping: Record<string, string> = {
    "com.gojek.app": "GoPay",
    "com.gopay.app": "GoPay",
    "com.gojek.merchant": "GoPay Merchant",
    "com.gopay.merchant": "GoPay Merchant",
    "com.grab.merchant": "GrabMerchant",
    "com.shopee.partner": "Shopee Partner",
    "ovo.id": "OVO",
    "com.shopee.id": "ShopeePay",
    "id.dana": "Dana",
    "com.telkom.tcash": "LinkAja",
    "com.btpn.jenius": "Jenius",
    "id.co.bankjago.android": "Bank Jago",
    "com.seamoney.android": "SeaBank",
    "com.bca": "myBCA",
    "com.bri.brimo": "BRImo",
    "id.co.mandiri.mobile": "Livin Mandiri",
    "id.co.mandiri.livin": "Livin Mandiri",
    "com.bni.mobilebanking": "BNI Mobile",
    "com.google.android.gm": "Gmail",
    "com.microsoft.office.outlook": "Outlook",
    "com.samsung.android.email.provider": "Email",
    "com.google.android.apps.messaging": "SMS",
    "com.samsung.android.messaging": "SMS",
    "com.android.mms": "SMS"
  };
  return mapping[packageName] || packageName;
};
