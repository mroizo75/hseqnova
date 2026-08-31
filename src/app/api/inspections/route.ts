import { NextRequest } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import {
  createInspectionRecord,
  loadInspectionsForList,
} from "@/server/queries/inspections.queries";
import { validateInspectionRecord, defaultLegalBasisForType } from "@/lib/inspection-uk";

export async function GET() {
  try {
    const tenantContext = await getRequiredTenantContext();
    const inspections = await loadInspectionsForList(tenantContext.tenantId);
    return createSuccessResponse({ inspections });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not load inspections", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const data = await request.json();
    const recordCheck = validateInspectionRecord({
      scheduledDate: data.scheduledDate,
      location: data.location,
      conductedBy: data.conductedBy,
    });
    if (recordCheck.ok !== true) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, recordCheck.message, 400);
    }

    const inspection = await createInspectionRecord({
      tenantId: tenantContext.tenantId,
      userId: tenantContext.userId,
      title: data.title,
      description: data.description,
      type: data.type,
      scheduledDate: data.scheduledDate,
      location: data.location,
      conductedBy: data.conductedBy,
      participants: data.participants,
      templateId: data.templateId,
      formTemplateId: data.formTemplateId,
      riskCategory: data.riskCategory,
      area: data.area,
      durationMinutes: data.durationMinutes ?? null,
      followUpById: data.followUpById,
      nextInspection: data.nextInspection,
      projectId: data.projectId,
      legalBasis: data.legalBasis ?? defaultLegalBasisForType(data.type || "VERNERUNDE"),
    });

    return createSuccessResponse({ inspection }, "Inspection created", 201);
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "PROJECT_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Project not found", 400);
    }
    if (code === "TEMPLATE_NOT_FOUND") {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Template not found", 400);
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Could not create inspection", 500);
  }
}
