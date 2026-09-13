import { SITE_CONFIG } from "@/lib/seo-config";

export const DEMO_TIME_ZONE = "Europe/London";
export const DEMO_DURATION_MINUTES = 30;
export const DEMO_MIN_NOTICE_MS = 2 * 60 * 60 * 1000;
export const DEMO_HORIZON_DAYS = 28;
export const DEMO_SLOT_START_MINUTES = [
  9 * 60,
  9 * 60 + 30,
  10 * 60,
  10 * 60 + 30,
  11 * 60,
  11 * 60 + 30,
  13 * 60,
  13 * 60 + 30,
  14 * 60,
  14 * 60 + 30,
  15 * 60,
  15 * 60 + 30,
  16 * 60,
  16 * 60 + 30,
] as const;

export function getDemoHost() {
  return {
    name: process.env.DEMO_HOST_NAME?.trim() || SITE_CONFIG.contactName,
    email: process.env.DEMO_HOST_EMAIL?.trim() || SITE_CONFIG.contactEmail,
    meetingUrl: process.env.DEMO_MEETING_URL?.trim() || "",
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function partsInZone(date: Date, timeZone: string) {
  const items = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    items.find((part) => part.type === type)?.value ?? "00";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

function asUtcClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
): Date {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.000Z`,
  );
}

export function zonedDateTimeToUtc(
  date: string,
  hour: number,
  minute: number,
  timeZone = DEMO_TIME_ZONE,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const asUtc = asUtcClock(year, month, day, hour, minute);
  const shown = partsInZone(asUtc, timeZone);
  const offsetMs =
    asUtc.getTime() -
    asUtcClock(shown.year, shown.month, shown.day, shown.hour, shown.minute, shown.second).getTime();
  return new Date(asUtc.getTime() + offsetMs);
}

export function toDateKey(date: Date, timeZone = DEMO_TIME_ZONE): string {
  const parts = partsInZone(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function londonYearMonth(now = new Date()) {
  const parts = partsInZone(now, DEMO_TIME_ZONE);
  return { year: parts.year, month: parts.month };
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const utc = new Date(`${dateKey}T00:00:00.000Z`);
  utc.setUTCDate(utc.getUTCDate() + days);
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function weekdayIndexMonday0(dateKey: string): number {
  const utc = new Date(`${dateKey}T12:00:00.000Z`);
  return (utc.getUTCDay() + 6) % 7;
}

function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function firstMonday(year: number, month: number): string {
  const first = `${year}-${pad(month)}-01`;
  const offset = (7 - weekdayIndexMonday0(first)) % 7;
  return addDaysToDateKey(first, offset);
}

function lastMonday(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${pad(month)}-${pad(lastDay)}`;
  return addDaysToDateKey(last, -weekdayIndexMonday0(last));
}

function observedWeekday(dateKey: string): string {
  const weekday = weekdayIndexMonday0(dateKey);
  if (weekday === 5) return addDaysToDateKey(dateKey, 2);
  if (weekday === 6) return addDaysToDateKey(dateKey, 1);
  return dateKey;
}

export function ukBankHolidayKeys(year: number): Set<string> {
  const holidays = new Set<string>();
  holidays.add(observedWeekday(`${year}-01-01`));
  const easter = easterSunday(year);
  holidays.add(addDaysToDateKey(easter, -2));
  holidays.add(addDaysToDateKey(easter, 1));
  holidays.add(firstMonday(year, 5));
  holidays.add(lastMonday(year, 5));
  holidays.add(lastMonday(year, 8));

  const christmas = `${year}-12-25`;
  const boxing = `${year}-12-26`;
  const observedChristmas = observedWeekday(christmas);
  holidays.add(observedChristmas);
  let observedBoxing = observedWeekday(boxing);
  if (observedBoxing === observedChristmas) {
    observedBoxing = addDaysToDateKey(observedBoxing, 1);
  }
  holidays.add(observedBoxing);
  return holidays;
}

export function isUkWorkingDay(dateKey: string): boolean {
  const weekday = weekdayIndexMonday0(dateKey);
  if (weekday >= 5) return false;
  const year = Number(dateKey.slice(0, 4));
  return !ukBankHolidayKeys(year).has(dateKey);
}

export type DemoSlot = {
  startAt: string;
  endAt: string;
  dateKey: string;
  label: string;
};

export function buildSlotsForDay(
  dateKey: string,
  bookedStartTimes: Iterable<string>,
  now = new Date(),
): DemoSlot[] {
  if (!isUkWorkingDay(dateKey)) return [];
  const taken = new Set(bookedStartTimes);
  const slots: DemoSlot[] = [];
  for (const minutes of DEMO_SLOT_START_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const start = zonedDateTimeToUtc(dateKey, hour, minute);
    if (toDateKey(start) !== dateKey) continue;
    if (start.getTime() - now.getTime() < DEMO_MIN_NOTICE_MS) continue;
    const startIso = start.toISOString();
    if (taken.has(startIso)) continue;
    const end = new Date(start.getTime() + DEMO_DURATION_MINUTES * 60 * 1000);
    slots.push({
      startAt: startIso,
      endAt: end.toISOString(),
      dateKey,
      label: `${pad(hour)}:${pad(minute)}`,
    });
  }
  return slots;
}

export function monthKeys(year: number, month: number): string[] {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const keys: string[] = [];
  for (let day = 1; day <= lastDay; day += 1) {
    keys.push(`${year}-${pad(month)}-${pad(day)}`);
  }
  return keys;
}

export function bookingWindow(now = new Date()) {
  const startKey = toDateKey(now);
  const endKey = addDaysToDateKey(startKey, DEMO_HORIZON_DAYS);
  return { startKey, endKey };
}

export function isStartWithinWindow(startAt: Date, now = new Date()): boolean {
  const { startKey, endKey } = bookingWindow(now);
  const dateKey = toDateKey(startAt);
  if (dateKey < startKey || dateKey > endKey) return false;
  return startAt.getTime() - now.getTime() >= DEMO_MIN_NOTICE_MS;
}

export function formatDemoRange(startAt: Date, endAt: Date, timeZone = DEMO_TIME_ZONE): string {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(startAt);
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const zone = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    timeZoneName: "short",
    hour: "numeric",
  })
    .formatToParts(startAt)
    .find((part) => part.type === "timeZoneName")?.value ?? "UK time";
  return `${datePart}, ${timeFmt.format(startAt)}–${timeFmt.format(endAt)} ${zone}`;
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function icsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldIcs(line: string): string {
  if (line.length <= 74) return line;
  const chunks = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    chunks.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join("\r\n");
}

export type DemoCalendarInput = {
  id: string;
  startAt: Date;
  endAt: Date;
  attendeeName: string;
  attendeeEmail: string;
  company: string;
  manageUrl: string;
  method?: "REQUEST" | "CANCEL";
  sequence?: number;
};

export function buildDemoIcs(input: DemoCalendarInput): string {
  const host = getDemoHost();
  const summary = "HSEQ Nova product demo";
  const location = host.meetingUrl || "Video call — link sent before the demo";
  const description = [
    `30-minute walkthrough of HSEQ Nova with ${host.name}.`,
    host.meetingUrl ? `Join: ${host.meetingUrl}` : "A video-call link will follow by email if it is not already in this invite.",
    `Company: ${input.company}`,
    `Manage or cancel: ${input.manageUrl}`,
  ].join("\n");
  const status = input.method === "CANCEL" ? "CANCELLED" : "CONFIRMED";
  const method = input.method ?? "REQUEST";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HSEQ Nova//Demo Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:demo-${input.id}@hseqnova.co.uk`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(input.startAt)}`,
    `DTEND:${icsUtc(input.endAt)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(location)}`,
    `ORGANIZER;CN=${icsEscape(host.name)}:mailto:${host.email}`,
    `ATTENDEE;CN=${icsEscape(input.attendeeName)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
    `STATUS:${status}`,
    `SEQUENCE:${input.sequence ?? 0}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcs).join("\r\n")}\r\n`;
}

export function googleCalendarUrl(input: {
  startAt: Date;
  endAt: Date;
  details: string;
  location: string;
}): string {
  const dates = `${icsUtc(input.startAt)}/${icsUtc(input.endAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "HSEQ Nova product demo",
    dates,
    details: input.details,
    location: input.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(input: {
  startAt: Date;
  endAt: Date;
  details: string;
  location: string;
}): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: "HSEQ Nova product demo",
    startdt: input.startAt.toISOString(),
    enddt: input.endAt.toISOString(),
    body: input.details,
    location: input.location,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function demoCalendarLinks(input: DemoCalendarInput & { manageToken: string }) {
  const host = getDemoHost();
  const location = host.meetingUrl || "Video call";
  const details = `30-minute HSEQ Nova demo with ${host.name}. Manage: ${input.manageUrl}`;
  return {
    google: googleCalendarUrl({
      startAt: input.startAt,
      endAt: input.endAt,
      details,
      location,
    }),
    outlook: outlookCalendarUrl({
      startAt: input.startAt,
      endAt: input.endAt,
      details,
      location,
    }),
    icsDownloadPath: `/api/demo/ics/${encodeURIComponent(input.manageToken)}`,
  };
}
