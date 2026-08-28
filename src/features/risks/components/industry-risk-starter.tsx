"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createRiskAssessmentFromStarter } from "@/server/actions/risk.actions";
import {
  UK_RISK_STARTER_INDUSTRIES,
  getUkRiskStarterPack,
  resolveUkRiskStarterIndustry,
  type UkRiskStarterHazard,
} from "@/lib/uk-risk-starters";

interface IndustryRiskStarterProps {
  initialIndustry: string | null;
  assessmentId?: string | null;
}

function defaultKeysFor(industry: string): string[] {
  return getUkRiskStarterPack(industry)
    .groups.flatMap((group) => group.hazards)
    .filter((hazard) => hazard.defaultSelected)
    .map((hazard) => hazard.key);
}

export function IndustryRiskStarter({
  initialIndustry,
  assessmentId = null,
}: IndustryRiskStarterProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [industry, setIndustry] = useState(() => resolveUkRiskStarterIndustry(initialIndustry));
  const [selected, setSelected] = useState<string[]>(() => defaultKeysFor(industry));
  const [isPending, startTransition] = useTransition();

  const pack = useMemo(() => getUkRiskStarterPack(industry), [industry]);

  function handleIndustry(next: string) {
    setIndustry(next);
    setSelected(defaultKeysFor(next));
  }

  function toggleHazard(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createRiskAssessmentFromStarter({
        industry,
        hazardKeys: selected,
        assessmentId,
      });
      if (!result.success || !result.assessmentId) {
        toast({
          variant: "destructive",
          title: "Could not create the assessment",
          description: result.error ?? "Try again.",
        });
        return;
      }
      toast({
        title: "Assessment created",
        description: "Review each item so it is suitable and sufficient for your workplace.",
        className: "bg-green-50 border-green-200",
      });
      router.push(`/dashboard/risks/assessment/${result.assessmentId}`);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-primary/[0.04] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Get started
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-balance">
          Build a first assessment from your type of work
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tick the hazards that apply. We draft the record with typical controls and the legal
          hook. You still review likelihood, who is at risk, and the controls so it is suitable
          and sufficient (MHSWR 1999).
        </p>
      </div>

      <div className="space-y-8 p-6 sm:p-8">
        <div>
          <h3 className="text-sm font-semibold">What kind of work do you do?</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {UK_RISK_STARTER_INDUSTRIES.map((option) => {
              const isActive = option.value === industry;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleIndustry(option.value)}
                    disabled={isPending}
                    className={cn(
                      "flex min-h-11 w-full flex-col items-start rounded-lg border px-3 py-3 text-left transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/[0.06]"
                        : "bg-transparent hover:bg-muted/40",
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {pack.groups.map((group) => (
          <div key={group.id}>
            <h3 className="text-sm font-semibold">{group.title}</h3>
            <ul className="mt-3 space-y-2">
              {group.hazards.map((hazard) => (
                <HazardRow
                  key={hazard.key}
                  hazard={hazard}
                  checked={selected.includes(hazard.key)}
                  disabled={isPending}
                  onToggle={() => toggleHazard(hazard.key)}
                />
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selected.length} {selected.length === 1 ? "hazard" : "hazards"} selected
          </p>
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={isPending || selected.length === 0}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {assessmentId ? "Add these hazards" : "Create this assessment"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function HazardRow({
  hazard,
  checked,
  disabled,
  onToggle,
}: {
  hazard: UkRiskStarterHazard;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        className={cn(
          "flex w-full min-h-11 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
          checked ? "border-primary/30 bg-primary/[0.04]" : "bg-transparent hover:bg-muted/40",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-transparent",
          )}
          aria-hidden
        >
          {checked ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{hazard.title}</span>
            <Badge variant="outline" className="bg-transparent font-normal">
              {hazard.legalRef.split(";")[0]}
            </Badge>
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">{hazard.context}</span>
        </span>
      </button>
    </li>
  );
}
