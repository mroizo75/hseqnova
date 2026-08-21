"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteRisk } from "@/server/actions/risk.actions";
import { calculateRiskScore } from "@/features/risks/schemas/risk.schema";
import { useToast } from "@/hooks/use-toast";
import type { Risk, Measure } from "@prisma/client";

interface RiskListProps {
  risks: (Risk & {
    measures: Measure[];
    owner?: { id: string; name: string | null; email: string | null } | null;
  })[];
}

// ISO 45001/31000-aligned status for risikovurdering
const statusLabels: Record<string, string> = {
  OPEN: "Identifisert",
  MITIGATING: "Tiltak iverksatt",
  ACCEPTED: "Akseptert",
  CLOSED: "Lukket",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "destructive",
  MITIGATING: "default",
  ACCEPTED: "secondary",
  CLOSED: "secondary",
};

const categoryLabels: Record<string, string> = {
  OPERATIONAL: "Operasjonell",
  SAFETY: "Sikkerhet",
  HEALTH: "Helse",
  ENVIRONMENTAL: "Miljø",
  INFORMATION_SECURITY: "Info-sikkerhet",
  LEGAL: "Juridisk",
  STRATEGIC: "Strategisk",
  PSYCHOSOCIAL: "Psykososialt",
  ERGONOMIC: "Ergonomisk",
  ORGANISATIONAL: "Organisatorisk",
  PHYSICAL: "Fysisk",
};

const frequencyLabels: Record<string, string> = {
  WEEKLY: "Ukentlig",
  MONTHLY: "Månedlig",
  QUARTERLY: "Kvartalsvis",
  ANNUAL: "Årlig",
  BIENNIAL: "Annet hvert år",
};

const formatDate = (value?: Date | string | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isPastDate = (value?: Date | string | null) => {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export function RiskList({ risks }: RiskListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${title}"?\n\nDette kan ikke angres.`)) {
      return;
    }

    setLoading(id);
    const result = await deleteRisk(id);
    
    if (result.success) {
      toast({
        title: "🗑️ Risiko slettet",
        description: `"${title}" er fjernet`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Sletting feilet",
        description: result.error || "Kunne ikke slette risiko",
      });
    }
    setLoading(null);
  };

  if (risks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Ingen risikoer</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Opprett din første risikovurdering for å komme i gang
        </p>
        <Button asChild>
          <Link href="/dashboard/risks/new">Opprett risikovurdering</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop - Tabell */}
      <div className="hidden md:block rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Risiko</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Eier</TableHead>
            <TableHead className="text-center">Før tiltak</TableHead>
            <TableHead className="text-center">Restrisiko etter tiltak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Neste revisjon</TableHead>
            <TableHead className="text-center">Tiltak</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => {
            const { level, bgColor, textColor } = calculateRiskScore(risk.likelihood, risk.consequence);
            const residual =
              risk.residualLikelihood != null && risk.residualConsequence != null
                ? calculateRiskScore(risk.residualLikelihood, risk.residualConsequence)
                : null;
            const completedMeasures = risk.measures.filter(m => m.status === "DONE").length;
            const totalMeasures = risk.measures.length;
            const hasMeasures = totalMeasures > 0;
            const nextReview = formatDate(risk.nextReviewDate);
            const overdue = isPastDate(risk.nextReviewDate);
            const ownerLabel = risk.owner?.name || risk.owner?.email || "Ikke satt";
            const frequency = risk.controlFrequency ? frequencyLabels[risk.controlFrequency] : "Årlig";
            const categoryLabel = risk.category ? categoryLabels[risk.category] || risk.category : "Ikke satt";

            return (
              <TableRow key={risk.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{risk.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {risk.context}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {categoryLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {ownerLabel}
                    <p className="text-xs text-muted-foreground">{frequency}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">S×K={risk.likelihood}×{risk.consequence}</span>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                      {risk.score}
                    </div>
                    <Badge className={`${bgColor} ${textColor}`}>{level}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {residual ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Etter tiltak: S×K={risk.residualLikelihood}×{risk.residualConsequence}
                      </span>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                        {residual.score}
                      </div>
                      <Badge className={`${residual.bgColor} ${residual.textColor}`}>{residual.level}</Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Ikke vurdert</span>
                      {hasMeasures && (
                        <span className="text-xs text-amber-600">Tiltak registrert – vurder restrisiko</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[risk.status]}>
                    {statusLabels[risk.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className={overdue ? "text-red-600 font-semibold" : ""}>
                      {nextReview || "Ikke satt"}
                    </span>
                    {nextReview && (
                      <p className="text-xs text-muted-foreground">{frequency}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {totalMeasures > 0 ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm">
                        {completedMeasures}/{totalMeasures}
                      </span>
                      <Link
                        href={`/dashboard/risks/${risk.id}#tiltak`}
                        className="text-xs text-primary hover:underline"
                      >
                        Legg til / rediger
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/risks/${risk.id}#tiltak`}
                      className="text-sm text-primary hover:underline"
                    >
                      Legg til tiltak
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/risks/${risk.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(risk.id, risk.title)}
                      disabled={loading === risk.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>

      {/* Mobile - Kort */}
      <div className="md:hidden space-y-3">
        {risks.map((risk) => {
          const { level, bgColor, textColor } = calculateRiskScore(risk.likelihood, risk.consequence);
          const residual =
            risk.residualLikelihood != null && risk.residualConsequence != null
              ? calculateRiskScore(risk.residualLikelihood, risk.residualConsequence)
              : null;
          const completedMeasures = risk.measures.filter(m => m.status === "DONE").length;
          const totalMeasures = risk.measures.length;
          const nextReview = formatDate(risk.nextReviewDate);
          const overdue = isPastDate(risk.nextReviewDate);
          const ownerLabel = risk.owner?.name || risk.owner?.email || "Ikke satt";
          const frequency = risk.controlFrequency ? frequencyLabels[risk.controlFrequency] : "Årlig";
          const categoryLabel = risk.category ? categoryLabels[risk.category] || risk.category : "Ikke satt";

          return (
            <Card key={risk.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-1">{risk.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {risk.context}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                        {risk.score}
                      </div>
                      {residual && (
                        <span className="text-xs text-muted-foreground">→ {residual.score}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="secondary">
                      {categoryLabel}
                    </Badge>
                    <Badge className={`${bgColor} ${textColor}`}>Før: {level}</Badge>
                    {residual ? (
                      <Badge className={`${residual.bgColor} ${residual.textColor}`}>Etter: {residual.level}</Badge>
                    ) : totalMeasures > 0 ? (
                      <span className="text-xs text-amber-600">Vurder restrisiko</span>
                    ) : null}
                    <Badge variant={statusVariants[risk.status]}>
                      {statusLabels[risk.status]}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      S:{risk.likelihood} · K:{risk.consequence}
                    </div>
                  </div>

                  {totalMeasures > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-muted-foreground">
                        Tiltak: {completedMeasures}/{totalMeasures} fullført
                      </div>
                      <Link href={`/dashboard/risks/${risk.id}#tiltak`} className="text-sm text-primary hover:underline">
                        Legg til / rediger tiltak
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/dashboard/risks/${risk.id}#tiltak`} className="text-sm text-primary hover:underline">
                      Legg til tiltak
                    </Link>
                  )}

                  <div className="text-sm">
                    <p className="font-medium">{ownerLabel}</p>
                    <p className="text-xs text-muted-foreground">{frequency}</p>
                  </div>

                  <div className="text-sm">
                    <p className={overdue ? "text-red-600 font-semibold" : "font-medium"}>
                      Neste revisjon: {nextReview || "Ikke satt"}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/risks/${risk.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rediger
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(risk.id, risk.title)}
                      disabled={loading === risk.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

