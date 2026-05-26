/**
 * calendarService.ts
 *
 * Calendar integration for Budget Flow (web-only, no API keys needed):
 *
 *  1. generateICS()          → create .ics file content from recurring expenses
 *  2. downloadICS()          → trigger browser download of the .ics file
 *  3. getGoogleCalendarUrl() → deeplink to Google Calendar "create event" page
 *  4. exportRecurringToCalendar() → one-click export all recurring to .ics
 */

import { toLocalDateString } from "../utils/date";

export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** RRULE string, e.g. "FREQ=MONTHLY;BYMONTHDAY=15" */
  rrule?: string;
  /** Reminder minutes before (default: 2 days = 2880) */
  reminderMinutes?: number;
  /** Hex color hint (used in Google Calendar deeplink) */
  color?: string;
}

// ── ICS generation ────────────────────────────────────────────

const formatICSDate = (dateStr: string): string =>
  dateStr.replace(/-/g, "") + "T080000Z";

const buildVEVENT = (event: CalendarEvent): string => {
  const dtStart = formatICSDate(event.startDate);
  const dtEnd = formatICSDate(event.startDate); // same-day event
  const reminderMins = event.reminderMinutes ?? 2880; // 2 days default
  const reminderHours = Math.floor(reminderMins / 60);
  const triggerStr = reminderMins >= 1440
    ? `-P${Math.floor(reminderMins / 1440)}D`
    : `-PT${reminderHours}H`;

  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}@budget-flow`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${dtStart.slice(0, 8)}`,
    `DTEND;VALUE=DATE:${dtEnd.slice(0, 8)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.rrule ? `RRULE:${event.rrule}` : "",
    "BEGIN:VALARM",
    `TRIGGER:${triggerStr}`,
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${event.title}`,
    "END:VALARM",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\r\n");
};

export const generateICS = (events: CalendarEvent[]): string => {
  const vevents = events.map(buildVEVENT).join("\r\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BudgetFlow//BudgetFlow Web//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Budget Flow – Recurring Expenses",
    "X-WR-TIMEZONE:Asia/Jakarta",
    vevents,
    "END:VCALENDAR",
  ].join("\r\n");
};

// ── Download ──────────────────────────────────────────────────

export const downloadICS = (events: CalendarEvent[], filename = "budget-flow-calendar.ics") => {
  const content = generateICS(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Google Calendar deeplink ──────────────────────────────────

export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${event.startDate.replace(/-/g, "")}/${event.startDate.replace(/-/g, "")}`,
    details: event.description ?? "",
    ...(event.rrule ? { recur: `RRULE:${event.rrule}` } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ── Convert recurring expense → CalendarEvent ─────────────────

const formatIDR = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

export const recurringToCalendarEvent = (item: any): CalendarEvent => {
  const categoryName: string = item.budget_categories?.name ?? "Expense";
  const amount: number = item.amount ?? 0;
  const dayOfMonth: number = item.day_of_month ?? 1;

  // Build the next occurrence date
  const now = new Date();
  const targetDay = Math.min(dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  const nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
  if (nextDate < now) nextDate.setMonth(nextDate.getMonth() + 1);
  const startDate = toLocalDateString(nextDate);

  return {
    uid: item.id ?? Math.random().toString(36).slice(2),
    title: `💸 ${categoryName} (${formatIDR(amount)})`,
    description: [
      `Kategori: ${categoryName}`,
      `Jumlah: ${formatIDR(amount)}`,
      `Frekuensi: ${item.frequency ?? "monthly"}`,
      item.note ? `Catatan: ${item.note}` : "",
      "Dibuat oleh Budget Flow",
    ]
      .filter(Boolean)
      .join("\n"),
    startDate,
    rrule:
      item.frequency === "monthly"
        ? `FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`
        : item.frequency === "weekly"
          ? "FREQ=WEEKLY"
          : undefined,
    reminderMinutes: 2 * 24 * 60, // 2 days before
    color: item.budget_categories?.color,
  };
};

// ── Export all recurring ──────────────────────────────────────

export const exportAllRecurringToICS = (recurringExpenses: any[]) => {
  const events = recurringExpenses.map(recurringToCalendarEvent);
  downloadICS(events, `budget-flow-recurring-${new Date().toISOString().slice(0, 10)}.ics`);
  return events.length;
};
