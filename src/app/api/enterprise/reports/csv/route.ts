import { NextResponse } from "next/server";
import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseCompanies } from "@/server/queries/enterprise.queries";

export async function GET() {
  try {
    const ctx = await requireEnterpriseAccess("canExportReports");
    const companies = await loadEnterpriseCompanies(ctx, {});
    const header = ["Company", "Portfolio", "Industry", "Location", "Status", "Assurance %", "Band", "Trend"];
    const lines = [
      header.join(","),
      ...companies.map((row) =>
        [
          csv(row.tenantName),
          csv(row.portfolioName),
          csv(row.industry ?? ""),
          csv(row.city ?? ""),
          csv(row.status),
          row.overallPercent ?? "",
          row.overallBand ?? "",
          row.trend ?? "",
        ].join(","),
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=hseq-assurance.csv",
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
