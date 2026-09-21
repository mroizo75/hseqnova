import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseCompanies } from "@/server/queries/enterprise.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ReportsPage() {
  const ctx = await requireEnterpriseAccess();
  const companies = await loadEnterpriseCompanies(ctx, {});
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">CSV exports from assurance snapshots. PDF can follow the existing branded report pipeline later.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Portfolio HSEQ overview</CardTitle>
          <CardDescription>{companies.length} companies in the current view.</CardDescription>
        </CardHeader>
        <CardContent>
          {ctx.permissions.canExportReports ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="/api/enterprise/reports/csv">Download assurance CSV</a>
              </Button>
              {ctx.analyticsEnabled ? (
                <Button asChild variant="outline" className="bg-transparent">
                  <a href="/api/enterprise/analytics/csv">Download loss statistics CSV</a>
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You do not have export permission.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
