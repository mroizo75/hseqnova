import Link from "next/link";
import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoEvidenceSnapshot } from "@/server/queries/iso.queries";
import { evaluateIsoClauses } from "@/features/iso/lib/evidence";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const LEVEL_LABEL = {
  covered: "Covered",
  partial: "Partial",
  missing: "Missing",
} as const;

export default async function IsoClauseMapPage() {
  const { auth, enabledModules } = await requireIsoPage();
  const snapshot = await loadIsoEvidenceSnapshot(auth.tenantId, enabledModules);
  const statuses = evaluateIsoClauses(snapshot);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clause map</h1>
        <p className="text-muted-foreground">
          Live coverage of ISO 45001 and ISO 9001. Status is calculated from records in HSEQ Nova — not a manual
          checklist.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2">Standard</th>
              <th className="px-3 py-2">Clause</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Evidence</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {statuses.map((item) => (
              <tr key={item.clause.id} className="border-b last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">
                  {item.clause.standard === "ISO_45001" ? "45001" : "9001"}
                </td>
                <td className="px-3 py-2">{item.clause.clause}</td>
                <td className="px-3 py-2">{item.clause.title}</td>
                <td className="px-3 py-2">{LEVEL_LABEL[item.level]}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.detail}</td>
                <td className="px-3 py-2">
                  <Link className="underline underline-offset-2" href={item.clause.href}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard/iso/auditor">Auditor view</Link>
      </Button>
    </div>
  );
}
