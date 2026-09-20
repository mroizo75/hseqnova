import Link from "next/link";
import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoReadiness, loadIsoTenantMembers } from "@/server/queries/iso.queries";
import { Button } from "@/components/ui/button";
import { IsoClauseMatrix } from "@/features/iso/components/iso-clause-matrix";

export const dynamic = "force-dynamic";

export default async function IsoClauseMapPage() {
  const { auth, enabledModules } = await requireIsoPage();
  const [{ matrix }, members] = await Promise.all([
    loadIsoReadiness(auth.tenantId, enabledModules),
    loadIsoTenantMembers(auth.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clause matrix</h1>
        <p className="text-muted-foreground">
          Gap analysis against the published ISO 45001:2018 and ISO 9001:2015 requirements. Auto-status is calculated
          from live records; the competent person records the assessment, owner and review date.
        </p>
      </div>
      <IsoClauseMatrix rows={matrix} members={members} />
      <Button asChild variant="outline">
        <Link href="/dashboard/iso/auditor">Auditor view</Link>
      </Button>
    </div>
  );
}
