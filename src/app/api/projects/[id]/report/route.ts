import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { generateProjectReport } from "@/lib/project-pdf";
import { loadProjectReportBundle } from "@/server/queries/projects.queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;

    const bundle = await loadProjectReportBundle(id, tenantId);
    if (!bundle) return new NextResponse("Project not found", { status: 404 });

    const { project } = bundle;
    const manHours = project.timeEntries.reduce((s, e) => s + e.hours, 0);

    const pdfBuffer = await generateProjectReport({
      project: {
        ...project,
        createdBy: project.createdBy,
        projectManager: project.projectManager,
      },
      incidents: project.incidents,
      sjaAnalyses: project.sjaAnalyses.map((row) => ({
        sjaNummer: row.sjaNummer,
        title: row.title,
        status: row.status,
        plannedDate: row.plannedDate,
        workLocation: row.workLocation,
        responsibleName: row.responsibleName ?? "",
        conclusion: row.conclusion ?? "",
      })),
      inspections: project.inspections,
      measures: project.measures,
      attachments: project.attachments,
      manHours,
      tenantName: bundle.tenantName ?? "HSEQ Nova",
    });

    const filename = `HSEQ-Report-${project.name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
