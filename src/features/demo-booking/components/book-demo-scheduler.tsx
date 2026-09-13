"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BookingConfirmedCard, type BookedDemoView } from "./calendar-add-links";

type Slot = { startAt: string; endAt: string; dateKey: string; label: string };
type Day = { date: string; slots: Slot[] };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function weekdayOffset(dateKey: string): number {
  return (new Date(`${dateKey}T12:00:00.000Z`).getUTCDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function BookDemoScheduler({
  initialYear,
  initialMonth,
  mode = "book",
  manageToken,
}: {
  initialYear: number;
  initialMonth: number;
  mode?: "book" | "reschedule";
  manageToken?: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookedDemoView | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    notes: "",
    website: "",
  });

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo/slots?year=${y}&month=${m}`);
      const data = (await res.json()) as { days?: Day[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not load times.");
      }
      setDays(data.days ?? []);
    } catch (err) {
      setDays([]);
      setError(err instanceof Error ? err.message : "Could not load times.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(year, month);
  }, [year, month, load]);

  const slotsByDate = useMemo(() => new Map(days.map((day) => [day.date, day.slots])), [days]);
  const selectedSlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];

  const grid = useMemo(() => {
    const count = daysInMonth(year, month);
    const first = `${year}-${String(month).padStart(2, "0")}-01`;
    const pad = weekdayOffset(first);
    const cells: Array<{ dateKey: string | null; slots: Slot[] }> = [];
    for (let i = 0; i < pad; i += 1) cells.push({ dateKey: null, slots: [] });
    for (let day = 1; day <= count; day += 1) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ dateKey, slots: slotsByDate.get(dateKey) ?? [] });
    }
    return cells;
  }, [year, month, slotsByDate]);

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  function pickDay(dateKey: string, slots: Slot[]) {
    if (slots.length === 0) return;
    setSelectedDate(dateKey);
    setSelectedSlot(null);
  }

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const endpoint =
        mode === "reschedule" && manageToken
          ? `/api/demo/manage/${manageToken}/reschedule`
          : "/api/demo/book";
      const payload =
        mode === "reschedule"
          ? { startAt: selectedSlot.startAt }
          : {
              startAt: selectedSlot.startAt,
              name: form.name,
              email: form.email,
              phone: form.phone,
              company: form.company,
              jobTitle: form.jobTitle,
              notes: form.notes,
              _hp: form.website,
            };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as BookedDemoView & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not complete the booking.");
      }
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (booking) {
    return (
      <BookingConfirmedCard
        booking={booking}
        manageHref={mode === "book" ? `/book-a-demo/manage/${booking.manageUrl.split("/").pop()}` : undefined}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] p-5 text-[hsl(var(--home-ink-fg))] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/20 text-white hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-xl font-medium tracking-tight">{monthLabel(year, month)}</h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/20 text-white hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.14em] text-white/50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, index) => {
            if (!cell.dateKey) {
              return <div key={`pad-${index}`} className="min-h-11" />;
            }
            const dayNum = Number(cell.dateKey.slice(-2));
            const available = cell.slots.length > 0;
            const selected = selectedDate === cell.dateKey;
            return (
              <button
                key={cell.dateKey}
                type="button"
                disabled={!available}
                onClick={() => pickDay(cell.dateKey as string, cell.slots)}
                className={cn(
                  "min-h-11 rounded-sm text-sm transition-colors",
                  available
                    ? "text-white hover:bg-white/10"
                    : "cursor-not-allowed text-white/25",
                  selected && "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
                )}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-white/55">Times are UK working days, 9:00–17:00, excluding 12:00–13:00.</p>
      </div>

      <div>
        {loading ? (
          <p className="text-sm text-[hsl(var(--home-ink)/0.7)]">Loading available times…</p>
        ) : null}
        {error ? (
          <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}

        {!selectedDate ? (
          <div className="border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] p-6">
            <h3 className="font-display text-xl font-medium">Choose a day</h3>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              Highlighted dates have free 30-minute slots. Pick a day, then a time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-medium">
                {new Intl.DateTimeFormat("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date(`${selectedDate}T12:00:00.000Z`))}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedSlots.map((slot) => {
                  const active = selectedSlot?.startAt === slot.startAt;
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "min-h-11 border px-3 text-sm font-medium transition-colors",
                        active
                          ? "border-emerald-800 bg-emerald-800 text-white"
                          : "border-[hsl(var(--home-rule))] bg-white text-[hsl(var(--home-ink))] hover:border-emerald-700",
                      )}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSlot ? (
              <form onSubmit={submitBooking} className="space-y-4 border border-[hsl(var(--home-rule))] bg-white p-5">
                {mode === "book" ? (
                  <>
                    <h3 className="font-display text-lg font-medium">Your details</h3>
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="website">Website</label>
                      <Input
                        id="website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(event) => setForm({ ...form, website: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          required
                          value={form.name}
                          onChange={(event) => setForm({ ...form, name: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Work email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(event) => setForm({ ...form, email: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          required
                          value={form.company}
                          onChange={(event) => setForm({ ...form, company: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telephone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="jobTitle">Role (optional)</Label>
                        <Input
                          id="jobTitle"
                          value={form.jobTitle}
                          onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="notes">What do you want to see? (optional)</Label>
                        <Textarea
                          id="notes"
                          rows={3}
                          value={form.notes}
                          onChange={(event) => setForm({ ...form, notes: event.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[hsl(var(--home-ink)/0.75)]">
                    Move the demo to {selectedSlot.label} UK time.
                  </p>
                )}
                <Button type="submit" disabled={submitting} className="h-11 w-full sm:w-auto">
                  {submitting
                    ? "Booking…"
                    : mode === "reschedule"
                      ? "Confirm new time"
                      : "Book this demo"}
                </Button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
