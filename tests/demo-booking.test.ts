import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDemoIcs,
  buildSlotsForDay,
  DEMO_DURATION_MINUTES,
  formatDemoRange,
  googleCalendarUrl,
  isUkWorkingDay,
  outlookCalendarUrl,
  ukBankHolidayKeys,
  zonedDateTimeToUtc,
} from "../src/lib/demo-booking";

describe("demo booking slots", () => {
  it("skips weekends and UK bank holidays", () => {
    assert.equal(isUkWorkingDay("2026-09-14"), true);
    assert.equal(isUkWorkingDay("2026-09-12"), false);
    assert.equal(isUkWorkingDay("2026-09-13"), false);
    assert.equal(ukBankHolidayKeys(2026).has("2026-12-25"), true);
    assert.equal(isUkWorkingDay("2026-12-25"), false);
  });

  it("converts London wall time to UTC in BST", () => {
    const start = zonedDateTimeToUtc("2026-09-14", 9, 0);
    assert.equal(start.toISOString(), "2026-09-14T08:00:00.000Z");
  });

  it("converts London wall time to UTC in GMT", () => {
    const start = zonedDateTimeToUtc("2026-01-12", 9, 0);
    assert.equal(start.toISOString(), "2026-01-12T09:00:00.000Z");
  });

  it("omits taken slots, lunch and times inside the notice window", () => {
    const now = new Date("2026-09-14T07:00:00.000Z");
    const taken = ["2026-09-14T09:00:00.000Z"];
    const slots = buildSlotsForDay("2026-09-14", taken, now);
    assert.equal(slots.some((slot) => slot.label === "12:00"), false);
    assert.equal(slots.some((slot) => slot.startAt === "2026-09-14T09:00:00.000Z"), false);
    assert.equal(slots[0]?.label, "10:30");
    const first = slots[0];
    assert.ok(first);
    const end = new Date(first.endAt).getTime() - new Date(first.startAt).getTime();
    assert.equal(end, DEMO_DURATION_MINUTES * 60 * 1000);
  });
});

describe("demo calendar files", () => {
  it("builds an ICS invite with organizer and attendee", () => {
    const ics = buildDemoIcs({
      id: "demo123",
      startAt: new Date("2026-09-14T08:00:00.000Z"),
      endAt: new Date("2026-09-14T08:30:00.000Z"),
      attendeeName: "Jane Smith",
      attendeeEmail: "jane@example.co.uk",
      company: "Smith Builders Ltd",
      manageUrl: "https://hseqnova.co.uk/book-a-demo/manage/abc",
    });
    assert.equal(ics.includes("BEGIN:VEVENT"), true);
    assert.equal(ics.includes("SUMMARY:HSEQ Nova product demo"), true);
    assert.equal(ics.includes("ORGANIZER"), true);
    assert.equal(ics.includes("jane@example.co.uk"), true);
    assert.equal(ics.includes("METHOD:REQUEST"), true);
  });

  it("builds Google and Outlook add-to-calendar URLs", () => {
    const startAt = new Date("2026-09-14T08:00:00.000Z");
    const endAt = new Date("2026-09-14T08:30:00.000Z");
    const google = googleCalendarUrl({
      startAt,
      endAt,
      details: "Demo",
      location: "Video call",
    });
    const outlook = outlookCalendarUrl({
      startAt,
      endAt,
      details: "Demo",
      location: "Video call",
    });
    assert.equal(google.startsWith("https://calendar.google.com/calendar/render?"), true);
    assert.equal(google.includes("dates=20260914T080000Z"), true);
    assert.equal(outlook.startsWith("https://outlook.office.com/calendar/0/deeplink/compose?"), true);
  });

  it("formats the range in UK English", () => {
    const label = formatDemoRange(
      new Date("2026-09-14T08:00:00.000Z"),
      new Date("2026-09-14T08:30:00.000Z"),
    );
    assert.equal(label.includes("14 September 2026"), true);
    assert.equal(label.includes("Monday"), true);
  });
});
