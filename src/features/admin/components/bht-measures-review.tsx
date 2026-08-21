"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { confirmMeasuresReviewed } from "@/server/actions/bht.actions";
import { Loader2, CheckCircle2, Eye, MessageSquare } from "lucide-react";

interface Measure {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: Date | null;
  createdAt: Date;
  responsible: { name: string } | null;
}

interface BhtMeasuresReviewProps {
  bhtClientId: string;
  reportId: string | null;
  measures: Measure[];
  isConfirmed: boolean;
}

export function BhtMeasuresReview({
  bhtClientId,
  reportId,
  measures,
  isConfirmed,
}: BhtMeasuresReviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null);
  const [recommendation, setRecommendation] = useState("");

  async function handleConfirm() {
    if (!reportId) {
      toast({
        variant: "destructive",
        title: "Mangler årsrapport",
        description: "Opprett årsrapport først for å bekrefte tiltak",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await confirmMeasuresReviewed({
        reportId,
        recommendation: recommendation || undefined,
      });

      if (result.success) {
        toast({ title: "✅ Tiltak gjennomgått bekreftet" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "DONE":
        return <Badge className="bg-green-500">Fullført</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">Pågår</Badge>;
      case "OVERDUE":
        return <Badge className="bg-red-500">Forfalt</Badge>;
      default:
        return <Badge variant="outline">Ventende</Badge>;
    }
  }

  if (isConfirmed) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
        <CheckCircle2 className="h-5 w-5" />
        <span>BHT har gjennomgått og bekreftet bedriftens tiltak</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tiltak-liste med klikk */}
      <div className="space-y-2">
        {measures.map((measure) => (
          <Dialog key={measure.id}>
            <DialogTrigger asChild>
              <button
                className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedMeasure(measure)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{measure.title}</p>
                    </div>
                    {measure.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {measure.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {measure.responsible && (
                        <span>Ansvarlig: {measure.responsible.name}</span>
                      )}
                      {measure.dueAt && (
                        <span>Frist: {new Date(measure.dueAt).toLocaleDateString("nb-NO")}</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(measure.status)}
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{measure.title}</DialogTitle>
                <DialogDescription>
                  Detaljer om tiltaket
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Beskrivelse</p>
                  <p>{measure.description || "Ingen beskrivelse"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(measure.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ansvarlig</p>
                    <p>{measure.responsible?.name || "Ikke tildelt"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frist</p>
                    <p>
                      {measure.dueAt
                        ? new Date(measure.dueAt).toLocaleDateString("nb-NO")
                        : "Ikke satt"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opprettet</p>
                    <p>{new Date(measure.createdAt).toLocaleDateString("nb-NO")}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {measures.length === 0 && (
        <p className="text-muted-foreground text-center py-4">
          Ingen tiltak å gjennomgå
        </p>
      )}

      {/* BHT-anbefaling og bekreftelse */}
      <div className="border-t pt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recommendation" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            BHT-anbefaling til tiltak (valgfritt)
          </Label>
          <Textarea
            id="recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder="Skriv anbefaling eller kommentar til bedriftens tiltak..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleConfirm}
          disabled={loading || !reportId}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Bekreft tiltak gjennomgått
        </Button>

        {!reportId && (
          <p className="text-sm text-orange-600 text-center">
            ⚠ Opprett årsrapport først for å bekrefte tiltak
          </p>
        )}
      </div>
    </div>
  );
}

