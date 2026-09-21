import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadAnalytics, loadEnterprisePortfolios } from "@/server/queries/enterprise.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { periodKeys } from "@/lib/enterprise-stats";

function vsLabel(value: "above" | "below" | "level" | null): string {
  if (value === "above") return "Above book";
  if (value === "below") return "Below book";
  if (value === "level") return "In line";
  return "—";
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    dimension?: string;
    portfolioId?: string;
    industry?: string;
    city?: string;
    sizeBand?: string;
  }>;
}) {
  const ctx = await requireEnterpriseAccess();
  if (!ctx.analyticsEnabled) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Portfolio analytics</h1>
        <p className="text-muted-foreground">This add-on is not enabled for your organisation.</p>
      </div>
    );
  }
  const params = await searchParams;
  const period = params.period || periodKeys(new Date()).monthly;
  const dimension = params.dimension || "industry";
  const [data, portfolios] = await Promise.all([
    loadAnalytics(ctx, { ...params, period, dimension }),
    loadEnterprisePortfolios(ctx),
  ]);
  const industries = [...new Set(data.companies.map((row) => row.industry).filter(Boolean))] as string[];
  const cities = [...new Set(data.companies.map((row) => row.city).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio analytics</h1>
        <p className="text-muted-foreground">
          Loss statistics for companies that have shared counts. No names of injured persons, no incident descriptions.
        </p>
        {ctx.benchmarkEnabled ? (
          <p className="mt-2 text-sm">
            <Link className="underline" href="/enterprise/analytics/benchmark">
              Open Risk Intelligence benchmark
            </Link>
          </p>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Book {data.period}</CardTitle>
          <CardDescription>
            TRIR vs {data.previousPeriod}: {data.book.vsPrevious ?? "no prior period"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4 text-sm">
          <p>Companies: {data.book.companyCount}</p>
          <p>Incidents: {data.book.incidentTotal}</p>
          <p>RIDDOR: {data.book.riddorCount}</p>
          <p>Avg TRIR: {data.book.avgTrir != null ? data.book.avgTrir.toFixed(2) : "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-2">
            <Input name="period" defaultValue={period} className="w-36" aria-label="Period" />
            <select name="dimension" defaultValue={dimension} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="industry">Industry</option>
              <option value="region">Location</option>
              <option value="sizeBand">Size band</option>
              <option value="portfolio">Portfolio</option>
            </select>
            <select name="portfolioId" defaultValue={params.portfolioId ?? ""} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="">All portfolios</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
            <select name="industry" defaultValue={params.industry ?? ""} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="">All industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <select name="city" defaultValue={params.city ?? ""} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="">All locations</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select name="sizeBand" defaultValue={params.sizeBand ?? ""} className="h-11 rounded-md border bg-transparent px-3 text-sm">
              <option value="">All sizes</option>
              <option value="1-9">1–9</option>
              <option value="10-49">10–49</option>
              <option value="50-249">50–249</option>
              <option value="250+">250+</option>
            </select>
            <button className="h-11 rounded-md border px-3 text-sm" type="submit">
              Apply
            </button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>By {dimension}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead>Accidents</TableHead>
                <TableHead>Near miss</TableHead>
                <TableHead>RIDDOR</TableHead>
                <TableHead>Avg TRIR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.rollups as Array<Record<string, unknown>>).map((row) => (
                <TableRow key={`${row.dimensionValue}-${row.period}`}>
                  <TableCell>{String(row.dimensionValue)}</TableCell>
                  <TableCell>{Number(row.companyCount)}</TableCell>
                  <TableCell>{Number(row.incidentTotal)}</TableCell>
                  <TableCell>{Number(row.accidentCount)}</TableCell>
                  <TableCell>{Number(row.nearMissCount)}</TableCell>
                  <TableCell>{Number(row.riddorCount)}</TableCell>
                  <TableCell>{row.avgTrir != null ? Number(row.avgTrir).toFixed(2) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Named companies in this book</CardTitle>
          <CardDescription>Only companies that opted in to share loss statistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead>Accidents</TableHead>
                <TableHead>RIDDOR</TableHead>
                <TableHead>TRIR</TableHead>
                <TableHead>Vs book</TableHead>
                <TableHead>Vs last period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.companies.map((row) => {
                const stats = row.stats as Record<string, unknown> | null;
                return (
                  <TableRow key={row.membershipId}>
                    <TableCell>{row.tenantName}</TableCell>
                    <TableCell>{row.industry ?? "—"}</TableCell>
                    <TableCell>{stats ? Number(stats.incidentTotal) : "—"}</TableCell>
                    <TableCell>{stats ? Number(stats.accidentCount) : "—"}</TableCell>
                    <TableCell>{stats ? Number(stats.riddorCount) : "—"}</TableCell>
                    <TableCell>{stats?.trir != null ? Number(stats.trir).toFixed(2) : "—"}</TableCell>
                    <TableCell>{vsLabel(row.vsBook)}</TableCell>
                    <TableCell className="capitalize">{row.vsPrevious ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
