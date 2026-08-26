"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import {
  createFireDrillSchema,
  completeFireDrillSchema,
  evaluateFireDrillSchema,
  updateFireDrillSchema,
  type CreateFireDrillInput,
  type CompleteFireDrillInput,
  type EvaluateFireDrillInput,
  type UpdateFireDrillInput,
} from "@/features/fire-drills/schemas/fire-drill.schema";
import {
  assertFireDrillOwnership,
  deleteFireDrillRecord,
  fireDrillDbPatchFromUpdate,
  insertFireDrill,
  loadFireDrillById,
  loadFireDrillsForList,
  updateFireDrillRecord,
} from "@/server/queries/fire-drills.queries";

const REVALIDATE_PATH = "/dashboard/fire-drills";

export async function createFireDrill(input: CreateFireDrillInput) {
  const { tenantId } = await getRequiredTenantContext();

  const validated = createFireDrillSchema.parse(input);

  const drill = await insertFireDrill({
    tenantId,
    title: validated.title,
    drillType: validated.drillType,
    isAnnounced: validated.isAnnounced,
    plannedDate: validated.plannedDate,
    location: validated.location,
    responsibleId: validated.responsibleId,
    objectives: validated.objectives,
    scenario: validated.scenario ?? null,
    riskAssessment: validated.riskAssessment ?? null,
    participantIds: validated.participantIds ?? null,
    sharedPremises: validated.sharedPremises,
    buildingOwnerCoordinated: validated.buildingOwnerCoordinated ?? null,
    buildingOwnerName: validated.buildingOwnerName ?? null,
    otherTenantsInformed: validated.otherTenantsInformed ?? null,
    fullBuildingEvacuation: validated.fullBuildingEvacuation ?? null,
    totalBuildingOccupants: validated.totalBuildingOccupants ?? null,
  });

  revalidatePath(REVALIDATE_PATH);
  return drill;
}

export async function updateFireDrill(id: string, input: UpdateFireDrillInput) {
  const { tenantId } = await getRequiredTenantContext();

  await assertFireDrillOwnership(id, tenantId);

  const validated = updateFireDrillSchema.parse(input);
  const drill = await updateFireDrillRecord(id, tenantId, fireDrillDbPatchFromUpdate(validated));

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  return drill;
}

export async function completeFireDrill(id: string, input: CompleteFireDrillInput) {
  const { tenantId } = await getRequiredTenantContext();

  await assertFireDrillOwnership(id, tenantId);

  const validated = completeFireDrillSchema.parse(input);

  const drill = await updateFireDrillRecord(id, tenantId, {
    status: "COMPLETED",
    completedAt: validated.completedAt,
    actualParticipantCount: validated.actualParticipantCount,
    evacuationTimeSeconds: validated.evacuationTimeSeconds ?? null,
    observations: validated.observations,
  });

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  return drill;
}

export async function evaluateFireDrill(id: string, input: EvaluateFireDrillInput, evaluatedByUserId: string) {
  const { tenantId } = await getRequiredTenantContext();

  await assertFireDrillOwnership(id, tenantId);

  const validated = evaluateFireDrillSchema.parse(input);

  const drill = await updateFireDrillRecord(id, tenantId, {
    status: "EVALUATED",
    objectivesAchieved: validated.objectivesAchieved,
    evaluation: validated.evaluation,
    improvementPoints: validated.improvementPoints,
    procedureChangesNeeded: validated.procedureChangesNeeded,
    procedureChangesDesc: validated.procedureChangesDesc ?? null,
    evaluatedBy: evaluatedByUserId,
    evaluatedAt: new Date(),
  });

  revalidatePath(REVALIDATE_PATH);
  revalidatePath(`${REVALIDATE_PATH}/${id}`);
  return drill;
}

export async function deleteFireDrill(id: string) {
  const { tenantId } = await getRequiredTenantContext();

  await assertFireDrillOwnership(id, tenantId);
  await deleteFireDrillRecord(id, tenantId);

  revalidatePath(REVALIDATE_PATH);
}

export async function getFireDrills() {
  const { tenantId } = await getRequiredTenantContext();
  return loadFireDrillsForList(tenantId);
}

export async function getFireDrillById(id: string) {
  const { tenantId } = await getRequiredTenantContext();
  return loadFireDrillById(tenantId, id);
}
