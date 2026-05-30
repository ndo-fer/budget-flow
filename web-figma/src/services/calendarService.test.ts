import { describe, it, expect, vi } from "vitest";
import {
  recurringToCalendarEvent,
  generateICS,
  getGoogleCalendarUrl,
} from "./calendarService";

describe("calendarService", () => {
  describe("recurringToCalendarEvent", () => {
    it("handles monthly frequency correctly", () => {
      const item = {
        id: "123",
        amount: 250000,
        frequency: "monthly",
        day_of_month: 10,
        note: "Monthly Rent",
        budget_categories: {
          name: "Rent",
          color: "#4A90E2",
        },
      };

      const event = recurringToCalendarEvent(item);

      expect(event.uid).toBe("123");
      expect(event.title).toContain("Rent");
      expect(event.title).toContain("250.000");
      expect(event.rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=10");
      expect(event.startDate).toContain("-10"); // Should end with day 10
    });

    it("handles weekly frequency correctly and aligns to weekday of start_date", () => {
      const item = {
        id: "456",
        amount: 50000,
        frequency: "weekly",
        start_date: "2026-05-01", // Friday
        budget_categories: {
          name: "Groceries",
          color: "#2ECC71",
        },
      };

      const event = recurringToCalendarEvent(item);

      expect(event.uid).toBe("456");
      expect(event.rrule).toBe("FREQ=WEEKLY");
      // The resolved startDate must be a Friday (getDay() === 5)
      const dayOfWeek = new Date(event.startDate).getDay();
      expect(dayOfWeek).toBe(5);
    });

    it("handles daily frequency correctly", () => {
      const item = {
        id: "789",
        amount: 15000,
        frequency: "daily",
        budget_categories: {
          name: "Coffee",
          color: "#F1C40F",
        },
      };

      const event = recurringToCalendarEvent(item);

      expect(event.uid).toBe("789");
      expect(event.rrule).toBe("FREQ=DAILY");
      // The resolved startDate should be today's date format (YYYY-MM-DD)
      expect(event.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("generateICS", () => {
    it("produces valid VCALENDAR/VEVENT headers and structure", () => {
      const events = [
        {
          uid: "test-uid",
          title: "💸 Event Title",
          startDate: "2026-05-15",
          rrule: "FREQ=MONTHLY;BYMONTHDAY=15",
        },
      ];

      const ics = generateICS(events);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("UID:test-uid@budget-flow");
      expect(ics).toContain("DTSTART;VALUE=DATE:20260515");
      expect(ics).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=15");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("END:VCALENDAR");
    });
  });

  describe("getGoogleCalendarUrl", () => {
    it("generates correct Templated URL with action template", () => {
      const event = {
        uid: "test-uid",
        title: "Test Event",
        startDate: "2026-05-15",
        description: "Test description",
        rrule: "FREQ=MONTHLY;BYMONTHDAY=15",
      };

      const url = getGoogleCalendarUrl(event);
      expect(url).toContain("https://calendar.google.com/calendar/render");
      expect(url).toContain("action=TEMPLATE");
      expect(url).toContain("text=Test+Event");
      expect(url).toContain("dates=20260515%2F20260515");
      expect(url).toContain("details=Test+description");
      expect(url).toContain("recur=RRULE%3AFREQ%3DMONTHLY%3BBYMONTHDAY%3D15");
    });
  });
});
