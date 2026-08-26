/**
 * Diisocyanate scan — UK REACH restriction on diisocyanates
 * (retained EU 2020/1149): training is required for industrial and
 * professional use of substances or mixtures with ≥0.1% diisocyanates.
 */

"use server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAuthMembership } from "@/lib/auth-db";
import { detectIsocyanates } from "@/lib/sds-parser";
import {
  loadChemicalById,
  loadChemicalsForTenant,
  updateChemicalRecord,
} from "@/server/queries/chemicals.queries";

async function requireScanAccess() {
  const { userId, tenantId } = await getRequiredTenantContext();
  const membership = await getAuthMembership(userId, tenantId);
  if (!membership) {
    throw { code: "UNAUTHORISED", message: "Unauthorised" };
  }
  if (membership.role !== "ADMIN" && membership.role !== "HMS") {
    throw {
      code: "FORBIDDEN",
      message: "Only the HSE manager or an administrator can run the diisocyanate scan",
    };
  }
  return { userId, tenantId, role: membership.role };
}

export interface IsocyanateScanResult {
  success: boolean;
  totalScanned: number;
  foundIsocyanates: number;
  updated: number;
  chemicals: Array<{
    id: string;
    productName: string;
    supplier?: string;
    casNumber?: string;
    containsIsocyanates: boolean;
    isocyanateDetails?: string;
    wasUpdated: boolean;
  }>;
}

export async function scanStoffkartotekForIsocyanates(): Promise<IsocyanateScanResult> {
  const { tenantId } = await requireScanAccess();
  const chemicals = await loadChemicalsForTenant(tenantId, { status: "ACTIVE" });

  const results: IsocyanateScanResult["chemicals"] = [];
  let foundCount = 0;
  let updatedCount = 0;

  for (const chemical of chemicals) {
    let searchText = chemical.productName;
    if (chemical.supplier) searchText += ` ${chemical.supplier}`;
    if (chemical.hazardStatements) searchText += ` ${chemical.hazardStatements}`;
    if (chemical.aiExtractedData) searchText += ` ${chemical.aiExtractedData}`;

    const casNumbers = chemical.casNumber ? [chemical.casNumber] : [];
    const detection = detectIsocyanates(chemical.productName, casNumbers, searchText);
    const needsUpdate = detection.containsIsocyanates && !chemical.containsIsocyanates;

    if (detection.containsIsocyanates) {
      foundCount += 1;
    }

    if (needsUpdate) {
      await updateChemicalRecord(chemical.id, tenantId, { containsIsocyanates: true });
      updatedCount += 1;
    }

    results.push({
      id: chemical.id,
      productName: chemical.productName,
      supplier: chemical.supplier || undefined,
      casNumber: chemical.casNumber || undefined,
      containsIsocyanates: detection.containsIsocyanates,
      isocyanateDetails: detection.details,
      wasUpdated: needsUpdate,
    });
  }

  return {
    success: true,
    totalScanned: chemicals.length,
    foundIsocyanates: foundCount,
    updated: updatedCount,
    chemicals: results.filter((row) => row.containsIsocyanates),
  };
}

export async function scanSingleChemicalForIsocyanates(
  chemicalId: string,
): Promise<{
  success: boolean;
  containsIsocyanates: boolean;
  details?: string;
  wasUpdated: boolean;
}> {
  const { tenantId } = await getRequiredTenantContext();
  const chemical = await loadChemicalById(chemicalId, tenantId);

  if (!chemical) {
    throw { code: "NOT_FOUND", message: "Chemical not found" };
  }

  let searchText = chemical.productName;
  if (chemical.supplier) searchText += ` ${chemical.supplier}`;
  if (chemical.hazardStatements) searchText += ` ${chemical.hazardStatements}`;
  if (chemical.aiExtractedData) searchText += ` ${chemical.aiExtractedData}`;

  const casNumbers = chemical.casNumber ? [chemical.casNumber] : [];
  const detection = detectIsocyanates(chemical.productName, casNumbers, searchText);
  const needsUpdate = detection.containsIsocyanates && !chemical.containsIsocyanates;

  if (needsUpdate) {
    await updateChemicalRecord(chemical.id, tenantId, { containsIsocyanates: true });
  }

  return {
    success: true,
    containsIsocyanates: detection.containsIsocyanates,
    details: detection.details,
    wasUpdated: needsUpdate,
  };
}

export async function getIsocyanateStats() {
  const { tenantId } = await getRequiredTenantContext();
  const chemicals = await loadChemicalsForTenant(tenantId, { status: "ACTIVE" });
  const withIsocyanates = chemicals.filter((row) => row.containsIsocyanates);
  const total = chemicals.length;

  return {
    total,
    withIsocyanates: withIsocyanates.length,
    percentage: total > 0 ? Math.round((withIsocyanates.length / total) * 100) : 0,
    chemicals: withIsocyanates
      .map((row) => ({
        id: row.id,
        productName: row.productName,
        supplier: row.supplier,
        casNumber: row.casNumber,
        quantity: row.quantity,
        location: row.location,
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName, "en-GB")),
  };
}
