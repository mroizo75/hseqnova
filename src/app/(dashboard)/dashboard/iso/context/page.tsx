import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { IsoContextForms } from "@/features/iso/components/iso-context-forms";
import { IsoContextInterview } from "@/features/iso/components/iso-context-interview";
import {
  loadIsoContextIssues,
  loadIsoInterestedParties,
  loadIsoScope,
} from "@/server/queries/iso.queries";

export const dynamic = "force-dynamic";

export default async function IsoContextPage() {
  const { auth } = await requireIsoPage();
  const [issues, parties, scope] = await Promise.all([
    loadIsoContextIssues(auth.tenantId),
    loadIsoInterestedParties(auth.tenantId),
    loadIsoScope(auth.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">ISO 45001 / 9001 clause 4</p>
        <h1 className="text-3xl font-bold">Context, interested parties and scope</h1>
        <p className="text-muted-foreground">
          Write down the organisation, who it answers to, and what the management system covers. Scope must be approved
          before Context can turn green.
        </p>
      </div>
      <IsoContextInterview scope={scope} />
      <IsoContextForms issues={issues} parties={parties} scope={scope} />
    </div>
  );
}
