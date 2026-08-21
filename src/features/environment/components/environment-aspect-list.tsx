"use client";

import { useState } from "react";
import Link from "next/link";
import type { EnvironmentalAspect, EnvironmentalMeasurement } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteEnvironmentalAspect } from "@/server/actions/environment.actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

type AspectWithRelations = EnvironmentalAspect & {
  owner?: { id: string; name: string | null; email: string | null } | null;
  goal?: { id: string; title: string } | null;
  measurements: EnvironmentalMeasurement[];
};

interface EnvironmentAspectListProps {
  aspects: AspectWithRelations[];
}

const getSignificanceMeta = (score: number) => {
  if (score >= 20) return { label: "Kritisk", className: "bg-red-100 text-red-900 border-red-300" };
  if (score >= 12) return { label: "Høy", className: "bg-orange-100 text-orange-900 border-orange-300" };
  if (score >= 6) return { label: "Moderat", className: "bg-yellow-100 text-yellow-900 border-yellow-300" };
  return { label: "Lav", className: "bg-green-100 text-green-900 border-green-300" };
};

const statusColors: Record<EnvironmentalAspect["status"], string> = {
  ACTIVE: "bg-blue-100 text-blue-900 border-blue-300",
  MONITORED: "bg-amber-100 text-amber-900 border-amber-300",
  CLOSED: "bg-emerald-100 text-emerald-900 border-emerald-300",
};

const measurementStatusColors: Record<EnvironmentalMeasurement["status"], string> = {
  COMPLIANT: "bg-emerald-100 text-emerald-900 border-emerald-300",
  WARNING: "bg-yellow-100 text-yellow-900 border-yellow-300",
  NON_COMPLIANT: "bg-red-100 text-red-900 border-red-300",
};

const formatDate = (value?: Date | string | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd. MMM yyyy", { locale: nb });
};

export function EnvironmentAspectList({ aspects }: EnvironmentAspectListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (aspect: AspectWithRelations) => {
    if (!confirm(`Slette miljøaspektet "${aspect.title}"? Dette kan ikke angres.`)) {
      return;
    }

    setDeletingId(aspect.id);
    const result = await deleteEnvironmentalAspect(aspect.id);
    setDeletingId(null);

    if (result.success) {
      toast({
        title: "🗑️ Slettet",
        description: `"${aspect.title}" er fjernet`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Feil",
        description: result.error || "Kunne ikke slette miljøaspekt",
      });
    }
  };

  if (aspects.length === 0) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-12">
        <p>Ingen miljøaspekter registrert enda.</p>
        <p className="text-sm mt-1">Legg til første miljøaspekt for å starte ISO 14001-arbeidet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {aspects.map((aspect) => {
        const lastMeasurement = aspect.measurements[0];
        const significanceMeta = getSignificanceMeta(aspect.significanceScore);
        const ownerLabel = aspect.owner?.name || aspect.owner?.email || "Ikke satt";

        return (
          <Card key={aspect.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{aspect.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {aspect.description || "Ingen beskrivelse"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={significanceMeta.className}>
                    Betydning: {aspect.significanceScore} · {significanceMeta.label}
                  </Badge>
                  <Badge variant="outline">{aspect.category}</Badge>
                  <Badge variant="outline" className={statusColors[aspect.status]}>
                    {aspect.status === "ACTIVE"
                      ? "Aktiv"
                      : aspect.status === "MONITORED"
                        ? "Følges opp"
                        : "Lukket"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Ansvarlig</p>
                  <p className="font-medium">{ownerLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prosess / Sted</p>
                  <p className="font-medium">
                    {aspect.process || "-"} {aspect.location ? `· ${aspect.location}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Neste revisjon</p>
                  <p className="font-medium">{formatDate(aspect.nextReviewDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tilknyttet mål</p>
                  <p className="font-medium">{aspect.goal?.title || "Ingen"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                {lastMeasurement ? (
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={measurementStatusColors[lastMeasurement.status]}
                    >
                      {lastMeasurement.status === "COMPLIANT"
                        ? "I samsvar"
                        : lastMeasurement.status === "WARNING"
                          ? "Advarsel"
                          : "Avvik"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {lastMeasurement.parameter}: {lastMeasurement.measuredValue}
                      {lastMeasurement.unit ? ` ${lastMeasurement.unit}` : ""} ·{" "}
                      {formatDate(lastMeasurement.measurementDate)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ingen målinger registrert enda
                  </p>
                )}

                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/environment/${aspect.id}`}>Detaljer</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(aspect)}
                    disabled={deletingId === aspect.id}
                  >
                    Slett
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

