export const formatCurrency = (value: number) => 
  `Rp ${Math.round(value || 0).toLocaleString("id-ID")}`.replace(/\s/g, " ");

export const formatCompactCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    const formattedNum = (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1).replace(".", ",");
    return `Rp ${formattedNum}jt`;
  }

  if (Math.abs(value) >= 1_000) {
    return `Rp ${Math.round(value / 1_000)}rb`;
  }

  return formatCurrency(value);
};

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const parseRawCurrencyInput = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  
  let cleaned = value.trim();
  
  // Remove "Rp" prefix and empty spaces
  cleaned = cleaned.replace(/[Rp\s]/gi, "");

  // Check if it has a decimal fraction suffix (e.g., ,00 or .00)
  // If it does, we slice it off to avoid getting multiplied by 100 when removing formatting separators.
  if (/[.,]\d{2}$/.test(cleaned)) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  } else if (/[.,]\d{1}$/.test(cleaned)) {
    // Single digit decimal like .0 or ,0
    cleaned = cleaned.substring(0, cleaned.length - 2);
  }

  // Remove all non-numeric characters (thousands separators like dots or commas)
  const onlyDigits = cleaned.replace(/\D/g, "");
  const parsed = parseFloat(onlyDigits);
  return isNaN(parsed) ? 0 : parsed;
};

