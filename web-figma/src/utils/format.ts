export const formatCurrency = (value: number) => `Rp ${Math.round(value || 0).toLocaleString("id-ID")}`;

export const formatCompactCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`;
  }

  if (Math.abs(value) >= 1_000) {
    return `Rp ${Math.round(value / 1_000)}rb`;
  }

  return formatCurrency(value);
};

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");
