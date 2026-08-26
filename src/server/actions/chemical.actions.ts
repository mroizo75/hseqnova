"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getStorage } from "@/lib/storage";
import { AuditLog } from "@/lib/audit-log";
import {
  searchSubstanceByCAS,
  calculateHazardLevel,
  isCMRSubstance,
  calculateSubstitutionPriority,
  suggestAlternatives,
} from "@/lib/echa-api";
import { parseSDSFile, mapPictogramsToFiles, suggestPPE } from "@/lib/sds-parser";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { isChemicalReviewDueSoon, isChemicalReviewOverdue } from "@/features/chemicals/lib/chemical-review";
import {
  deleteChemicalRecord,
  insertChemical,
  loadChemicalById,
  loadChemicalsForTenant,
  toIso,
  updateChemicalRecord,
} from "@/server/queries/chemicals.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return [value];
    }
  }
  return [];
}

export async function getChemicals(_tenantId: string) {
  try {
    await requireTenantModule("chemicals");
    const { tenantId } = await getRequiredTenantContext();
    const chemicals = await loadChemicalsForTenant(tenantId);
    return { success: true, data: chemicals };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the COSHH register") };
  }
}

export async function getChemical(chemicalId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const chemical = await loadChemicalById(chemicalId, tenantId);
    if (!chemical) {
      return { success: false, error: "Chemical not found" };
    }
    return { success: true, data: chemical };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the chemical") };
  }
}

export async function createChemical(input: unknown) {
  try {
    await requireTenantModule("chemicals");
    const { userId, tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const productName = typeof raw.productName === "string" ? raw.productName.trim() : "";
    if (!productName) {
      return { success: false, error: "Product name is required" };
    }

    const nextReviewDate = raw.nextReviewDate
      ? new Date(String(raw.nextReviewDate))
      : new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);

    let echaData: Awaited<ReturnType<typeof searchSubstanceByCAS>> = null;
    let hazardLevel: number | null = null;
    let isCMR = raw.isCMR === true;
    let substitutionPriority: string | null = null;

    if (typeof raw.casNumber === "string" && raw.casNumber.trim()) {
      echaData = await searchSubstanceByCAS(raw.casNumber.trim());
      const hStatements = asStringArray(raw.hazardStatements);
      hazardLevel = calculateHazardLevel(hStatements);
      isCMR = raw.isCMR === true ? true : isCMRSubstance(hStatements);
      substitutionPriority = calculateSubstitutionPriority(isCMR, echaData?.isSVHC || false, hazardLevel);
    }

    const chemical = await insertChemical({
      tenantId,
      productName,
      supplier: typeof raw.supplier === "string" ? raw.supplier.trim() || null : null,
      casNumber: typeof raw.casNumber === "string" ? raw.casNumber.trim() || null : null,
      hazardClass: typeof raw.hazardClass === "string" ? raw.hazardClass.trim() || null : null,
      hazardStatements: typeof raw.hazardStatements === "string" ? raw.hazardStatements : null,
      precautionaryStatements:
        typeof raw.precautionaryStatements === "string" ? raw.precautionaryStatements : null,
      warningPictograms: typeof raw.warningPictograms === "string" ? raw.warningPictograms : null,
      requiredPPE: typeof raw.requiredPPE === "string" ? raw.requiredPPE : null,
      containsIsocyanates: raw.containsIsocyanates === true,
      sdsKey: typeof raw.sdsKey === "string" ? raw.sdsKey.trim() || null : null,
      sdsVersion: typeof raw.sdsVersion === "string" ? raw.sdsVersion.trim() || null : null,
      sdsDate: raw.sdsDate ? toIso(String(raw.sdsDate)) : null,
      nextReviewDate: toIso(nextReviewDate),
      location: typeof raw.location === "string" ? raw.location.trim() || null : null,
      quantity: raw.quantity ? Number(raw.quantity) : null,
      unit: typeof raw.unit === "string" ? raw.unit.trim() || null : null,
      status: typeof raw.status === "string" ? raw.status : "ACTIVE",
      notes: typeof raw.notes === "string" ? raw.notes.trim() || null : null,
      ecNumber: echaData?.ecNumber ?? null,
      isCMR,
      isSVHC: raw.isSVHC === true ? true : Boolean(echaData?.isSVHC),
      reachStatus: echaData?.reachStatus ?? null,
      hazardLevel,
      substitutionPriority,
      lastEchaSync: echaData ? nowIsoSafe() : null,
    });

    await AuditLog.log(tenantId, userId, "CHEMICAL_CREATED", "Chemical", chemical.id, {
      productName: chemical.productName,
      isCMR,
      hazardLevel,
    });

    revalidatePath("/dashboard/chemicals");
    return { success: true, data: chemical };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not create the COSHH record") };
  }
}

function nowIsoSafe(): string {
  return new Date().toISOString();
}

export async function updateChemical(chemicalId: string, input: unknown) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const raw = (input ?? {}) as Record<string, unknown>;
    const existingChemical = await loadChemicalById(chemicalId, tenantId);
    if (!existingChemical) {
      return { success: false, error: "Chemical not found" };
    }

    if (typeof raw.sdsKey === "string" && existingChemical.sdsKey && raw.sdsKey !== existingChemical.sdsKey) {
      try {
        await getStorage().delete(existingChemical.sdsKey);
      } catch {
        // Keep the record even if the old SDS file cannot be removed.
      }
    }

    const patch: Record<string, unknown> = {
      productName: raw.productName,
      supplier: raw.supplier,
      casNumber: raw.casNumber,
      hazardClass: raw.hazardClass,
      hazardStatements: raw.hazardStatements,
      precautionaryStatements: raw.precautionaryStatements,
      warningPictograms: raw.warningPictograms,
      requiredPPE: raw.requiredPPE,
      containsIsocyanates: raw.containsIsocyanates ?? false,
      isCMR: raw.isCMR ?? false,
      isSVHC: raw.isSVHC ?? false,
      sdsVersion: raw.sdsVersion,
      sdsDate: raw.sdsDate ? new Date(String(raw.sdsDate)) : null,
      nextReviewDate: raw.nextReviewDate ? new Date(String(raw.nextReviewDate)) : null,
      location: raw.location,
      quantity: raw.quantity ? Number(raw.quantity) : null,
      unit: raw.unit,
      status: raw.status,
      notes: raw.notes,
    };
    if (typeof raw.sdsKey === "string" && raw.sdsKey) {
      patch.sdsKey = raw.sdsKey;
    }

    const chemical = await updateChemicalRecord(chemicalId, tenantId, patch);
    await AuditLog.log(tenantId, userId, "CHEMICAL_UPDATED", "Chemical", chemical.id, {
      productName: chemical.productName,
    });

    revalidatePath("/dashboard/chemicals");
    revalidatePath(`/dashboard/chemicals/${chemical.id}`);
    return { success: true, data: chemical };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update the COSHH record") };
  }
}

export async function deleteChemical(chemicalId: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const chemical = await loadChemicalById(chemicalId, tenantId);
    if (!chemical) {
      return { success: false, error: "Chemical not found" };
    }

    if (chemical.sdsKey) {
      try {
        await getStorage().delete(chemical.sdsKey);
      } catch {
        // Continue so the register record can still be removed.
      }
    }

    await deleteChemicalRecord(chemicalId, tenantId);
    await AuditLog.log(tenantId, userId, "CHEMICAL_DELETED", "Chemical", chemicalId, {
      productName: chemical.productName,
    });

    revalidatePath("/dashboard/chemicals");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete the COSHH record") };
  }
}

export async function downloadSDS(chemicalId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const chemical = await loadChemicalById(chemicalId, tenantId);
    if (!chemical || !chemical.sdsKey) {
      return { success: false, error: "Safety data sheet not found" };
    }
    const url = await getStorage().getUrl(chemical.sdsKey);
    return { success: true, data: { url } };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not download the safety data sheet") };
  }
}

export async function verifyChemical(chemicalId: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const chemical = await loadChemicalById(chemicalId, tenantId);
    if (!chemical) {
      return { success: false, error: "Chemical not found" };
    }

    await updateChemicalRecord(chemicalId, tenantId, {
      lastVerifiedAt: new Date(),
      lastVerifiedBy: userId,
    });

    await AuditLog.log(tenantId, userId, "CHEMICAL_VERIFIED", "Chemical", chemicalId, {
      productName: chemical.productName,
    });

    revalidatePath("/dashboard/chemicals");
    revalidatePath(`/dashboard/chemicals/${chemical.id}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not verify the chemical") };
  }
}

export async function getChemicalStats(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const chemicals = await loadChemicalsForTenant(tenantId);
    const now = new Date();
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);

    return {
      success: true,
      data: {
        total: chemicals.length,
        active: chemicals.filter((row) => row.status === "ACTIVE").length,
        phasedOut: chemicals.filter((row) => row.status === "PHASED_OUT").length,
        archived: chemicals.filter((row) => row.status === "ARCHIVED").length,
        missingSDS: chemicals.filter((row) => !row.sdsKey).length,
        needsReview: chemicals.filter((row) => isChemicalReviewDueSoon(row.nextReviewDate)).length,
        overdue: chemicals.filter((row) => isChemicalReviewOverdue(row.nextReviewDate, now)).length,
        cmrSubstances: chemicals.filter((row) => row.isCMR).length,
        svhcSubstances: chemicals.filter((row) => row.isSVHC).length,
        highSubstitutionPriority: chemicals.filter((row) => row.substitutionPriority === "HIGH").length,
        outdatedSDS: chemicals.filter((row) => row.sdsDate && new Date(row.sdsDate) < threeYearsAgo).length,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load COSHH statistics") };
  }
}

export async function parseSDSFromFile(sdsKey: string, chemicalId?: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const fileUrl = await getStorage().getUrl(sdsKey);
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return { success: false, error: "Could not download the file" };
    }

    const extractedData = await parseSDSFile(Buffer.from(await response.arrayBuffer()));

    if (chemicalId && extractedData.confidence && extractedData.confidence > 0.7) {
      const patch: Record<string, unknown> = { aiExtractedData: JSON.stringify(extractedData) };
      if (extractedData.hazardStatements) {
        patch.hazardStatements = JSON.stringify(extractedData.hazardStatements);
        patch.hazardLevel = calculateHazardLevel(extractedData.hazardStatements);
        patch.isCMR = isCMRSubstance(extractedData.hazardStatements);
        patch.requiredPPE = JSON.stringify(suggestPPE(extractedData.hazardStatements));
      }
      if (extractedData.precautionaryStatements) {
        patch.precautionaryStatements = JSON.stringify(extractedData.precautionaryStatements);
      }
      if (extractedData.pictograms) {
        patch.warningPictograms = JSON.stringify(mapPictogramsToFiles(extractedData.pictograms));
      }
      if (extractedData.casNumbers && extractedData.casNumbers.length > 0) {
        patch.casNumber = extractedData.casNumbers[0];
      }
      await updateChemicalRecord(chemicalId, tenantId, patch);
      await AuditLog.log(tenantId, userId, "CHEMICAL_AI_PARSED", "Chemical", chemicalId, {
        confidence: extractedData.confidence,
        extractedFields: Object.keys(patch),
      });
      revalidatePath(`/dashboard/chemicals/${chemicalId}`);
    }

    return { success: true, data: extractedData };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not parse the safety data sheet") };
  }
}

export async function syncWithECHA(chemicalId: string) {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const chemical = await loadChemicalById(chemicalId, tenantId);
    if (!chemical) {
      return { success: false, error: "Chemical not found" };
    }
    if (!chemical.casNumber) {
      return { success: false, error: "CAS number is missing" };
    }

    const echaData = await searchSubstanceByCAS(chemical.casNumber);
    if (!echaData) {
      return { success: false, error: "No data found in ECHA" };
    }

    let hStatements: string[] = [];
    try {
      hStatements = chemical.hazardStatements ? (JSON.parse(chemical.hazardStatements) as string[]) : [];
    } catch {
      hStatements = chemical.hazardStatements ? [chemical.hazardStatements] : [];
    }

    const hazardLevel = calculateHazardLevel(hStatements);
    const isCMR = isCMRSubstance(hStatements);
    const substitutionPriority = calculateSubstitutionPriority(isCMR, echaData.isSVHC, hazardLevel);

    const updatedChemical = await updateChemicalRecord(chemicalId, tenantId, {
      ecNumber: echaData.ecNumber,
      isCMR,
      isSVHC: echaData.isSVHC,
      reachStatus: echaData.reachStatus,
      hazardLevel,
      substitutionPriority,
      lastEchaSync: new Date(),
    });

    await AuditLog.log(tenantId, userId, "CHEMICAL_ECHA_SYNCED", "Chemical", chemicalId, {
      echaData: { isCMR, isSVHC: echaData.isSVHC, hazardLevel },
    });

    revalidatePath(`/dashboard/chemicals/${chemicalId}`);
    revalidatePath("/dashboard/chemicals");
    return { success: true, data: updatedChemical };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not sync with ECHA") };
  }
}

export async function findSubstitutionAlternatives(chemicalId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const chemical = await loadChemicalById(chemicalId, tenantId);
    if (!chemical) {
      return { success: false, error: "Chemical not found" };
    }
    if (!chemical.casNumber) {
      return { success: false, error: "CAS number is missing" };
    }

    const alternatives = await suggestAlternatives(
      chemical.casNumber,
      chemical.productName,
      chemical.hazardClass || undefined,
    );

    if (alternatives.length > 0) {
      await updateChemicalRecord(chemicalId, tenantId, {
        autoSuggestedAlternatives: JSON.stringify(alternatives),
      });
      revalidatePath(`/dashboard/chemicals/${chemicalId}`);
    }

    return { success: true, data: alternatives };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not find alternatives") };
  }
}

export async function batchSyncWithECHA(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const chemicals = (await loadChemicalsForTenant(tenantId, { status: "ACTIVE" })).filter(
      (row) => row.casNumber,
    );

    let synced = 0;
    let failed = 0;
    for (const chemical of chemicals) {
      const result = await syncWithECHA(chemical.id);
      if (result.success) synced += 1;
      else failed += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return { success: true, data: { total: chemicals.length, synced, failed } };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not sync") };
  }
}
