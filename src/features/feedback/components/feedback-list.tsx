"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateCustomerFeedbackStatus } from "@/server/actions/feedback.actions";
import { useToast } from "@/hooks/use-toast";
import type {
  CustomerFeedback,
  FeedbackStatus,
  FeedbackSentiment,
} from "@prisma/client";

interface FeedbackListProps {
  feedbacks: (CustomerFeedback & {
    recordedBy: { name: string | null; email: string } | null;
    followUpOwner: { name: string | null; email: string } | null;
  })[];
  users: Array<{ id: string; name?: string | null; email: string }>;
}

const statusLabels: Record<FeedbackStatus, string> = {
  NEW: "Ny",
  ACKNOWLEDGED: "Delt med team",
  SHARED: "Publisert",
  FOLLOW_UP: "Under oppfølging",
  CLOSED: "Lukket",
};

const statusColors: Record<FeedbackStatus, string> = {
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SHARED: "bg-green-100 text-green-800 border-green-200",
  FOLLOW_UP: "bg-amber-100 text-amber-800 border-amber-200",
  CLOSED: "bg-slate-100 text-slate-800 border-slate-200",
};

const sentimentColors: Record<FeedbackSentiment, string> = {
  POSITIVE: "bg-green-100 text-green-800 border-green-200",
  NEUTRAL: "bg-slate-100 text-slate-800 border-slate-200",
  NEGATIVE: "bg-red-100 text-red-800 border-red-200",
};

const NO_OWNER = "__none__";

export function FeedbackList({ feedbacks, users }: FeedbackListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<FeedbackStatus>("NEW");
  const [owner, setOwner] = useState<string>(NO_OWNER);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = () => {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await updateCustomerFeedbackStatus({
        id: selectedId,
        followUpStatus: status,
        followUpOwnerId: owner,
        followUpNotes: notes,
      });

      if (result.success) {
        toast({
          title: "✅ Oppdatert",
          description: "Status for tilbakemeldingen er oppdatert.",
        });
        setSelectedId(null);
        setNotes("");
      } else {
        toast({
          variant: "destructive",
          title: "Kunne ikke oppdatere",
          description: result.error || "Prøv igjen senere",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Tilbakemelding</TableHead>
                  <TableHead>Stemning</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ansvarlig</TableHead>
                  <TableHead className="text-right">Oppfølging</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="space-y-1">
                      <p className="font-medium">
                        {feedback.customerName || "Anonym"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feedback.customerCompany || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(feedback.recordedAt).toLocaleDateString("nb-NO")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{feedback.summary}</p>
                      {feedback.rating && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Vurdering: {feedback.rating}/5
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={sentimentColors[feedback.sentiment]}>
                        {feedback.sentiment === "POSITIVE"
                          ? "Positiv"
                          : feedback.sentiment === "NEUTRAL"
                          ? "Nøytral"
                          : "Negativ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[feedback.followUpStatus]}>
                        {statusLabels[feedback.followUpStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {feedback.followUpOwner?.name ||
                          feedback.followUpOwner?.email ||
                          "Ikke satt"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registrert av{" "}
                        {feedback.recordedBy?.name ||
                          feedback.recordedBy?.email ||
                          "Ukjent"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedId(feedback.id);
                          setStatus(feedback.followUpStatus);
                          setOwner(
                            feedback.followUpOwnerId ?? NO_OWNER
                          );
                          setNotes(feedback.followUpNotes || "");
                        }}
                      >
                        Oppdater
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id} className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {feedback.customerName || "Anonym"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {feedback.customerCompany || "—"}
                      </p>
                    </div>
                    <Badge className={sentimentColors[feedback.sentiment]}>
                      {feedback.sentiment === "POSITIVE"
                        ? "Positiv"
                        : feedback.sentiment === "NEUTRAL"
                        ? "Nøytral"
                        : "Negativ"}
                    </Badge>
                  </div>
                  <p className="text-sm">{feedback.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColors[feedback.followUpStatus]}>
                      {statusLabels[feedback.followUpStatus]}
                    </Badge>
                    {feedback.rating && (
                      <Badge variant="outline">{feedback.rating}/5</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Registrert {new Date(feedback.recordedAt).toLocaleDateString("nb-NO")} av{" "}
                    {feedback.recordedBy?.name || feedback.recordedBy?.email || "Ukjent"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedId(feedback.id);
                      setStatus(feedback.followUpStatus);
                      setOwner(feedback.followUpOwnerId ?? NO_OWNER);
                      setNotes(feedback.followUpNotes || "");
                    }}
                  >
                    Oppdater status
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>Oppdater oppfølging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Oppfølgingsstatus</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as FeedbackStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ansvarlig</Label>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansvarlig" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OWNER}>Ingen</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpNotes">Notater</Label>
              <Textarea
                id="followUpNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedId(null)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "Lagrer..." : "Lagre oppdatering"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

