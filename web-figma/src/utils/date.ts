export const getMonthDateRange = (monthStr: string) => {
  if (!monthStr || !monthStr.includes("-")) {
    return { startDate: "", endDate: "", lastDay: 0 };
  }

  const [year, month] = monthStr.split("-").map(Number);
  const endDate = new Date(year, month, 0);

  return {
    startDate: `${year}-${String(month).padStart(2, "0")}-01`,
    endDate: `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
    lastDay: endDate.getDate(),
  };
};

export const getDaysInMonth = (monthStr: string) => getMonthDateRange(monthStr).lastDay || 0;

export const getToday = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCurrentMonth = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const formatHumanDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const formatMonthLabel = (monthStr: string) =>
  new Date(`${monthStr}-01T00:00:00`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

export const shiftMonth = (monthStr: string, delta: number) => {
  const date = new Date(`${monthStr}-01T00:00:00`);
  date.setMonth(date.getMonth() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// ── Timezone-Aware Bounds & Formatting ────────────────────────

export const toLocalDateString = (d: Date | string): string => {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getLocalDayBounds = (dateStr: string) => {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString()
  };
};

export const getLocalMonthBounds = (monthStr: string) => {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString()
  };
};
