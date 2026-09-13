"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookDemoScheduler } from "@/features/demo-booking/components/book-demo-scheduler";
import { BookingConfirmedCard, type BookedDemoView } from "@/features/demo-booking/components/calendar-add-links";
import { londonYearMonth } from "@/lib/demo-booking";
import { Button } from "@/components/ui/button";

export function ManageDemoClient({ token }: { token: string }) {
  const { year, month } = londonYearMonth();
  const [booking, setBooking] = useState<BookedDemoView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/demo/manage/${token}`);
        const data = (await res.json()) as BookedDemoView & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Booking not found.");
        }
        if (!cancelled) setBooking(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Booking not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function cancelBooking() {
    if (!window.confirm("Cancel this demo?")) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo/manage/${token}/cancel`, { method: "POST" });
      const data = (await res.json()) as BookedDemoView & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not cancel.");
      setBooking(data);
      setRescheduling(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <p className="text-[hsl(var(--home-ink)/0.7)]">Loading your booking…</p>;
  }
  if (error && !booking) {
    return (
      <div className="border border-[hsl(var(--home-rule))] bg-white p-8">
        <h1 className="font-display text-2xl font-medium">Booking not found</h1>
        <p className="mt-3 text-[hsl(var(--home-ink)/0.72)]">{error}</p>
        <Button asChild className="mt-6">
          <Link href="/book-a-demo">Book a new demo</Link>
        </Button>
      </div>
    );
  }
  if (!booking) return null;

  if (booking.status === "CANCELLED") {
    return (
      <div className="border border-[hsl(var(--home-rule))] bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Cancelled</p>
        <h1 className="mt-2 font-display text-3xl font-medium">This demo is no longer booked</h1>
        <p className="mt-3 text-[hsl(var(--home-ink)/0.72)]">
          The slot for {booking.when} has been released. You can book a new time whenever you are ready.
        </p>
        <Button asChild className="mt-6">
          <Link href="/book-a-demo">Book a demo</Link>
        </Button>
      </div>
    );
  }

  if (rescheduling) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-medium">Move your demo</h1>
          <p className="mt-2 text-[hsl(var(--home-ink)/0.72)]">Currently booked for {booking.when}.</p>
        </div>
        <BookDemoScheduler
          initialYear={year}
          initialMonth={month}
          mode="reschedule"
          manageToken={token}
        />
        <button
          type="button"
          className="text-sm text-emerald-800 underline underline-offset-2"
          onClick={() => setRescheduling(false)}
        >
          Keep the current time
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      <BookingConfirmedCard booking={booking} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="bg-transparent" onClick={() => setRescheduling(true)}>
          Reschedule
        </Button>
        <Button type="button" variant="outline" className="bg-transparent" disabled={cancelling} onClick={() => void cancelBooking()}>
          {cancelling ? "Cancelling…" : "Cancel demo"}
        </Button>
      </div>
    </div>
  );
}
