import { NextResponse } from "next/server";
import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadAnalytics } from "@/server/queries/enterprise.queries";

export async function GET() {
  try {
    const ctx = await requireEnterpriseAccess("canViewAnalytics");
    if (!ctx.analyticsEnabled) {
      return NextResponse.json({ error: "Analytics is not enabled" }, { status: 403 });
    }
    const data = await loadAnalytics(ctx, { dimension: "industry" });
    const header = ["Company", "Industry", "Location", "Incidents", "Accidents", "Near miss", "RIDDOR", "TRIR"];
    const lines = [
      header.join(","),
      ...data.companies.map((row) => {
        const stats = row.stats as Record<string, unknown> | null;
        return [
          csv(row.tenantName),
          csv(row.industry ?? ""),
          csv(row.city ?? ""),
          stats ? Number(stats.incidentTotal) : "",
          stats ? Number(stats.accidentCount) : "",
          stats ? Number(stats.nearMissCount) : "",
          stats ? Number(stats.riddorCount) : "",
          stats?.trir != null ? Number(stats.trir).toFixed(2) : "",
        ].join(",");
      }),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=portfolio-analytics.csv",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }
}

function csv(value: string): string {
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}
