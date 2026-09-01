import { redirect } from "next/navigation";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { loadCrmPipeline } from "@/server/queries/crm.queries";
import { CrmPipelineBoard } from "@/features/crm/components/crm-pipeline-board";

export default async function CrmPipelinePage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const deals = await loadCrmPipeline(staff);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground">
          Drag deals between stages. Unassigned leads stay with the sales manager until they are owned.
        </p>
      </div>
      <CrmPipelineBoard deals={deals} />
    </div>
  );
}
