import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { generateInspectionReport } from "@/lib/inspection-pdf";
import { loadInspectionDetail, loadInspectionPeople, loadTenantBranding, parseParticipantIds } from "@/server/queries/inspections.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    const inspection = await loadInspectionDetail(tenantContext.tenantId, id);
    if (!inspection) {
      return new NextResponse("Inspection not found", { status: 404 });
    }

    const tenant = await loadTenantBranding(tenantContext.tenantId);
    const participantIds = parseParticipantIds(inspection.participants);
    const people = await loadInspectionPeople([inspection.conductedBy, ...participantIds]);
    const nameOf = (id: string) => {
      const person = people.find((entry) => entry.id === id);
      return person?.name || person?.email || id;
    };
    const inspectorName = nameOf(inspection.conductedBy);
    const participantNames = participantIds.map(nameOf).filter(Boolean).join(", ") || null;

    const pdfBuffer = await generateInspectionReport({
      ...inspection,
      conductedBy: inspectorName,
      participants: participantNames,
      tenantName: tenant?.name,
      tenantOrgNumber: tenant?.orgNumber,
      tenantLogoUrl: tenant?.logoUrl,
    });

    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Inspection-${inspection.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
