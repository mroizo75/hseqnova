import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseCompanies, loadEnterprisePortfolios } from "@/server/queries/enterprise.queries";
import { AssuranceBadge } from "@/features/enterprise/components/assurance-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AssurancePage() {
  const ctx = await requireEnterpriseAccess();
  const [companies, portfolios] = await Promise.all([
    loadEnterpriseCompanies(ctx, {}),
    loadEnterprisePortfolios(ctx),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assurance</h1>
        <p className="text-muted-foreground">Compare operational assurance across portfolios. Not a legal compliance certificate.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id}>
            <CardHeader>
              <CardTitle>{portfolio.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Average: {portfolio.averageAssurance ?? "—"}%</p>
              <p>Green {portfolio.goodStanding} · Amber {portfolio.attentionRequired} · Red {portfolio.criticalAttention}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {companies.map((row) => (
            <div key={row.membershipId} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div>
                <p className="font-medium">{row.tenantName}</p>
                <p className="text-xs text-muted-foreground">{row.portfolioName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span>{row.overallPercent ?? "—"}%</span>
                <AssuranceBadge band={row.overallBand} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
