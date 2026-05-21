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

export const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export const getToday = () => new Date().toISOString().slice(0, 10);

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
