import { notFound } from "next/navigation";
import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseCompanies, loadEnterprisePortfolios } from "@/server/queries/enterprise.queries";
import { AssuranceBadge } from "@/features/enterprise/components/assurance-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireEnterpriseAccess();
  const { id } = await params;
  const portfolios = await loadEnterprisePortfolios(ctx);
  const portfolio = portfolios.find((row) => row.id === id);
  if (!portfolio) notFound();
  const companies = await loadEnterpriseCompanies(ctx, { portfolioId: id });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{portfolio.name}</h1>
        <p className="text-muted-foreground">
          Average assurance {portfolio.averageAssurance ?? "—"}% · {portfolio.companies} companies
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {companies.map((row) => (
            <Link
              key={row.membershipId}
              href={`/enterprise/companies/${row.tenantId}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent"
            >
              <span>{row.tenantName}</span>
              <AssuranceBadge band={row.overallBand} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
