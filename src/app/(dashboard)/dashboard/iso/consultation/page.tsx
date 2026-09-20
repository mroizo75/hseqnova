import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoConsultationHub } from "@/server/queries/iso.queries";
import { IsoConsultationHubView } from "@/features/iso/components/iso-consultation-hub";

export const dynamic = "force-dynamic";

export default async function IsoConsultationPage() {
  const { auth } = await requireIsoPage();
  const hub = await loadIsoConsultationHub(auth.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">ISO 45001 5.4 / 7.4 · PIDA 1998</p>
        <h1 className="text-3xl font-bold">Worker consultation</h1>
      </div>
      <IsoConsultationHubView hub={hub} />
    </div>
  );
}
