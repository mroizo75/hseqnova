"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateIsoGapTasks, saveIsoClauseAssessment } from "@/server/actions/iso.actions";
import type { IsoMatrixRow, IsoTenantMember } from "@/server/queries/iso.queries";
import { effectiveAssessedLevel, type IsoAssessedLevel } from "@/features/iso/lib/readiness";

const AUTO_LABEL = {
  covered: "Covered",
  partial: "Partial",
  missing: "Missing",
} as const;

const ASSESSED_OPTIONS: Array<{ value: "" | IsoAssessedLevel; label: string }> = [
  { value: "", label: "Use auto" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "PARTIAL", label: "Partial" },
  { value: "GAP", label: "Gap" },
  { value: "MAJOR_GAP", label: "Major gap" },
];

export function IsoClauseMatrix({
  rows,
  members,
}: {
  rows: IsoMatrixRow[];
  members: IsoTenantMember[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(requirementId: string, form: HTMLFormElement) {
    const data = new FormData(form);
    setBusy(requirementId);
    setError(null);
    const assessed = String(data.get("assessedLevel") ?? "");
    const result = await saveIsoClauseAssessment({
      requirementId,
      assessedLevel: assessed === "" ? null : assessed,
      responsibleUserId: String(data.get("responsibleUserId") ?? "") || null,
      notes: String(data.get("notes") ?? ""),
      nextReviewAt: String(data.get("nextReviewAt") ?? "") || undefined,
    });
    setBusy(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function generate() {
    setBusy("generate");
    setError(null);
    const result = await generateIsoGapTasks();
    setBusy(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Auto-status comes from live records. The competent person can override it, name an owner and review date.
        </p>
        <Button type="button" variant="outline" className="bg-transparent" onClick={generate} disabled={busy !== null}>
          {busy === "generate" ? "Creating tasks…" : "Create tasks from open gaps"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2">Standard</th>
              <th className="px-3 py-2">Clause</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Auto</th>
              <th className="px-3 py-2">Assessment</th>
              <th className="px-3 py-2">Responsible</th>
              <th className="px-3 py-2">Last reviewed</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const effective = effectiveAssessedLevel(row.autoLevel, row.assessment?.assessedLevel ?? null);
              return (
                <tr key={row.requirement.id} className="border-b last:border-0 align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.clause.standard === "ISO_45001" ? "45001" : "9001"}
                  </td>
                  <td className="px-3 py-2">{row.clause.clause}</td>
                  <td className="px-3 py-2">
                    <p>{row.clause.title}</p>
                    <p className="text-xs text-muted-foreground">{row.autoDetail}</p>
                    {effective === "MAJOR_GAP" ? (
                      <p className="text-xs font-medium text-red-700">Major gap — blocks READY</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{AUTO_LABEL[row.autoLevel]}</td>
                  <td className="px-3 py-2" colSpan={4}>
                    <form
                      className="grid gap-2 md:grid-cols-[140px_160px_150px_1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void save(row.requirement.id, event.currentTarget);
                      }}
                    >
                      <select
                        name="assessedLevel"
                        defaultValue={row.assessment?.assessedLevel ?? ""}
                        className="h-9 rounded-md border bg-transparent px-2 text-sm"
                      >
                        {ASSESSED_OPTIONS.map((option) => (
                          <option key={option.label} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        name="responsibleUserId"
                        defaultValue={row.assessment?.responsibleUserId ?? ""}
                        className="h-9 rounded-md border bg-transparent px-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name || member.email}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        name="nextReviewAt"
                        defaultValue={row.assessment?.nextReviewAt?.toISOString().slice(0, 10) ?? ""}
                        className="h-9 rounded-md border bg-transparent px-2 text-sm"
                      />
                      <input
                        name="notes"
                        defaultValue={row.assessment?.notes ?? ""}
                        placeholder="Notes"
                        className="h-9 rounded-md border bg-transparent px-2 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={busy === row.requirement.id}>
                          Save
                        </Button>
                        <Link className="text-xs underline underline-offset-2" href={row.clause.href}>
                          Open
                        </Link>
                      </div>
                    </form>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.assessment?.lastReviewedAt
                        ? `Last reviewed ${row.assessment.lastReviewedAt.toISOString().slice(0, 10)}`
                        : "Not yet reviewed"}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
