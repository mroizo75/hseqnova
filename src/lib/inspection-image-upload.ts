const INVALID_FILENAME_CHARS = /[^a-zA-Z0-9.-]/g;
const DEFAULT_FILENAME = "image";

interface BuildInspectionImageKeyParams {
  tenantId: string;
  inspectionId: string;
  fileName: string;
  timestamp?: number;
}

export function sanitizeInspectionFileName(fileName: string): string {
  const normalized = fileName?.trim() ?? "";
  const safeName = normalized.length > 0 ? normalized : DEFAULT_FILENAME;
  const sanitized = safeName.replace(INVALID_FILENAME_CHARS, "_");
  return sanitized.length > 0 ? sanitized : DEFAULT_FILENAME;
}

export function buildInspectionImageKey({
  tenantId,
  inspectionId,
  fileName,
  timestamp = Date.now(),
}: BuildInspectionImageKeyParams): string {
  if (!tenantId) {
    throw new Error("TenantId mangler");
  }

  if (!inspectionId) {
    throw new Error("InspectionId mangler");
  }

  const sanitizedFileName = sanitizeInspectionFileName(fileName);

  return `tenants/${tenantId}/inspections/${inspectionId}/${timestamp}-${sanitizedFileName}`;
}


