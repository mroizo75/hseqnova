import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoConsultationMeetings } from "@/server/queries/iso.queries";
import { ConsultationClient } from "@/features/iso/components/consultation-client";
import { IsoEvidenceNote } from "@/features/iso/components/iso-evidence-note";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const { auth } = await requireIsoPage();
  const items = await loadIsoConsultationMeetings(auth.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consultation meetings</h1>
        <p className="text-muted-foreground">
          ISO 45001 cl. 5.4 and SRSCWR 1977 / HSCER 1996. Minutes are the record of worker consultation.
        </p>
      </div>
      <IsoEvidenceNote clause="ISO 45001 cl. 5.4" />
      <ConsultationClient items={items} />
    </div>
  );
}
