import { getAdminDb } from "@/lib/supabase/admin";
import { deleteTenantFiles } from "@/lib/storage";

export interface DeletionResult {
  tenantId: string;
  tenantName: string;
  filesDeleted: number;
  fileErrors: number;
  usersRemoved: number;
}

/**
 * Permanently delete all tenant data.
 *
 * The Postgres schema uses ON DELETE CASCADE on most FK relations,
 * so deleting the Tenant row removes child rows automatically.
 * We handle storage files and orphan users explicitly first.
 */
export async function permanentlyDeleteTenant(tenantId: string): Promise<DeletionResult> {
  const db = getAdminDb();

  const { data: tenant } = await db
    .from("Tenant")
    .select("id, name")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    throw { code: "TENANT_NOT_FOUND", message: "Tenant not found" };
  }

  // 1. Delete all files in R2/S3 storage (prefix: tenantId/)
  const { deleted: filesDeleted, errors: fileErrors } = await deleteTenantFiles(tenantId);

  // 2. Find users who ONLY belong to this tenant (orphans after deletion)
  const { data: memberships } = await db
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);

  const userIds = (memberships ?? []).map((m) => m.userId as string);
  let usersRemoved = 0;

  if (userIds.length > 0) {
    // For each user, check if they belong to other tenants
    for (const userId of userIds) {
      const { count } = await db
        .from("UserTenant")
        .select("id", { count: "exact", head: true })
        .eq("userId", userId)
        .neq("tenantId", tenantId);

      if (count === 0) {
        // User only belongs to this tenant — delete them
        await db.from("User").delete().eq("id", userId);
        usersRemoved++;
      }
    }
  }

  // 3. Delete the Tenant row (cascades to all child tables)
  const now = new Date().toISOString();
  await db
    .from("Tenant")
    .update({
      status: "CANCELLED",
      deletedAt: now,
      // Wipe PII but keep the row for billing audit (HMRC 6 years)
      contactEmail: null,
      contactPhone: null,
      contactPerson: null,
      invoiceEmail: null,
      address: null,
      city: null,
      postalCode: null,
      invoiceAddress: null,
      invoicePostalCode: null,
      invoiceCity: null,
      hmsContactName: null,
      hmsContactPhone: null,
      hmsContactEmail: null,
      logoUrl: null,
      notes: null,
      updatedAt: now,
    })
    .eq("id", tenantId);

  // Delete all child data via cascade by removing UserTenant memberships
  // and then the actual data tables. Since ON DELETE CASCADE is on Tenant FK,
  // we delete data tables directly to be explicit:
  const tablesToPurge = [
    "Notification",
    "AuditLog",
    "Attachment",
    "ExposureRegister",
    "Chemical",
    "KpiMeasurement",
    "Goal",
    "AuditFinding",
    "Audit",
    "Training",
    "CourseTemplate",
    "SjaHazard",
    "RamsBriefing",
    "SjaAnalysis",
    "SjaTemplate",
    "SjaTemplateHazard",
    "IncidentSubcategoryOption",
    "RuhReport",
    "Incident",
    "EnvironmentalMeasurement",
    "EnvironmentalAspect",
    "Measure",
    "CustomerFeedback",
    "SecurityEvidence",
    "SecurityControl",
    "SecurityAsset",
    "AccessReviewEntry",
    "AccessReview",
    "RiskControl",
    "RiskDocumentLink",
    "RiskAuditLink",
    "RiskChemicalLink",
    "RiskTrainingRequirement",
    "Risk",
    "RiskAssessment",
    "LegalReference",
    "RoutineUploadedDocument",
    "ElectroComplianceDeclaration",
    "OrgChartNode",
    "DocumentSignature",
    "DocumentVersion",
    "DocumentTemplate",
    "Document",
    "Inspection",
    "FireDrill",
    "ManagementReview",
    "HmsTavleSection",
    "HmsTavleExternalLink",
    "TavleCheckin",
    "TavleGuestSubmission",
    "SubcontractorSubmission",
    "SubcontractorPortal",
    "HmsTavle",
    "HmsTavleSubscription",
    "Project",
    "Invoice",
    "Subscription",
    "TenantModule",
    "TenantSequence",
    "TenantActivity",
    "TenantOffer",
    "HmsAnnualPlanCompletion",
    "TenantHmsScore",
    "TenantIntelligenceScore",
    "GeneratedDocument",
    "UserTenant",
  ];

  for (const table of tablesToPurge) {
    await db.from(table).delete().eq("tenantId", tenantId);
  }

  return {
    tenantId,
    tenantName: tenant.name as string,
    filesDeleted,
    fileErrors,
    usersRemoved,
  };
}
