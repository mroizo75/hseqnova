"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateBhtAmoMeeting } from "@/server/actions/bht.actions";
import { Loader2, CheckCircle2, Calendar, FileText } from "lucide-react";

interface BhtAmoActionsProps {
  meetingId: string;
  bhtClientId: string;
  currentStatus: string;
  currentAgenda: string;
  currentMinutes: string;
}

export function BhtAmoActions({
  meetingId,
  bhtClientId,
  currentStatus,
  currentAgenda,
  currentMinutes,
}: BhtAmoActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [agenda, setAgenda] = useState(currentAgenda);
  const [minutes, setMinutes] = useState(currentMinutes);

  async function handleSchedule() {
    if (!meetingDate) {
      toast({ variant: "destructive", title: "Velg dato" });
      return;
    }

    setLoading(true);
    try {
      const result = await updateBhtAmoMeeting({
        meetingId,
        meetingDate: new Date(meetingDate),
        status: "PREPARED",
      });

      if (result.success) {
        toast({ title: "✅ Møte planlagt" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAgenda() {
    setLoading(true);
    try {
      const result = await updateBhtAmoMeeting({
        meetingId,
        agenda,
      });

      if (result.success) {
        toast({ title: "✅ Agenda lagret" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMinutes() {
    setLoading(true);
    try {
      const result = await updateBhtAmoMeeting({
        meetingId,
        minutes,
        status: "MINUTES_DONE",
      });

      if (result.success) {
        toast({ title: "✅ Referat lagret" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const result = await updateBhtAmoMeeting({
        meetingId,
        status: "COMPLETED",
      });

      if (result.success) {
        toast({ title: "✅ AMO-møte fullført" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span>AMO-møtet er fullført og dokumentert</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Planlegg møte */}
      {currentStatus === "PLANNED" && (
        <div className="space-y-3">
          <Label htmlFor="meetingDate">Planlegg møtedato</Label>
          <div className="flex gap-4">
            <Input
              id="meetingDate"
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleSchedule} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Sett dato
            </Button>
          </div>
        </div>
      )}

      {/* Agenda */}
      {(currentStatus === "PREPARED" || currentStatus === "PLANNED") && (
        <div className="space-y-3">
          <Label htmlFor="agenda">Endelig agenda</Label>
          <Textarea
            id="agenda"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="Skriv inn endelig agenda for møtet..."
            rows={6}
          />
          <Button onClick={handleSaveAgenda} disabled={loading} variant="outline">
            Lagre agenda
          </Button>
        </div>
      )}

      {/* Referat */}
      {(currentStatus === "PREPARED" || currentStatus === "CONDUCTED") && (
        <div className="space-y-3">
          <Label htmlFor="minutes">Møtereferat</Label>
          <Textarea
            id="minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Skriv møtereferat..."
            rows={8}
          />
          <Button onClick={handleSaveMinutes} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Lagre referat
          </Button>
        </div>
      )}

      {/* Fullfør */}
      {currentStatus === "MINUTES_DONE" && (
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Marker som fullført
        </Button>
      )}
    </div>
  );
}

