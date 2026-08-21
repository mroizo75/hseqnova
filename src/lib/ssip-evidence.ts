import { prisma } from "@/lib/db";
import { requireTenantModule } from "@/lib/require-tenant-module";

export interface SsipEvidencePack {
  companyName: string;
  companyNumber: string | null;
  generatedAt: string;
  policySigned: boolean;
  accidentBookCount: number;
  riddorOpenCount: number;
  riskAssessmentCount: number;
  trainingCount: number;
  inspectionCount: number;
}

export async function buildSsipEvidencePack(tenantId: string): Promise<SsipEvidencePack> {
  await requireTenantModule("constructionCompliance");
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, companyNumber: true, orgNumber: true },
  });
  if (!tenant) {
    throw { code: "TENANT_NOT_FOUND", message: "Company not found" };
  }

  const [accidents, riddorOpen, risks, trainings, inspections, handbook] = await Promise.all([
    prisma.incident.count({ where: { tenantId, accidentBookEntry: true } }),
    prisma.incident.count({ where: { tenantId, riddorReportable: true, riddorReportedAt: null } }),
    prisma.risk.count({ where: { tenantId } }),
    prisma.training.count({ where: { tenantId } }),
    prisma.inspection.count({ where: { tenantId } }),
    prisma.hmsHandbook.findUnique({ where: { tenantId }, select: { id: true } }),
  ]);

  return {
    companyName: tenant.name,
    companyNumber: tenant.companyNumber ?? tenant.orgNumber,
    generatedAt: new Date().toISOString(),
    policySigned: Boolean(handbook),
    accidentBookCount: accidents,
    riddorOpenCount: riddorOpen,
    riskAssessmentCount: risks,
    trainingCount: trainings,
    inspectionCount: inspections,
  };
}
