import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadBenchmark } from "@/server/queries/enterprise.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function vsLabel(value: "above" | "below" | "level" | null | undefined): string {
  if (value === "above") return "Above book";
  if (value === "below") return "Below book";
  if (value === "level") return "In line";
  return "—";
}

export default async function BenchmarkPage() {
  const ctx = await requireEnterpriseAccess();
  if (!ctx.benchmarkEnabled) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Risk Intelligence</h1>
        <p className="text-muted-foreground">This add-on is not enabled for your organisation.</p>
      </div>
    );
  }
  const data = await loadBenchmark(ctx);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Risk Intelligence</h1>
        <p className="text-muted-foreground">
          Anonymised industry and location comparison for {data.period}. Cells with fewer than five companies are hidden.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your book</CardTitle>
          <CardDescription>TRIR and LTIR for companies that shared loss statistics.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4 text-sm">
          <p>Companies: {data.book?.companyCount ?? 0}</p>
          <p>Incidents: {data.book?.incidentTotal ?? 0}</p>
          <p>Avg TRIR: {data.book?.avgTrir != null ? data.book.avgTrir.toFixed(2) : "—"}</p>
          <p>Avg LTIR: {data.book?.avgLtir != null ? data.book.avgLtir.toFixed(2) : "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Industry benchmark</CardTitle>
          <CardDescription>Grouped so that no single company can be identified.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Industry</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead>RIDDOR</TableHead>
                <TableHead>Avg TRIR</TableHead>
                <TableHead>Avg LTIR</TableHead>
                <TableHead>Vs book TRIR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.industries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Not enough companies in any industry cell yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.industries.map((row) => {
                  const record = row as Record<string, unknown>;
                  return (
                    <TableRow key={String(record.dimensionValue)}>
                      <TableCell>{String(record.dimensionValue)}</TableCell>
                      <TableCell>{Number(record.companyCount)}</TableCell>
                      <TableCell>{Number(record.incidentTotal)}</TableCell>
                      <TableCell>{Number(record.riddorCount)}</TableCell>
                      <TableCell>{record.avgTrir != null ? Number(record.avgTrir).toFixed(2) : "—"}</TableCell>
                      <TableCell>{record.avgLtir != null ? Number(record.avgLtir).toFixed(2) : "—"}</TableCell>
                      <TableCell>
                        {vsLabel(record.vsBookTrir as "above" | "below" | "level" | null)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Location benchmark</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead>RIDDOR</TableHead>
                <TableHead>Avg TRIR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.regions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Not enough companies in any location cell yet.
                  </TableCell>
                </TableRow>
              ) : (
                (data.regions as Array<Record<string, unknown>>).map((row) => (
                  <TableRow key={String(row.dimensionValue)}>
                    <TableCell>{String(row.dimensionValue)}</TableCell>
                    <TableCell>{Number(row.companyCount)}</TableCell>
                    <TableCell>{Number(row.incidentTotal)}</TableCell>
                    <TableCell>{Number(row.riddorCount)}</TableCell>
                    <TableCell>{row.avgTrir != null ? Number(row.avgTrir).toFixed(2) : "—"}</TableCell>
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
