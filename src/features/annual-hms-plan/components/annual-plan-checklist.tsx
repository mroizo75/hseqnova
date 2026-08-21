"use client";

import { useCallback, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  getCategoryLabel,
  getCategoryOrder,
  type AnnualHmsPlanStep,
} from "@/lib/annual-hms-plan-steps";
import {
  setAnnualPlanStepCompleted,
  type AnnualPlanChecklistDataSerialized,
} from "@/server/actions/annual-hms-plan.actions";

type StepWithCompletion = AnnualPlanChecklistDataSerialized["steps"][number];

function groupByCategory(steps: StepWithCompletion[]): Map<AnnualHmsPlanStep["category"], StepWithCompletion[]> {
  const map = new Map<AnnualHmsPlanStep["category"], StepWithCompletion[]>();
  const order = getCategoryOrder();
  for (const cat of order) {
    map.set(cat, []);
  }
  for (const step of steps) {
    const list = map.get(step.category) ?? [];
    list.push(step);
    map.set(step.category, list);
  }
  return map;
}

interface AnnualPlanChecklistProps {
  initialData: AnnualPlanChecklistDataSerialized;
  tenantId: string;
  userId: string | null;
  canEdit: boolean;
}

export function AnnualPlanChecklist({
  initialData,
  tenantId,
  userId,
  canEdit,
}: AnnualPlanChecklistProps) {
  const { toast } = useToast();
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const s of initialData.steps) {
      if (s.completedAt != null) set.add(s.key);
    }
    return set;
  });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const byCategory = useMemo(
    () => groupByCategory(initialData.steps),
    [initialData.steps]
  );

  const completedCount = useMemo(() => completedKeys.size, [completedKeys]);
  const totalCount = initialData.totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleStep = useCallback(
    async (stepKey: string, currentlyCompleted: boolean) => {
      if (!canEdit) return;
      setLoadingKey(stepKey);
      const newCompleted = !currentlyCompleted;
      setCompletedKeys((prev) => {
        const next = new Set(prev);
        if (newCompleted) next.add(stepKey);
        else next.delete(stepKey);
        return next;
      });
      const result = await setAnnualPlanStepCompleted({
        tenantId,
        year: initialData.year,
        stepKey,
        completed: newCompleted,
        userId: userId ?? undefined,
      });
      setLoadingKey(null);
      if (!result.success) {
        const errorMessage = (result as { success: false; error: string }).error;
        setCompletedKeys((prev) => {
          const next = new Set(prev);
          if (newCompleted) next.delete(stepKey);
          else next.add(stepKey);
          return next;
        });
        toast({
          title: "Feil",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: newCompleted ? "Steg fullført" : "Avkryssing fjernet",
          description: newCompleted ? "Steget er markert som fullført." : undefined,
          duration: 4000,
        });
      }
    },
    [canEdit, tenantId, initialData.year, userId, toast]
  );

  const isStepCompleted = useCallback(
    (key: string) => completedKeys.has(key),
    [completedKeys]
  );

  return (
    <div className="space-y-6">
      {/* Fremdrift */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Fremdrift for {initialData.year}</CardTitle>
            <CardDescription>
              Når alle steg er avkrysset, har dere dokumentert at årets HMS-krav er oppfylt.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/dashboard/annual-hms-plan/report?year=${initialData.year}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Åpne rapport for utskrift
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/api/annual-hms-plan/report/${initialData.year}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Last ned PDF (Adobe)
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Progress value={progressPercent} className="h-3 flex-1" />
            <span className="text-sm font-medium tabular-nums text-muted-foreground shrink-0">
              {completedCount} av {totalCount} fullført
            </span>
          </div>
          {progressPercent === 100 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                Alle steg er fullført for {initialData.year}. Dere har dokumentert at årets HMS-plan er gjennomført.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sjekkliste gruppert etter kategori */}
      <div className="space-y-8">
        {getCategoryOrder().map((category) => {
          const steps = byCategory.get(category);
          if (!steps || steps.length === 0) return null;
          const label = getCategoryLabel(category);
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>
                  {steps.filter((s) => isStepCompleted(s.key)).length} av {steps.length} fullført i denne gruppen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step) => {
                  const completed = isStepCompleted(step.key);
                  const loading = loadingKey === step.key;
                  return (
                    <div
                      key={step.key}
                      className={`flex gap-4 rounded-lg border p-4 transition-colors ${
                        completed ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" : "bg-card"
                      }`}
                    >
                      <div className="flex shrink-0 items-start pt-0.5">
                        <Checkbox
                          id={step.key}
                          checked={completed}
                          disabled={!canEdit || loading}
                          onCheckedChange={() => toggleStep(step.key, completed)}
                          className="h-5 w-5"
                        />
                        {loading && (
                          <Loader2 className="ml-1 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <label
                          htmlFor={step.key}
                          className="font-medium cursor-pointer leading-tight"
                        >
                          {step.title}
                        </label>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.legalRef && (
                          <p className="text-xs text-muted-foreground">Krav: {step.legalRef}</p>
                        )}
                        {completed && step.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            Fullført {format(new Date(step.completedAt), "d. MMM yyyy", { locale: nb })}
                          </p>
                        )}
                      </div>
                      {step.href && (
                        <Button asChild variant="ghost" size="sm" className="shrink-0">
                          <Link href={step.href} target="_blank" rel="noopener noreferrer">
                            Gå til modul
                            <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
