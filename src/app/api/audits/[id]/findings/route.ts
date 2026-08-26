import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import { insertFinding, loadAudit } from "@/server/queries/audits.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id: auditId } = await params;
    const audit = await loadAudit(auditId, tenantId);
    if (!audit) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Audit not found", 404);
    }
    return createSuccessResponse({ findings: audit.findings });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not load findings", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id: auditId } = await params;
    const data = await request.json();
    const audit = await loadAudit(auditId, tenantId);
    if (!audit) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Audit not found", 404);
    }

    const finding = await insertFinding({
      auditId: audit.id,
      findingType: data.findingType || "OBSERVATION",
      clause: data.clause,
      description: data.description,
      evidence: data.evidence,
      requirement: data.requirement,
      responsibleId: data.responsibleId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });

    return createSuccessResponse({ finding }, "Finding recorded", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not record the finding", 500);
  }
}
