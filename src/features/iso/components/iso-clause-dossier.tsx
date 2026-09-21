"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentForm } from "@/features/documents/components/document-form";
import { linkIsoDocument, unlinkIsoDocument, saveIsoClauseAssessment } from "@/server/actions/iso.actions";
import { approveDocument } from "@/server/actions/document.actions";
import { clauseDossierHref } from "@/features/iso/lib/documented-information";
import { effectiveAssessedLevel, type IsoAssessedLevel } from "@/features/iso/lib/readiness";
import type { IsoMatrixRow, IsoTenantMember, IsoDocumentOption } from "@/server/queries/iso.queries";

const ASSESSED_OPTIONS: Array<{ value: "" | IsoAssessedLevel; label: string }> = [
  { value: "", label: "Use auto" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "PARTIAL", label: "Partial" },
  { value: "GAP", label: "Gap" },
  { value: "MAJOR_GAP", label: "Major gap" },
];

export function IsoClauseDossier({
  row,
  members,
  documentOptions,
  tenantId,
  owners,
  templates,
  canCreateDocuments,
  canApproveDocuments,
  approverId,
}: {
  row: IsoMatrixRow;
  members: IsoTenantMember[];
  documentOptions: IsoDocumentOption[];
  tenantId: string;
  owners: Array<{ id: string; name: string | null; email: string; role: string }>;
  templates: Array<{
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
    defaultReviewIntervalMonths: number;
    isGlobal: boolean;
    pdcaGuidance?: Record<string, string> | null;
  }>;
  canCreateDocuments: boolean;
  canApproveDocuments: boolean;
  approverId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const effective = effectiveAssessedLevel(row.autoLevel, row.assessment?.assessedLevel ?? null);
  const unlinked = documentOptions.filter((doc) => !row.documents.some((linked) => linked.id === doc.id));

  async function run(label: string, work: () => Promise<{ success: true } | { success: false; error: string }>) {
    setBusy(label);
    setError(null);
    const result = await work();
    setBusy(null);
    if (result.success === false) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">
            {row.clause.standard === "ISO_45001" ? "ISO 45001:2018" : "ISO 9001:2015"} clause {row.clause.clause}
          </p>
          <CardTitle>{row.clause.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">The requirement: </span>
            {row.clause.shall}
          </p>
          <p>
            <span className="font-medium">What the auditor will ask: </span>
            {row.clause.auditorHint}
          </p>
          <p>
            <span className="font-medium">Do this: </span>
            {row.clause.doThis}
          </p>
          <p>
            <span className="font-medium">Live evidence now: </span>
            {row.autoDetail} ({row.autoLevel})
          </p>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href={row.clause.href}>Open the live module</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controlled documents (ISO 7.5)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload or link the procedure, policy or record for this clause. Drafts are not evidence — approve the working
            copy, name an owner and set a review date. Obsolete copies stay in version history.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {row.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No document is attached to this clause yet.</p>
          ) : (
            <ul className="space-y-2">
              {row.documents.map((doc) => (
                <li key={doc.linkId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div>
                    <Link className="font-medium underline underline-offset-2" href={`/dashboard/documents/${doc.id}`}>
                      {doc.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {doc.version} · {doc.status}
                      {doc.status !== "APPROVED" ? " — approve before the audit" : ""}
                      {doc.nextReviewDate ? ` · review ${doc.nextReviewDate.toISOString().slice(0, 10)}` : " · set a review date"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {doc.status !== "APPROVED" && canApproveDocuments ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy === doc.id}
                        onClick={() =>
                          run(doc.id, async () => {
                            const result = await approveDocument({ id: doc.id, approvedBy: approverId });
                            if (!result.success) return { success: false as const, error: result.error };
                            return { success: true as const };
                          })
                        }
                      >
                        Approve
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      disabled={busy === doc.linkId}
                      onClick={() => run(doc.linkId, () => unlinkIsoDocument(doc.linkId, row.clause.id))}
                    >
                      Unlink
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {unlinked.length > 0 ? (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void run("link", () =>
                  linkIsoDocument({
                    documentId: String(data.get("documentId")),
                    requirementId: row.requirement.id,
                    clauseKey: row.clause.id,
                    role: String(data.get("role") || "PROCEDURE"),
                  }),
                );
              }}
            >
              <div className="min-w-[220px] flex-1">
                <Label htmlFor="documentId">Link an existing document</Label>
                <select id="documentId" name="documentId" required className="mt-1 h-9 w-full rounded-md border bg-transparent px-2 text-sm">
                  {unlinked.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.status} {doc.version})
                    </option>
                  ))}
                </select>
              </div>
              <select name="role" className="h-9 rounded-md border bg-transparent px-2 text-sm">
                <option value="PROCEDURE">Procedure</option>
                <option value="POLICY">Policy</option>
                <option value="RECORD">Record</option>
                <option value="FORM">Form</option>
                <option value="EXTERNAL">External origin</option>
              </select>
              <Button type="submit" size="sm" disabled={busy !== null}>
                Link
              </Button>
            </form>
          ) : null}

          {canCreateDocuments ? (
            showUpload ? (
              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-medium">Upload a new controlled document for this clause</p>
                <DocumentForm
                  tenantId={tenantId}
                  owners={owners}
                  templates={templates}
                  isoClauseKey={row.clause.id}
                  isoRequirementId={row.requirement.id}
                  afterCreateHref={clauseDossierHref(row.clause.id)}
                />
              </div>
            ) : (
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => setShowUpload(true)}>
                Upload a new file for this clause
              </Button>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Competent person assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const assessed = String(data.get("assessedLevel") ?? "");
              void run("assess", () =>
                saveIsoClauseAssessment({
                  requirementId: row.requirement.id,
                  assessedLevel: assessed === "" ? null : assessed,
                  responsibleUserId: String(data.get("responsibleUserId") ?? "") || null,
                  notes: String(data.get("notes") ?? ""),
                  nextReviewAt: String(data.get("nextReviewAt") ?? "") || undefined,
                }),
              );
            }}
          >
            <p className="md:col-span-2 text-sm text-muted-foreground">
              Effective status: <span className="font-medium">{effective}</span>
              {effective === "MAJOR_GAP" ? " — this blocks READY" : ""}
            </p>
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
              placeholder="Assessment notes"
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
            />
            <Button type="submit" disabled={busy === "assess"}>
              Save assessment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
