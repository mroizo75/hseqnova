import Link from "next/link";
import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoEvidenceSnapshot } from "@/server/queries/iso.queries";
import { evaluateIsoClauses } from "@/features/iso/lib/evidence";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function IsoAuditorPage() {
  const { auth, enabledModules } = await requireIsoPage();
  const snapshot = await loadIsoEvidenceSnapshot(auth.tenantId, enabledModules);
  const statuses = evaluateIsoClauses(snapshot);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">For UKAS certification audits — not an HSE return</p>
        <h1 className="text-3xl font-bold">Auditor pack</h1>
        <p className="text-muted-foreground">
          Each clause shows the requirement, the live evidence, and where to click. Export a PDF for stage 1 / stage 2.
        </p>
      </div>
      <Button asChild>
        <a href="/api/iso/auditor-pdf">Download evidence PDF</a>
      </Button>
      <ol className="space-y-4">
        {statuses.map((item) => (
          <li key={item.clause.id} className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">
              {item.clause.standard === "ISO_45001" ? "ISO 45001:2018" : "ISO 9001:2015"} cl. {item.clause.clause}
            </p>
            <h2 className="text-lg font-semibold">{item.clause.title}</h2>
            <p className="mt-1 text-sm">{item.clause.shall}</p>
            <p className="mt-2 text-sm">
              <span className="font-medium">Evidence now: </span>
              {item.detail} ({item.level})
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Show the auditor: {item.clause.auditorHint}</p>
            <Link className="mt-2 inline-block text-sm underline underline-offset-2" href={item.clause.href}>
              Open live records
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
