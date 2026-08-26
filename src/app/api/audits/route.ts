import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import { insertAudit, loadAudits } from "@/server/queries/audits.queries";

export async function GET() {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const audits = await loadAudits(tenantId);
    return createSuccessResponse({ audits });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not load audits", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const data = await request.json();

    const audit = await insertAudit({
      tenantId,
      title: data.title,
      auditType: data.auditType || "INTERNAL",
      scope: data.scope,
      criteria: data.criteria,
      leadAuditorId: data.leadAuditorId || userId,
      teamMemberIds: data.teamMemberIds,
      scheduledDate: new Date(data.scheduledDate),
      area: data.area,
      department: data.department,
      status: "PLANNED",
    });

    return createSuccessResponse({ audit }, "Audit created", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not create the audit", 500);
  }
}
