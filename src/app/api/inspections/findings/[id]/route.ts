import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import {
  deleteInspectionFindingRecord,
  updateInspectionFindingRecord,
} from "@/server/queries/inspections.queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    const data = await request.json();
    const finding = await updateInspectionFindingRecord({
      tenantId: tenantContext.tenantId,
      findingId: id,
      title: data.title,
      description: data.description,
      severity: data.severity,
      location: data.location,
      imageKeys: data.imageKeys,
      status: data.status,
      responsibleId: data.responsibleId,
      dueDate: data.dueDate,
      resolutionNotes: data.resolutionNotes,
    });
    return createSuccessResponse({ finding }, "Finding updated");
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "FINDING_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Finding not found", 404);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not update finding", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    await deleteInspectionFindingRecord(tenantContext.tenantId, id);
    return createSuccessResponse(undefined, "Finding deleted");
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "FINDING_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Finding not found", 404);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not delete finding", 500);
  }
}
