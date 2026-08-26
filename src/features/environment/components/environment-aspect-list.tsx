"use client";

import { useState } from "react";
import Link from "next/link";
import type { EnvironmentalAspect, EnvironmentalMeasurement } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteEnvironmentalAspect } from "@/server/actions/environment.actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

type AspectWithRelations = EnvironmentalAspect & {
  owner?: { id: string; name: string | null; email: string | null } | null;
  goal?: { id: string; title: string } | null;
  measurements: EnvironmentalMeasurement[];
};

interface EnvironmentAspectListProps {
  aspects: AspectWithRelations[];
}

const getSignificanceMeta = (score: number) => {
  if (score >= 20) return { label: "Critical", className: "bg-red-100 text-red-900 border-red-300" };
  if (score >= 12) return { label: "High", className: "bg-orange-100 text-orange-900 border-orange-300" };
  if (score >= 6) return { label: "Moderate", className: "bg-yellow-100 text-yellow-900 border-yellow-300" };
  return { label: "Low", className: "bg-green-100 text-green-900 border-green-300" };
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
  return format(date, "d MMM yyyy", { locale: enGB });
};

export function EnvironmentAspectList({ aspects }: EnvironmentAspectListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (aspect: AspectWithRelations) => {
    if (!confirm(`Delete the environmental aspect "${aspect.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(aspect.id);
    const result = await deleteEnvironmentalAspect(aspect.id);
    setDeletingId(null);

    if (result.success) {
      toast({
        title: "Deleted",
        description: `"${aspect.title}" has been removed`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not delete the environmental aspect",
      });
    }
  };

  if (aspects.length === 0) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-12">
        <p>No environmental aspects recorded yet.</p>
        <p className="text-sm mt-1">Add the first aspect to start ISO 14001 follow-up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {aspects.map((aspect) => {
        const lastMeasurement = aspect.measurements[0];
        const significanceMeta = getSignificanceMeta(aspect.significanceScore);
        const ownerLabel = aspect.owner?.name || aspect.owner?.email || "Not set";

        return (
          <Card key={aspect.id}>
            <CardHeader className="space-y-0 gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg leading-snug">{aspect.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {aspect.description || "No description"}
                </CardDescription>
              </div>
              <div className="flex flex-wrap content-start gap-2 sm:max-w-[20rem] sm:justify-end">
                <Badge variant="outline" className={significanceMeta.className}>
                  Significance: {aspect.significanceScore} · {significanceMeta.label}
                </Badge>
                <Badge variant="outline">{aspect.category}</Badge>
                <Badge variant="outline" className={statusColors[aspect.status]}>
                  {aspect.status === "ACTIVE"
                    ? "Active"
                    : aspect.status === "MONITORED"
                      ? "Monitored"
                      : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Responsible person</p>
                  <p className="font-medium">{ownerLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Process / location</p>
                  <p className="font-medium">
                    {aspect.process || "-"} {aspect.location ? `· ${aspect.location}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next review</p>
                  <p className="font-medium">{formatDate(aspect.nextReviewDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Linked objective</p>
                  <p className="font-medium">{aspect.goal?.title || "None"}</p>
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
                        ? "Compliant"
                        : lastMeasurement.status === "WARNING"
                          ? "Warning"
                          : "Non-compliant"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {lastMeasurement.parameter}: {lastMeasurement.measuredValue}
                      {lastMeasurement.unit ? ` ${lastMeasurement.unit}` : ""} ·{" "}
                      {formatDate(lastMeasurement.measurementDate)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No measurements recorded yet
                  </p>
                )}

                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/environment/${aspect.id}`}>Details</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(aspect)}
                    disabled={deletingId === aspect.id}
                  >
                    Delete
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

