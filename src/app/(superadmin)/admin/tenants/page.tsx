import { loadAdminTenants } from "@/server/queries/admin.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrganisationTable } from "@/features/admin/components/organisation-table";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function TenantsPage() {
  const tenants = await loadAdminTenants();

  const activeCount = tenants.filter((tenant) => tenant.billing === "paid").length;
  const trialCount = tenants.filter((tenant) => tenant.billing === "demo").length;
  const unpaidCount = tenants.filter((tenant) => tenant.billing === "unpaid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organisations</h1>
          <p className="text-muted-foreground">
            {tenants.length} organisations • {activeCount} paid • {trialCount} demo
            {unpaidCount > 0 && (
              <span className="font-medium text-destructive">
                {" "}• {unpaidCount} unpaid
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/admin/tenants/demo">Create demo</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              New organisation
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All organisations ({tenants.length})</CardTitle>
          <CardDescription>
            Select a name to open the organisation. Support and superadmin can edit it there. 20 rows per page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganisationTable
            rows={tenants.map((tenant) => ({
              id: tenant.id,
              name: tenant.name,
              orgNumber: tenant.orgNumber,
              contactEmail: tenant.contactEmail,
              status: tenant.status,
              billing: tenant.billing,
              userCount: tenant.userCount,
              lastLogin: tenant.lastLogin ? tenant.lastLogin.toISOString() : null,
              subscription: tenant.subscription,
              agreement:
                tenant.offers[0]?.status === "ACCEPTED"
                  ? "accepted"
                  : tenant.offers[0]?.status === "SENT"
                    ? "sent"
                    : null,
              overdueInvoiceCount: tenant.overdueInvoiceCount,
              recentIncidents: tenant.recentIncidents,
              recentDocuments: tenant.recentDocuments,
              riskCount: tenant.riskCount,
              activityLabel: tenant.activity.label,
              activityColor: tenant.activity.color,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
