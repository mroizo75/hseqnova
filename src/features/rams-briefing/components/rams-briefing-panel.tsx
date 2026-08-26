"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordRamsBriefing } from "@/server/actions/rams-briefing.actions";
import { useToast } from "@/hooks/use-toast";
import type { RamsBriefingRecord } from "@/server/queries/rams-briefing.queries";
import type { RamsHazardSnapshot } from "@/features/rams-briefing/lib/rams-briefing-snapshot";

type Props = {
  sjaAnalysisId: string;
  canRecord: boolean;
  previewHazards: RamsHazardSnapshot[];
  briefings: RamsBriefingRecord[];
};

export function RamsBriefingPanel({ sjaAnalysisId, canRecord, previewHazards, briefings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await recordRamsBriefing({
        sjaAnalysisId,
        attendees,
        notes,
      });
      if (result.success) {
        toast({ title: "Pre-start briefing recorded" });
        setAttendees("");
        setNotes("");
        router.refresh();
        return;
      }
      toast({ variant: "destructive", title: "Could not save the briefing", description: result.error });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-start briefing</CardTitle>
        <CardDescription>
          Five minutes from this RAMS: method, key hazards and who was briefed (MHSWR 1999 reg. 13; CDM 2015
          reg. 15).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewHazards.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {previewHazards.map((hazard) => (
              <li key={`${hazard.activity}-${hazard.hazard}`} className="rounded-md border p-3">
                <p className="font-medium">{hazard.activity}</p>
                <p className="text-muted-foreground">{hazard.hazard}</p>
                <p className="mt-1">{hazard.measures}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No hazards on this RAMS yet.</p>
        )}

        {canRecord ? (
          <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="briefing-attendees">People briefed *</Label>
              <Textarea
                id="briefing-attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="One name per line"
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="briefing-notes">Notes on the day</Label>
              <Textarea
                id="briefing-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Weather, access, extra controls"
                rows={2}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Record briefing"}
            </Button>
          </form>
        ) : null}

        {briefings.length > 0 ? (
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Recorded briefings</p>
            {briefings.map((briefing) => (
              <div key={briefing.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {new Date(briefing.briefedAt).toLocaleString("en-GB")} · {briefing.briefedByName}
                </p>
                <p className="text-muted-foreground">Attendees: {briefing.attendees.join(", ")}</p>
                {briefing.notes ? <p className="mt-1">{briefing.notes}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
