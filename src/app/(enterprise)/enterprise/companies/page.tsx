import Link from "next/link";
import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseCompanies, loadEnterprisePortfolios } from "@/server/queries/enterprise.queries";
import { AssuranceBadge } from "@/features/enterprise/components/assurance-badge";
import { InviteCompanyForm } from "@/features/enterprise/components/invite-company-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default async function EnterpriseCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; portfolioId?: string; band?: string }>;
}) {
  const ctx = await requireEnterpriseAccess();
  const params = await searchParams;
  const [companies, portfolios] = await Promise.all([
    loadEnterpriseCompanies(ctx, params),
    loadEnterprisePortfolios(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-muted-foreground">Connected organisations and their HSEQ Assurance status.</p>
      </div>
      {ctx.permissions.canInviteCompanies ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite a company</CardTitle>
            <CardDescription>The company administrator must accept before any data is shared.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteCompanyForm portfolios={portfolios.map((row) => ({ id: row.id, name: row.name }))} />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{companies.length} companies</CardTitle>
          <form className="flex flex-wrap gap-2">
            <Input name="q" placeholder="Search" defaultValue={params.q} className="max-w-xs" />
            <select name="portfolioId" defaultValue={params.portfolioId ?? ""} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="">All portfolios</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
            <select name="band" defaultValue={params.band ?? ""} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="">All status</option>
              <option value="GREEN">Good standing</option>
              <option value="AMBER">Attention</option>
              <option value="RED">Critical</option>
            </select>
            <button className="h-11 rounded-md border px-3 text-sm" type="submit">
              Filter
            </button>
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Portfolio</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assurance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((row) => (
                <TableRow key={row.membershipId}>
                  <TableCell>
                    <Link className="font-medium underline-offset-2 hover:underline" href={`/enterprise/companies/${row.tenantId}`}>
                      {row.tenantName}
                    </Link>
                  </TableCell>
                  <TableCell>{row.portfolioName}</TableCell>
                  <TableCell>{row.industry ?? "—"}</TableCell>
                  <TableCell>{row.city ?? "—"}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>
                    <AssuranceBadge band={row.overallBand} />
                    {row.overallPercent !== null ? ` ${row.overallPercent}%` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
