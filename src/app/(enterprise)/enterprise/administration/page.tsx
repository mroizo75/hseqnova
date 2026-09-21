import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterprisePortfolios, loadEnterpriseUsers } from "@/server/queries/enterprise.queries";
import { AdministrationForms } from "@/features/enterprise/components/administration-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEnterpriseRoleLabel } from "@/lib/enterprise-permissions";
import type { EnterpriseRole } from "@prisma/client";

export default async function AdministrationPage() {
  const ctx = await requireEnterpriseAccess();
  const [users, portfolios] = await Promise.all([
    loadEnterpriseUsers(ctx),
    loadEnterprisePortfolios(ctx),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">{ctx.organisationName}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enterprise users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {users.map((row) => (
            <div key={String(row.id)} className="flex justify-between rounded-lg border px-3 py-2">
              <span>{(row.user as { email?: string } | null)?.email}</span>
              <span>{getEnterpriseRoleLabel(row.role as EnterpriseRole)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <AdministrationForms
            canManageUsers={ctx.permissions.canManageUsers}
            canManageBranding={ctx.permissions.canManageBranding}
            canImport={ctx.permissions.canImportCompanies}
            portfolios={portfolios.map((row) => ({ id: row.id, name: row.name }))}
            branding={{
              programmeName: ctx.programmeName,
              welcomeText: ctx.welcomeText,
              primaryColour: ctx.primaryColour,
              analyticsEnabled: ctx.analyticsEnabled,
              benchmarkEnabled: ctx.benchmarkEnabled,
              showPoweredBy: ctx.showPoweredBy,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
