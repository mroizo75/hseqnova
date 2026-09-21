import Link from "next/link";
import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseOverview } from "@/server/queries/enterprise.queries";
import { OverviewCards } from "@/features/enterprise/components/overview-cards";
import { AssuranceBadge } from "@/features/enterprise/components/assurance-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function EnterpriseHomePage() {
  const ctx = await requireEnterpriseAccess();
  const overview = await loadEnterpriseOverview(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio overview</h1>
        <p className="text-muted-foreground">
          HSEQ Assurance across connected companies. Status only — not legal compliance.
        </p>
      </div>
      <OverviewCards {...overview} />
      <Card>
        <CardHeader>
          <CardTitle>Companies needing attention</CardTitle>
          <CardDescription>Latest assurance snapshot per connected company.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Portfolio</TableHead>
                <TableHead>Assurance</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.companiesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No connected companies yet.
                  </TableCell>
                </TableRow>
              ) : (
                overview.companiesList.map((row) => (
                  <TableRow key={row.membershipId}>
                    <TableCell>
                      <Link className="font-medium underline-offset-2 hover:underline" href={`/enterprise/companies/${row.tenantId}`}>
                        {row.tenantName}
                      </Link>
                    </TableCell>
                    <TableCell>{row.portfolioName}</TableCell>
                    <TableCell>
                      <AssuranceBadge band={row.overallBand} />
                      {row.overallPercent !== null ? ` ${row.overallPercent}%` : ""}
                    </TableCell>
                    <TableCell className="capitalize">{row.trend?.toLowerCase() ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
