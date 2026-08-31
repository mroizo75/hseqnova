"use server";

import { revalidatePath } from "next/cache";
import { PermitToWorkStatus } from "@prisma/client";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { requireTenantModule } from "@/lib/require-tenant-module";
import {
  parsePermitPayload,
  serializePermitPayload,
  validatePermitCreate,
  validatePermitIssue,
} from "@/lib/permit-uk";
import {
  insertPermitToWork,
  loadPermitById,
  loadPermitsForTenant,
  loadWorkforcePermits,
  updatePermitRecord,
} from "@/server/queries/permit-to-work.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function revalidatePermitPaths(id?: string) {
  revalidatePath("/dashboard/permits");
  revalidatePath("/ansatt/permits");
  if (id) {
    revalidatePath(`/dashboard/permits/${id}`);
    revalidatePath(`/ansatt/permits/${id}`);
  }
}

export async function listPermitsToWork() {
  await requireTenantModule("permitToWork");
  const { tenantId } = await getRequiredTenantContext();
  return loadPermitsForTenant(tenantId);
}

export async function listWorkforcePermits() {
  await requireTenantModule("permitToWork");
  const { tenantId } = await getRequiredTenantContext();
  return loadWorkforcePermits(tenantId);
}

export async function getPermitToWork(id: string) {
  await requireTenantModule("permitToWork");
  const { tenantId } = await getRequiredTenantContext();
  return loadPermitById(id, tenantId);
}

export async function createPermitToWork(input: {
  projectId?: string;
  type: string;
  title: string;
  location?: string;
  validFrom: Date;
  validTo?: Date;
  isolations?: string;
  description?: string;
  hazards?: string;
  controlMeasures?: string;
  isolationsRequired?: string;
  ppeRequired?: string[];
  emergencyArrangements?: string;
}) {
  try {
    await requireTenantModule("permitToWork");
    const { tenantId } = await getRequiredTenantContext();
    const payload = parsePermitPayload(input.isolations);
    payload.description = input.description ?? payload.description;
    payload.hazards = input.hazards ?? payload.hazards;
    payload.controlMeasures = input.controlMeasures ?? payload.controlMeasures;
    payload.isolationsRequired = input.isolationsRequired ?? payload.isolationsRequired;
    payload.ppeRequired = input.ppeRequired ?? payload.ppeRequired;
    payload.emergencyArrangements =
      input.emergencyArrangements ?? payload.emergencyArrangements;

    const validated = validatePermitCreate({
      type: input.type,
      title: input.title,
      location: input.location,
      validFrom: input.validFrom,
      validTo: input.validTo,
      description: payload.description,
      hazards: payload.hazards,
      controlMeasures: payload.controlMeasures,
      emergencyArrangements: payload.emergencyArrangements,
    });
    if (validated.ok === false) {
      return { success: false as const, error: validated.message };
    }

    const permit = await insertPermitToWork({
      tenantId,
      projectId: input.projectId,
      type: input.type,
      title: input.title.trim(),
      location: input.location!.trim(),
      validFrom: new Date(input.validFrom),
      validTo: new Date(input.validTo!),
      isolations: serializePermitPayload(payload),
    });
    revalidatePermitPaths(permit.id);
    return { success: true as const, data: permit };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not create the permit") };
  }
}

export async function updatePermitStatus(input: {
  id: string;
  status: PermitToWorkStatus;
  issuerName?: string;
  acceptorName?: string;
}) {
  try {
    await requireTenantModule("permitToWork");
    const { tenantId } = await getRequiredTenantContext();
    const permit = await loadPermitById(input.id, tenantId);
    if (!permit) {
      return { success: false as const, error: "Permit not found" };
    }

    if (input.status === "ISSUED") {
      const payload = parsePermitPayload(permit.isolations);
      const validated = validatePermitIssue({
        type: permit.type,
        validTo: permit.validTo,
        location: permit.location,
        payload,
        issuerName: input.issuerName,
        acceptorName: input.acceptorName,
      });
      if (validated.ok === false) {
        return { success: false as const, error: validated.message };
      }
      payload.issuerName = input.issuerName!.trim();
      payload.acceptorName = input.acceptorName!.trim();
      payload.issuedAt = new Date().toISOString();
      const updated = await updatePermitRecord(input.id, tenantId, {
        status: "ISSUED",
        isolations: serializePermitPayload(payload),
      });
      revalidatePermitPaths(updated.id);
      return { success: true as const, data: updated };
    }

    const updated = await updatePermitRecord(input.id, tenantId, { status: input.status });
    revalidatePermitPaths(updated.id);
    return { success: true as const, data: updated };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not update the permit") };
  }
}
