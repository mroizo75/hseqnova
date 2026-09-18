import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoLegalRequirements } from "@/server/queries/iso.queries";
import { LegalRegisterClient } from "@/features/iso/components/legal-register-client";
import { IsoEvidenceNote } from "@/features/iso/components/iso-evidence-note";

export const dynamic = "force-dynamic";

export default async function LegalRegisterPage() {
  const { auth } = await requireIsoPage();
  const items = await loadIsoLegalRequirements(auth.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Legal and other requirements</h1>
        <p className="text-muted-foreground">
          ISO 45001 cl. 6.1.3 and 9.1.2 — know which duties apply, then evaluate compliance at planned intervals.
        </p>
      </div>
      <IsoEvidenceNote clause="ISO 45001 cl. 6.1.3 and 9.1.2" />
      <LegalRegisterClient items={items} />
    </div>
  );
}
