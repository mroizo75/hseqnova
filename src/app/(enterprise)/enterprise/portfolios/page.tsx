import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterprisePortfolios } from "@/server/queries/enterprise.queries";
import { CreatePortfolioForm } from "@/features/enterprise/components/create-portfolio-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function PortfoliosPage() {
  const ctx = await requireEnterpriseAccess();
  const portfolios = await loadEnterprisePortfolios(ctx);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolios</h1>
        <p className="text-muted-foreground">Group companies by scheme, network or division.</p>
      </div>
      {ctx.permissions.canManagePortfolios ? (
        <Card>
          <CardHeader>
            <CardTitle>New portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePortfolioForm />
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/enterprise/portfolios/${portfolio.id}`} className="hover:underline">
                  {portfolio.name}
                </Link>
              </CardTitle>
              <CardDescription>
                {[portfolio.sector, portfolio.region].filter(Boolean).join(" · ") || "No sector set"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Companies: {portfolio.companies}</p>
              <p>Average assurance: {portfolio.averageAssurance ?? "—"}%</p>
              <p>Green {portfolio.goodStanding} · Amber {portfolio.attentionRequired} · Red {portfolio.criticalAttention}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
