"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { deleteMeasure } from "@/server/actions/measure.actions";
import { getMeasureStatusLabel, getMeasureStatusColor } from "@/features/measures/schemas/measure.schema";
import { useToast } from "@/hooks/use-toast";
import type { ActionEffectiveness, Measure } from "@prisma/client";

interface MeasureListProps {
  measures: (Measure & {
    risk?: { id: string; title: string } | null;
  })[];
}

export function MeasureList({ measures }: MeasureListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) {
      return;
    }

    setLoading(id);
    const result = await deleteMeasure(id);

    if (result.success) {
      toast({
        title: "Action deleted",
        description: `"${title}" has been removed`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not delete the action",
      });
    }
    setLoading(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (dueAt: Date, status: string) => {
    if (status === "DONE") return false;
    return new Date() > new Date(dueAt);
  };

  if (measures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No further action recorded yet.
      </p>
    );
  }

  return (
    <>
      <div className="hidden rounded-lg border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead className="hidden md:table-cell">Details</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measures.map((measure) => {
            const statusLabel = getMeasureStatusLabel(measure.status);
            const statusColor = getMeasureStatusColor(measure.status);
            const overdue = isOverdue(measure.dueAt, measure.status);
            const categoryLabels: Record<string, string> = {
              CORRECTIVE: "Corrective",
              PREVENTIVE: "Preventive",
              IMPROVEMENT: "Improvement",
              MITIGATION: "Risk reduction",
            };
            const frequencyLabels: Record<string, string> = {
              WEEKLY: "Weekly",
              MONTHLY: "Monthly",
              QUARTERLY: "Quarterly",
              ANNUAL: "Annual",
              BIENNIAL: "Every two years",
            };
            const effectivenessLabels: Record<ActionEffectiveness, string> = {
              EFFECTIVE: "Effective",
              PARTIALLY_EFFECTIVE: "Partial",
              INEFFECTIVE: "Not effective",
              NOT_EVALUATED: "Not evaluated",
            };

            return (
              <TableRow key={measure.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/dashboard/measures/${measure.id}`}
                      className="font-medium hover:underline"
                    >
                      {measure.title}
                    </Link>
                    {measure.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {measure.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {categoryLabels[measure.category] || measure.category}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Follow-up:</span>{" "}
                      {frequencyLabels[measure.followUpFrequency || "ANNUAL"]}
                    </div>
                    {measure.costEstimate && (
                      <div>
                        <span className="text-muted-foreground">Cost:</span>{" "}
                        £{Number(measure.costEstimate).toLocaleString("en-GB")}
                      </div>
                    )}
                    {measure.benefitEstimate && (
                      <div>
                        <span className="text-muted-foreground">Benefit:</span>{" "}
                        {measure.benefitEstimate}
                      </div>
                    )}
                    {measure.effectiveness !== "NOT_EVALUATED" && (
                      <div>
                        <span className="text-muted-foreground">Review:</span>{" "}
                        {effectivenessLabels[measure.effectiveness]}
                      </div>
                    )}
                    {measure.risk && (
                      <div>
                        <span className="text-muted-foreground">Risk:</span>{" "}
                        {measure.risk.title}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {overdue && <Clock className="h-4 w-4 text-red-600" />}
                    <span className={overdue ? "text-red-600 font-semibold" : ""}>
                      {formatDate(measure.dueAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColor}>{statusLabel}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/dashboard/measures/${measure.id}`}
                        title="Edit and update status"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(measure.id, measure.title)}
                      disabled={loading === measure.id}
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

      <div className="space-y-3 md:hidden">
        {measures.map((measure) => {
          const statusLabel = getMeasureStatusLabel(measure.status);
          const statusColor = getMeasureStatusColor(measure.status);
          const overdue = isOverdue(measure.dueAt, measure.status);

          return (
            <Card key={measure.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/measures/${measure.id}`} className="font-medium hover:underline">
                      {measure.title}
                    </Link>
                    {measure.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{measure.description}</p>
                    ) : null}
                  </div>
                  <Badge className={statusColor}>{statusLabel}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {overdue ? <Clock className="h-4 w-4 text-red-600" /> : null}
                  <span className={overdue ? "font-semibold text-red-600" : ""}>
                    Due: {formatDate(measure.dueAt)}
                  </span>
                </div>
                <div className="flex gap-2 border-t pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/measures/${measure.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(measure.id, measure.title)}
                    disabled={loading === measure.id}
                    aria-label="Delete action"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

