import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import {
  createInspectionFindingRecord,
  loadInspectionFindings,
} from "@/server/queries/inspections.queries";
import { validateInspectionFinding } from "@/lib/inspection-uk";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const { id: inspectionId } = await params;
    const findings = await loadInspectionFindings(tenantContext.tenantId, inspectionId);
    return createSuccessResponse({ findings });
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "INSPECTION_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Inspection not found", 404);
    }
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
    const tenantContext = await getRequiredTenantContext();
    const { id: inspectionId } = await params;
    const data = await request.json();
    const findingCheck = validateInspectionFinding({
      title: data.title,
      description: data.description,
      responsibleId: data.responsibleId,
      dueDate: data.dueDate,
    });
    if (findingCheck.ok !== true) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, findingCheck.message, 400);
    }
    const finding = await createInspectionFindingRecord({
      tenantId: tenantContext.tenantId,
      userId: tenantContext.userId,
      inspectionId,
      title: data.title,
      description: data.description,
      severity: data.severity,
      location: data.location,
      imageKeys: data.imageKeys,
      responsibleId: data.responsibleId,
      dueDate: data.dueDate,
    });
    return createSuccessResponse({ finding }, "Finding recorded", 201);
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "INSPECTION_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Inspection not found", 404);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not record finding", 500);
  }
}
