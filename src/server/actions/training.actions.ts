"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAuthMembership } from "@/lib/auth-db";
import {
  createTrainingSchema,
  updateTrainingSchema,
  evaluateTrainingSchema,
} from "@/features/training/schemas/training.schema";
import { hasTenantFeature } from "@/lib/tenant-features";
import { runHealthcareTrainingExpiryAlerts } from "@/lib/healthcare-training-alerts";
import {
  deleteTrainingRecord,
  findDuplicateTraining,
  insertTraining,
  insertTrainings,
  loadTenantIndustry,
  loadTrainingById,
  loadTrainingPeople,
  loadTrainingsForTenant,
  logTrainingAction,
  updateTrainingRecord,
} from "@/server/queries/training.queries";

const REVALIDATE_PATH = "/dashboard/training";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function getTrainings(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const trainings = await loadTrainingsForTenant(tenantId, { orderBy: "completedAt" });
    return { success: true, data: trainings };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load training") };
  }
}

export async function getUserTrainings(userId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const trainings = await loadTrainingsForTenant(tenantId, { userId, orderBy: "completedAt" });
    return { success: true, data: trainings };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load training") };
  }
}

export async function createTraining(input: Record<string, unknown>) {
  try {
    const { userId: actorId, tenantId } = await getRequiredTenantContext();
    const validated = createTrainingSchema.parse({
      ...input,
      tenantId,
      completedAt: input.completedAt ? new Date(String(input.completedAt)) : undefined,
      validUntil: input.validUntil ? new Date(String(input.validUntil)) : undefined,
    });

    const duplicate = await findDuplicateTraining({
      tenantId,
      userId: validated.userId,
      courseKey: validated.courseKey,
      completedAt: validated.completedAt ?? null,
    });
    if (duplicate) {
      return {
        success: false,
        error: `This employee already has “${validated.title}” recorded on the same completion date.`,
      };
    }

    const training = await insertTraining({
      tenantId,
      userId: validated.userId,
      courseKey: validated.courseKey,
      title: validated.title,
      provider: validated.provider,
      completedAt: validated.completedAt,
      validUntil: validated.validUntil,
      proofDocKey: validated.proofDocKey,
      isRequired: validated.isRequired,
    });

    await logTrainingAction({
      tenantId,
      userId: actorId,
      action: "TRAINING_CREATED",
      resource: `Training:${training.id}`,
      metadata: {
        title: training.title,
        userId: training.userId,
        courseKey: training.courseKey,
      },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: training };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record training") };
  }
}

export async function updateTraining(input: Record<string, unknown>) {
  try {
    const { userId: actorId, tenantId } = await getRequiredTenantContext();
    const validated = updateTrainingSchema.parse({
      ...input,
      completedAt: input.completedAt ? new Date(String(input.completedAt)) : undefined,
      validUntil: input.validUntil ? new Date(String(input.validUntil)) : undefined,
    });

    const existing = await loadTrainingById({ id: validated.id, tenantId });
    if (!existing) {
      return { success: false, error: "Training not found" };
    }

    const training = await updateTrainingRecord(validated.id, tenantId, {
      ...(validated.title !== undefined && { title: validated.title }),
      ...(validated.provider !== undefined && { provider: validated.provider }),
      ...(validated.completedAt !== undefined && { completedAt: validated.completedAt }),
      ...(validated.validUntil !== undefined && { validUntil: validated.validUntil }),
      ...(validated.proofDocKey !== undefined && { proofDocKey: validated.proofDocKey }),
      ...(validated.effectiveness !== undefined && { effectiveness: validated.effectiveness }),
    });

    await logTrainingAction({
      tenantId,
      userId: actorId,
      action: "TRAINING_UPDATED",
      resource: `Training:${training.id}`,
      metadata: { title: training.title },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: training };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not update training") };
  }
}

export async function evaluateTraining(input: Record<string, unknown>) {
  try {
    const { userId: actorId, tenantId } = await getRequiredTenantContext();
    const validated = evaluateTrainingSchema.parse(input);

    const existing = await loadTrainingById({ id: validated.id, tenantId });
    if (!existing) {
      return { success: false, error: "Training not found" };
    }

    const training = await updateTrainingRecord(validated.id, tenantId, {
      effectiveness: validated.effectiveness,
      evaluatedBy: validated.evaluatedBy,
      evaluatedAt: new Date(),
    });

    await logTrainingAction({
      tenantId,
      userId: actorId,
      action: "TRAINING_EVALUATED",
      resource: `Training:${training.id}`,
      metadata: { title: training.title, effectiveness: validated.effectiveness },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: training };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not evaluate training") };
  }
}


export async function deleteTraining(id: string) {
  try {
    const { userId: actorId, tenantId } = await getRequiredTenantContext();
    const training = await loadTrainingById({ id, tenantId });
    if (!training) {
      return { success: false, error: "Training not found" };
    }

    if (training.proofDocKey) {
      const storage = await import("@/lib/storage").then((mod) => mod.getStorage());
      await storage.delete(training.proofDocKey);
    }

    await deleteTrainingRecord(id, tenantId);
    await logTrainingAction({
      tenantId,
      userId: actorId,
      action: "TRAINING_DELETED",
      resource: `Training:${id}`,
      metadata: { title: training.title },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not delete training") };
  }
}

export async function getTrainingStats(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const trainings = await loadTrainingsForTenant(tenantId);
    const now = new Date();
    const expiringSoon = trainings.filter((row) => {
      if (!row.validUntil) return false;
      const days = Math.ceil(
        (new Date(row.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return days > 0 && days <= 30;
    }).length;
    const expired = trainings.filter((row) => {
      if (!row.validUntil) return false;
      return new Date(row.validUntil) < now;
    }).length;

    return {
      success: true,
      data: {
        total: trainings.length,
        completed: trainings.filter((row) => row.completedAt).length,
        notStarted: trainings.filter((row) => !row.completedAt).length,
        expiringSoon,
        expired,
        evaluated: trainings.filter((row) => row.effectiveness).length,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load statistics") };
  }
}

export async function createEmployeeTrainings(input: {
  tenantId: string;
  userId: string;
  courses: Array<{
    courseKey: string;
    title: string;
    provider: string;
    completedAt?: string;
    validUntil?: string;
    proofDocKey?: string;
    isRequired?: boolean;
  }>;
}) {
  try {
    const { userId: actorId, tenantId } = await getRequiredTenantContext();
    if (!input.courses || input.courses.length === 0) {
      return { success: false, error: "No courses added" };
    }

    const created = await insertTrainings(
      input.courses.map((course) => ({
        tenantId,
        userId: input.userId,
        courseKey: course.courseKey,
        title: course.title,
        provider: course.provider,
        completedAt: course.completedAt,
        validUntil: course.validUntil,
        proofDocKey: course.proofDocKey,
        isRequired: course.isRequired,
      })),
    );

    await logTrainingAction({
      tenantId,
      userId: actorId,
      action: "TRAINING_EMPLOYEE_BULK_CREATED",
      resource: `Training:employee:${input.userId}`,
      metadata: {
        userId: input.userId,
        count: created.length,
        courses: input.courses.map((course) => course.title),
      },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: created };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record the courses") };
  }
}

export async function createBulkTrainings(input: {
  tenantId: string;
  courseKey: string;
  title: string;
  provider: string;
  completedAt?: string;
  validUntil?: string;
  isRequired: boolean;
  participants: Array<{ userId: string; proofDocKey?: string }>;
}) {
  try {
    const { userId: actorId, tenantId } = await getRequiredTenantContext();
    if (!input.participants || input.participants.length === 0) {
      return { success: false, error: "No participants selected" };
    }

    const created = await insertTrainings(
      input.participants.map((participant) => ({
        tenantId,
        userId: participant.userId,
        courseKey: input.courseKey,
        title: input.title,
        provider: input.provider,
        completedAt: input.completedAt,
        validUntil: input.validUntil,
        proofDocKey: participant.proofDocKey,
        isRequired: input.isRequired,
      })),
    );

    await logTrainingAction({
      tenantId,
      userId: actorId,
      action: "TRAINING_BULK_CREATED",
      resource: "Training:bulk",
      metadata: {
        title: input.title,
        courseKey: input.courseKey,
        count: created.length,
        userIds: input.participants.map((participant) => participant.userId),
      },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: created };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not record the training records") };
  }
}

export async function getCompetenceMatrix(_tenantId: string) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const [users, trainings] = await Promise.all([
      loadTrainingPeople(tenantId),
      loadTrainingsForTenant(tenantId, { orderBy: "courseKey" }),
    ]);
    return {
      success: true,
      data: users.map((user) => ({
        user,
        trainings: trainings.filter((row) => row.userId === user.id),
      })),
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load competence matrix") };
  }
}

export async function sendHealthcareTrainingExpiryAlerts() {
  try {
    const { userId, tenantId } = await getRequiredTenantContext();
    const membership = await getAuthMembership(userId, tenantId);
    const isAllowedRole =
      membership?.role === "ADMIN" || membership?.role === "HMS" || membership?.role === "LEDER";
    if (!isAllowedRole) {
      return { success: false, error: "You do not have permission to send alerts" };
    }

    const industry = await loadTenantIndustry(tenantId);
    if (!hasTenantFeature(industry, "helseforetak")) {
      return { success: false, error: "This alert flow is only available for healthcare" };
    }

    const result = await runHealthcareTrainingExpiryAlerts({ tenantId });
    return { success: true, data: { sent: result.totalSent } };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not send competence alerts") };
  }
}
