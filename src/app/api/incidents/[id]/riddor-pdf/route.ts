import { NextRequest, NextResponse } from "next/server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";
import { generateF2508Pdf, type F2508Data } from "@/lib/riddor-f2508-pdf";

/**
 * GET /api/incidents/[id]/riddor-pdf
 *
 * Generates a RIDDOR F2508 report PDF for a given incident.
 * Only available for incidents marked as RIDDOR-reportable.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, email } = await getRequiredTenantContext();
    const { id } = await params;
    const db = getAdminDb();

    const { data: incident, error: incidentError } = await db
      .from("Incident")
      .select("*")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (incidentError) {
      return NextResponse.json({ error: "Failed to load incident" }, { status: 500 });
    }
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }
    if (!incident.riddorReportable) {
      return NextResponse.json(
        { error: "This incident is not RIDDOR-reportable" },
        { status: 400 },
      );
    }

    const { data: tenant } = await db
      .from("Tenant")
      .select("name, address, city, postalCode, contactPhone, contactEmail")
      .eq("id", tenantId)
      .maybeSingle();

    const { data: reporter } = await db
      .from("User")
      .select("name, email")
      .eq("id", incident.reportedBy)
      .maybeSingle();

    const orgAddress = [tenant?.address, tenant?.postalCode, tenant?.city]
      .filter(Boolean)
      .join(", ");

    const occurredAt = new Date(incident.occurredAt);
    const incidentTime = occurredAt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const f2508Data: F2508Data = {
      notifierName: reporter?.name ?? email ?? "Unknown",
      notifierJobTitle: "HSE Manager",
      notifierPhone: tenant?.contactPhone ?? "",
      notifierEmail: reporter?.email ?? email ?? "",

      incidentDate: occurredAt,
      incidentTime,
      incidentLocation: incident.location ?? "",
      localAuthority: "",

      injuredPersonName: incident.involvedPersons ?? undefined,
      injuredPersonOccupation: undefined,
      injuredPersonEmploymentStatus: "employee",

      incidentType: incident.riddorCategory,
      injuryDescription: incident.injuryDescription ?? incident.injuryType ?? undefined,
      bodyPartAffected: undefined,

      description: incident.description ?? "",

      organisationName: tenant?.name ?? "Unknown",
      organisationAddress: orgAddress,

      internalRef: incident.avviksnummer ?? incident.id,
      riddorReference: incident.riddorReference ?? undefined,
      riddorDueAt: incident.riddorDueAt ? new Date(incident.riddorDueAt) : undefined,
    };

    const pdf = await generateF2508Pdf(f2508Data);
    const filename = `F2508-${incident.avviksnummer ?? id}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate F2508 report" },
      { status: 500 },
    );
  }
}
