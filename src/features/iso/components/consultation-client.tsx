"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  completeConsultationMeeting,
  createConsultationMeeting,
} from "@/server/actions/iso.actions";
import type { IsoConsultationMeeting } from "@/server/queries/iso.queries";

export function ConsultationClient({ items }: { items: IsoConsultationMeeting[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await createConsultationMeeting({
      title: form.get("title"),
      scheduledDate: form.get("scheduledDate"),
      location: form.get("location"),
      notes: form.get("notes"),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function complete(id: string, form: HTMLFormElement) {
    const summary = String(new FormData(form).get("summary") ?? "");
    setBusy(true);
    const result = await completeConsultationMeeting(id, summary);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <form onSubmit={onCreate} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Plan a consultation meeting</h2>
        <p className="text-sm text-muted-foreground">
          ISO 45001 cl. 5.4 and SRSCWR 1977 / HSCER 1996 — consult workers in good time.
        </p>
        <Input name="title" placeholder="Title" required disabled={busy} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="datetime-local" name="scheduledDate" required disabled={busy} />
          <Input name="location" placeholder="Location or Teams link" disabled={busy} />
        </div>
        <Textarea name="notes" placeholder="Agenda" disabled={busy} />
        <Button type="submit" disabled={busy}>
          Save meeting
        </Button>
      </form>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.scheduledDate.toLocaleString("en-GB")} — {item.status.toLowerCase()}
            </p>
            {item.status !== "COMPLETED" ? (
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  complete(item.id, e.currentTarget);
                }}
              >
                <Textarea name="summary" placeholder="Minutes / decisions" required disabled={busy} />
                <Button type="submit" variant="outline" disabled={busy}>
                  Mark complete
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
