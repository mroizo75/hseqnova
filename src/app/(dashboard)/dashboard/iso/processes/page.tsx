import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoCustomerFeedback, loadIsoProcesses, loadIsoTenantMembers } from "@/server/queries/iso.queries";
import { IsoQmsOperations } from "@/features/iso/components/iso-qms-operations";

export const dynamic = "force-dynamic";

export default async function IsoProcessesPage() {
  const { auth } = await requireIsoPage();
  const [processes, feedback, members] = await Promise.all([
    loadIsoProcesses(auth.tenantId),
    loadIsoCustomerFeedback(auth.tenantId),
    loadIsoTenantMembers(auth.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">ISO 9001:2015 clauses 4.4, 8.1, 8.2 and 9.1.2</p>
        <h1 className="text-3xl font-bold">Processes and customers</h1>
        <p className="text-muted-foreground">
          The quality management system is the work you already do, named so an auditor can follow it. Attach procedures
          on each clause dossier — do not dump files here.
        </p>
      </div>
      <IsoQmsOperations processes={processes} feedback={feedback} members={members} />
    </div>
  );
}
