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
import {
  CONTROL_FREQUENCY_LABELS,
  RISK_CATEGORY_LABELS,
  RISK_LEVEL_LABELS,
  RISK_STATUS_LABELS,
  formatRiskDate,
} from "@/features/risks/utils/risk-labels";

interface RiskListProps {
  risks: (Risk & {
    measures: Measure[];
    owner?: { id: string; name: string | null; email: string | null } | null;
  })[];
}

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "destructive",
  MITIGATING: "default",
  ACCEPTED: "secondary",
  CLOSED: "secondary",
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
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) {
      return;
    }

    setLoading(id);
    const result = await deleteRisk(id);

    if (result.success) {
      toast({
        title: "Risk deleted",
        description: `“${title}” has been removed.`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: result.error || "The risk could not be deleted.",
      });
    }
    setLoading(null);
  };

  if (risks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No risks yet</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Create a risk assessment and add the first risk item.
        </p>
        <Button asChild>
          <Link href="/dashboard/risks/new">Create risk assessment</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Risk</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-center">Initial risk</TableHead>
            <TableHead className="text-center">Residual risk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next review</TableHead>
            <TableHead className="text-center">Actions</TableHead>
            <TableHead className="text-right sr-only">Manage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => {
            const initial = calculateRiskScore(risk.likelihood, risk.consequence);
            const residual =
              risk.residualLikelihood != null && risk.residualConsequence != null
                ? calculateRiskScore(risk.residualLikelihood, risk.residualConsequence)
                : null;
            const completedMeasures = risk.measures.filter((m) => m.status === "DONE").length;
            const totalMeasures = risk.measures.length;
            const hasMeasures = totalMeasures > 0;
            const nextReview = formatRiskDate(risk.nextReviewDate);
            const overdue = isPastDate(risk.nextReviewDate);
            const ownerLabel = risk.owner?.name || risk.owner?.email || "Not set";
            const frequency = risk.controlFrequency
              ? CONTROL_FREQUENCY_LABELS[risk.controlFrequency]
              : CONTROL_FREQUENCY_LABELS.ANNUAL;
            const categoryLabel = risk.category
              ? RISK_CATEGORY_LABELS[risk.category] || risk.category
              : "Not set";

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
                  <Badge variant="secondary">{categoryLabel}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {ownerLabel}
                    <p className="text-xs text-muted-foreground">{frequency}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      L×C={risk.likelihood}×{risk.consequence}
                    </span>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                      {risk.score}
                    </div>
                    <Badge className={`${initial.bgColor} ${initial.textColor}`}>
                      {RISK_LEVEL_LABELS[initial.level]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {residual ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        L×C={risk.residualLikelihood}×{risk.residualConsequence}
                      </span>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                        {residual.score}
                      </div>
                      <Badge className={`${residual.bgColor} ${residual.textColor}`}>
                        {RISK_LEVEL_LABELS[residual.level]}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Not assessed</span>
                      {hasMeasures && (
                        <span className="text-xs text-amber-600">
                          Actions recorded — set residual risk
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[risk.status]}>
                    {RISK_STATUS_LABELS[risk.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className={overdue ? "text-red-600 font-semibold" : ""}>
                      {nextReview || "Not set"}
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
                        Add / edit
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/risks/${risk.id}#tiltak`}
                      className="text-sm text-primary hover:underline"
                    >
                      Add action
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

      <div className="md:hidden space-y-3">
        {risks.map((risk) => {
          const initial = calculateRiskScore(risk.likelihood, risk.consequence);
          const residual =
            risk.residualLikelihood != null && risk.residualConsequence != null
              ? calculateRiskScore(risk.residualLikelihood, risk.residualConsequence)
              : null;
          const completedMeasures = risk.measures.filter((m) => m.status === "DONE").length;
          const totalMeasures = risk.measures.length;
          const nextReview = formatRiskDate(risk.nextReviewDate);
          const overdue = isPastDate(risk.nextReviewDate);
          const ownerLabel = risk.owner?.name || risk.owner?.email || "Not set";
          const frequency = risk.controlFrequency
            ? CONTROL_FREQUENCY_LABELS[risk.controlFrequency]
            : CONTROL_FREQUENCY_LABELS.ANNUAL;
          const categoryLabel = risk.category
            ? RISK_CATEGORY_LABELS[risk.category] || risk.category
            : "Not set";

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
                    <Badge variant="secondary">{categoryLabel}</Badge>
                    <Badge className={`${initial.bgColor} ${initial.textColor}`}>
                      Initial: {RISK_LEVEL_LABELS[initial.level]}
                    </Badge>
                    {residual ? (
                      <Badge className={`${residual.bgColor} ${residual.textColor}`}>
                        Residual: {RISK_LEVEL_LABELS[residual.level]}
                      </Badge>
                    ) : totalMeasures > 0 ? (
                      <span className="text-xs text-amber-600">Set residual risk</span>
                    ) : null}
                    <Badge variant={statusVariants[risk.status]}>
                      {RISK_STATUS_LABELS[risk.status]}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      L:{risk.likelihood} · C:{risk.consequence}
                    </div>
                  </div>

                  {totalMeasures > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-muted-foreground">
                        Actions: {completedMeasures}/{totalMeasures} complete
                      </div>
                      <Link href={`/dashboard/risks/${risk.id}#tiltak`} className="text-sm text-primary hover:underline">
                        Add / edit actions
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/dashboard/risks/${risk.id}#tiltak`} className="text-sm text-primary hover:underline">
                      Add action
                    </Link>
                  )}

                  <div className="text-sm">
                    <p className="font-medium">{ownerLabel}</p>
                    <p className="text-xs text-muted-foreground">{frequency}</p>
                  </div>

                  <div className="text-sm">
                    <p className={overdue ? "text-red-600 font-semibold" : "font-medium"}>
                      Next review: {nextReview || "Not set"}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                      <Link href={`/dashboard/risks/${risk.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
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
