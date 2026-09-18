import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoChanges } from "@/server/queries/iso.queries";
import { ChangeRegisterClient } from "@/features/iso/components/change-register-client";
import { IsoEvidenceNote } from "@/features/iso/components/iso-evidence-note";

export const dynamic = "force-dynamic";

export default async function ChangesPage() {
  const { auth } = await requireIsoPage();
  const items = await loadIsoChanges(auth.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Management of change</h1>
        <p className="text-muted-foreground">
          ISO 45001 cl. 8.1.3 — planned changes to plant, process or organisation are assessed before they go live.
        </p>
      </div>
      <IsoEvidenceNote clause="ISO 45001 cl. 8.1.3" />
      <ChangeRegisterClient items={items} />
    </div>
  );
}
