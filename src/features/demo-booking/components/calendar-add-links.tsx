"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type BookedDemoView = {
  id: string;
  status: "CONFIRMED" | "CANCELLED";
  name: string;
  email: string;
  company: string;
  when: string;
  startAt: string;
  endAt: string;
  manageUrl: string;
  calendar: {
    google: string;
    outlook: string;
    icsDownloadPath: string;
  };
};

export function CalendarAddLinks({
  calendar,
  compact = false,
}: {
  calendar: BookedDemoView["calendar"];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3 sm:flex-row sm:flex-wrap"}>
      <Button asChild className="h-11 bg-emerald-700 text-white hover:bg-emerald-800">
        <a href={calendar.google} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="h-4 w-4" />
          Google Calendar
        </a>
      </Button>
      <Button asChild variant="outline" className="h-11 bg-transparent">
        <a href={calendar.outlook} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="h-4 w-4" />
          Outlook
        </a>
      </Button>
      <Button asChild variant="outline" className="h-11 bg-transparent">
        <a href={calendar.icsDownloadPath} download="hseq-nova-demo.ics">
          <Download className="h-4 w-4" />
          Download ICS
        </a>
      </Button>
    </div>
  );
}

export function BookingConfirmedCard({
  booking,
  manageHref,
}: {
  booking: BookedDemoView;
  manageHref?: string;
}) {
  return (
    <div className="border border-[hsl(var(--home-rule))] bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Confirmed</p>
      <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">Your demo is in the diary</h2>
      <p className="mt-3 text-[hsl(var(--home-ink)/0.75)]">{booking.when}</p>
      <p className="mt-1 text-sm text-[hsl(var(--home-ink)/0.65)]">
        {booking.name} · {booking.company}
      </p>
      <p className="mt-6 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
        Add the meeting to your own calendar so the time is held. We also sent a confirmation
        with an ICS file attached.
      </p>
      <div className="mt-6">
        <CalendarAddLinks calendar={booking.calendar} />
      </div>
      {manageHref ? (
        <p className="mt-6 text-sm">
          <Link href={manageHref} className="text-emerald-800 underline underline-offset-2">
            Reschedule or cancel
          </Link>
        </p>
      ) : null}
    </div>
  );
}
