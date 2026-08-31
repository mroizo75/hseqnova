import { getCurrentUser } from "@/lib/server-action";
import { redirect } from "next/navigation";
import { getPermissions } from "@/lib/permissions";
import { OrgChartTree } from "@/features/organization/components/org-chart-tree";
import { loadOrgChartNodes } from "@/server/queries/org-chart.queries";
import { Building2 } from "lucide-react";

export default async function OrgChartPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userTenant = user.tenants.at(0);
  if (!userTenant) {
    return <div>No access to organisation</div>;
  }

  const tenantId = userTenant.tenantId;
  const permissions = getPermissions(userTenant.role);

  const nodes = await loadOrgChartNodes(tenantId);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:gap-3 sm:text-3xl">
            <Building2 className="h-6 w-6 shrink-0 text-blue-600 sm:h-8 sm:w-8" />
            Organisation chart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Names, positions and health and safety roles (HSWA 1974 s.2(3) Part 2). Required in the
            written policy where there are five or more employees. Employees see this on the policy page.
          </p>
        </div>
      </div>

      <OrgChartTree
        nodes={nodes.map((n) => ({
          id: n.id,
          parentId: n.parentId,
          title: n.title,
          name: n.name,
          department: n.department,
          hsDutyKey: n.hsDutyKey ?? null,
          hsDuty: n.hsDuty ?? null,
          sortOrder: n.sortOrder,
        }))}
        canManage={permissions.canManageUsers}
      />
    </div>
  );
}
