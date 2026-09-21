import { notFound } from "next/navigation";
import Link from "next/link";
import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import {
  loadIsoDocumentOptions,
  loadIsoReadiness,
  loadIsoTenantMembers,
} from "@/server/queries/iso.queries";
import { loadDocumentFormOptions } from "@/server/queries/documents.queries";
import { IsoClauseDossier } from "@/features/iso/components/iso-clause-dossier";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function IsoClauseDossierPage({
  params,
}: {
  params: Promise<{ clauseKey: string }>;
}) {
  const { clauseKey } = await params;
  const { auth, enabledModules } = await requireIsoPage();
  const [{ matrix }, members, documentOptions, formOptions] = await Promise.all([
    loadIsoReadiness(auth.tenantId, enabledModules),
    loadIsoTenantMembers(auth.tenantId),
    loadIsoDocumentOptions(auth.tenantId),
    loadDocumentFormOptions(auth.tenantId),
  ]);
  const row = matrix.find((item) => item.clause.id === clauseKey || item.requirement.clauseKey === clauseKey);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Work this clause the way the auditor will</p>
          <h1 className="text-3xl font-bold">Clause dossier</h1>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/dashboard/iso/clauses">Back to matrix</Link>
        </Button>
      </div>
      <IsoClauseDossier
        row={row}
        members={members}
        documentOptions={documentOptions}
        tenantId={auth.tenantId}
        owners={formOptions.owners}
        templates={formOptions.templates}
        canCreateDocuments={auth.permissions.canCreateDocuments}
        canApproveDocuments={auth.permissions.canApproveDocuments}
        approverId={auth.userId}
      />
    </div>
  );
}
