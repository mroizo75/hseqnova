import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import {
  deleteInspectionRecord,
  loadInspectionDetail,
  updateInspectionRecord,
} from "@/server/queries/inspections.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    const inspection = await loadInspectionDetail(tenantContext.tenantId, id);
    if (!inspection) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Inspection not found", 404);
    }
    return createSuccessResponse({ inspection });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not load inspection", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    const data = await request.json();
    const inspection = await updateInspectionRecord({
      tenantId: tenantContext.tenantId,
      inspectionId: id,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      scheduledDate: data.scheduledDate,
      completedDate: data.completedDate,
      location: data.location,
      conductedBy: data.conductedBy,
      participants: data.participants,
      checklist: data.checklist,
      legalBasis: data.legalBasis,
    });
    return createSuccessResponse({ inspection }, "Inspection updated");
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "INSPECTION_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Inspection not found", 404);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not update inspection", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id } = await params;
    await deleteInspectionRecord(tenantContext.tenantId, id);
    return createSuccessResponse(undefined, "Inspection deleted");
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "INSPECTION_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Inspection not found", 404);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not delete inspection", 500);
  }
}
