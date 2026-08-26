import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import {
  deleteAuditRecord,
  loadAudit,
  updateAuditRecord,
} from "@/server/queries/audits.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;
    const audit = await loadAudit(id, tenantId);
    if (!audit) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Audit not found", 404);
    }
    return createSuccessResponse({ audit });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "No organisation access", 403);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not load the audit", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;
    const data = await request.json();
    const existing = await loadAudit(id, tenantId);
    if (!existing) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Audit not found", 404);
    }

    const audit = await updateAuditRecord({
      id: existing.id,
      tenantId,
      title: data.title,
      auditType: data.auditType,
      scope: data.scope,
      criteria: data.criteria,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      area: data.area,
      department: data.department,
      status: data.status,
      summary: data.summary,
      conclusion: data.conclusion,
      teamMemberIds: data.teamMemberIds,
    });

    return createSuccessResponse({ audit }, "Audit updated");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "No organisation access", 403);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not update the audit", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;
    const existing = await loadAudit(id, tenantId);
    if (!existing) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Audit not found", 404);
    }
    await deleteAuditRecord(existing.id, tenantId);
    return createSuccessResponse(undefined, "Audit deleted");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "No organisation access", 403);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not delete the audit", 500);
  }
}
