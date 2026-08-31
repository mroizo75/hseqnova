"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  createRiskAssessmentFromGeneratedPack,
  createRiskAssessmentFromStarter,
} from "@/server/actions/risk.actions";
import {
  UK_RISK_STARTER_INDUSTRIES,
  getUkRiskStarterPack,
  resolveUkRiskStarterIndustry,
} from "@/lib/uk-risk-starters";
import type { IndustryRiskPackHazard } from "@/lib/industry-risk-pack";
import { formatGroupsAtRiskLabels, serializeGroupsAtRisk } from "@/lib/risk-mhswr";

interface IndustryRiskStarterProps {
  initialIndustry: string | null;
  assessmentId?: string | null;
  aiEnabled?: boolean;
  existingRisks?: string[];
}

function defaultKeysFor(industry: string): string[] {
  return getUkRiskStarterPack(industry)
    .groups.flatMap((group) => group.hazards)
    .filter((hazard) => hazard.defaultSelected)
    .map((hazard) => hazard.key);
}

function industryHint(value: string | null): string {
  if (!value) return "";
  const match = UK_RISK_STARTER_INDUSTRIES.find((option) => option.value === value);
  return match?.label ?? value;
}

export function IndustryRiskStarter({
  initialIndustry,
  assessmentId = null,
  aiEnabled = false,
  existingRisks = [],
}: IndustryRiskStarterProps) {
  const router = useRouter();
  const { toast } = useToast();
  const resolvedIndustry = resolveUkRiskStarterIndustry(initialIndustry);
  const [lineOfBusiness, setLineOfBusiness] = useState(() => industryHint(initialIndustry));
  const [industry, setIndustry] = useState(resolvedIndustry);
  const [selected, setSelected] = useState<string[]>(() => defaultKeysFor(resolvedIndustry));
  const [aiHazards, setAiHazards] = useState<IndustryRiskPackHazard[] | null>(null);
  const [aiLabel, setAiLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pack = useMemo(() => getUkRiskStarterPack(industry), [industry]);
  const usingAi = aiHazards != null && aiHazards.length > 0;

  function handleIndustry(next: string) {
    setIndustry(next);
    setSelected(defaultKeysFor(next));
    setAiHazards(null);
    const option = UK_RISK_STARTER_INDUSTRIES.find((item) => item.value === next);
    if (option) setLineOfBusiness(option.label);
  }

  function toggleHazard(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function handleGenerate() {
    const industryText = lineOfBusiness.trim();
    if (industryText.length < 2) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/industry-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: industryText,
          existingRisks,
        }),
      });

      if (response.status === 403) {
        toast({
          variant: "destructive",
          title: "AI Pro required",
          description:
            "Enable AI Pro to draft hazards from a line of business, or pick a standard pack below.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Could not draft hazards");
      }

      const json = (await response.json()) as {
        data?: { industryLabel?: string; hazards?: IndustryRiskPackHazard[] };
      };
      const hazards = json.data?.hazards ?? [];
      if (hazards.length === 0) {
        throw new Error("Empty pack");
      }
      setAiHazards(hazards);
      setAiLabel(json.data?.industryLabel?.trim() || industryText);
      setSelected(hazards.map((hazard) => hazard.key));
    } catch {
      toast({
        variant: "destructive",
        title: "Could not draft hazards",
        description: "Try a more specific line of business, or pick a standard pack.",
      });
    } finally {
      setGenerating(false);
    }
  }

  function handleCreate() {
    startTransition(async () => {
      const result = usingAi
        ? await createRiskAssessmentFromGeneratedPack({
            industryLabel: aiLabel || lineOfBusiness.trim() || "Workplace",
            hazards: (aiHazards ?? []).filter((hazard) => selected.includes(hazard.key)),
            assessmentId,
          })
        : await createRiskAssessmentFromStarter({
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

  const busy = isPending || generating;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-primary/[0.04] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Get started
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-balance">
          Draft an assessment from your type of work
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Describe the industry or line of business. We draft typical hazards, who might be harmed,
          and controls. You still review each item so the record is suitable and sufficient
          (MHSWR 1999 reg.&nbsp;3).
        </p>
      </div>

      <div className="space-y-8 p-6 sm:p-8">
        <div className="space-y-3">
          <Label htmlFor="line-of-business">Industry or line of business</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="line-of-business"
              value={lineOfBusiness}
              onChange={(event) => setLineOfBusiness(event.target.value)}
              placeholder="e.g. Roofing and cladding, care home, commercial kitchen"
              disabled={busy}
              className="sm:flex-1"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleGenerate();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={busy || lineOfBusiness.trim().length < 2 || !aiEnabled}
              className="shrink-0 gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Draft typical hazards
            </Button>
          </div>
          {!aiEnabled ? (
            <p className="text-sm text-muted-foreground">
              AI drafting needs the AI Pro add-on. Pick a standard pack below in the meantime.
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold">Or pick a standard pack</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {UK_RISK_STARTER_INDUSTRIES.map((option) => {
              const isActive = !usingAi && option.value === industry;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleIndustry(option.value)}
                    disabled={busy}
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

        {usingAi ? (
          <div>
            <h3 className="text-sm font-semibold">Typical hazards for {aiLabel}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Untick anything that does not apply. These are drafts, not a finished assessment.
            </p>
            <ul className="mt-3 space-y-2">
              {aiHazards.map((hazard) => (
                <HazardRow
                  key={hazard.key}
                  title={hazard.title}
                  context={hazard.context}
                  legalRef={hazard.legalRef}
                  whoLabel={formatGroupsAtRiskLabels(
                    serializeGroupsAtRisk(hazard.whoAtRisk),
                  ).join(", ")}
                  checked={selected.includes(hazard.key)}
                  disabled={busy}
                  onToggle={() => toggleHazard(hazard.key)}
                />
              ))}
            </ul>
          </div>
        ) : (
          pack.groups.map((group) => (
            <div key={group.id}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.hazards.map((hazard) => (
                  <HazardRow
                    key={hazard.key}
                    title={hazard.title}
                    context={hazard.context}
                    legalRef={hazard.legalRef}
                    whoLabel={hazard.whoAtRisk}
                    checked={selected.includes(hazard.key)}
                    disabled={busy}
                    onToggle={() => toggleHazard(hazard.key)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selected.length} {selected.length === 1 ? "hazard" : "hazards"} selected
          </p>
          <Button size="lg" onClick={handleCreate} disabled={busy || selected.length === 0}>
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
  title,
  context,
  legalRef,
  whoLabel,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  context: string;
  legalRef: string;
  whoLabel: string;
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
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="outline" className="bg-transparent font-normal">
              {legalRef.split(";")[0]}
            </Badge>
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">{context}</span>
          {whoLabel ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              Who might be harmed: {whoLabel}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
