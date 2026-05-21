export const validateAmount = (value: string | number) => {
  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) && normalized > 0;
};

export const validateDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
