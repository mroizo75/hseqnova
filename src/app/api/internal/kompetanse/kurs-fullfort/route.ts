import { NextRequest, NextResponse } from "next/server";
import { getAuthMembership } from "@/lib/auth-db";
import { validateInternalRequest } from "@/lib/internal-auth";
import {
  findTrainingByCourseKey,
  insertTraining,
  updateTrainingRecord,
} from "@/server/queries/training.queries";
import { z, ZodError } from "zod";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  hmsNovaUserId: z.string().min(1, "hmsNovaUserId is required"),
  hmsNovaTenantId: z.string().min(1, "hmsNovaTenantId is required"),
  kursNavn: z.string().min(1, "kursNavn is required"),
  kursKey: z.string().min(1, "kursKey is required"),
  fullfortDato: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fullfortDato must be YYYY-MM-DD"),
  bestatt: z.boolean(),
  karakterProsent: z.number().int().min(0).max(100),
  diplomUrl: z.string().url("diplomUrl must be a valid URL"),
});

/**
 * POST /api/internal/kompetanse/kurs-fullfort
 *
 * Receives completion data from Bransjekurs.no and creates or updates
 * a Training record for the employee.
 *
 * Server-to-server only (INTERNAL_API_SECRET).
 */
export async function POST(request: NextRequest) {
  const unauthorized = validateInternalRequest(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  let validated: z.infer<typeof requestSchema>;
  try {
    validated = requestSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    throw error;
  }

  const membership = await getAuthMembership(validated.hmsNovaUserId, validated.hmsNovaTenantId);
  if (!membership) {
    return NextResponse.json(
      {
        code: "USER_NOT_FOUND",
        message: "User is not a member of the given organisation",
      },
      { status: 404 },
    );
  }

  const completedAt = new Date(validated.fullfortDato);
  const description = `Completed via Bransjekurs.no · ${validated.karakterProsent}% · ${validated.bestatt ? "Passed" : "Not passed"}`;

  const existing = await findTrainingByCourseKey({
    tenantId: validated.hmsNovaTenantId,
    userId: validated.hmsNovaUserId,
    courseKey: validated.kursKey,
  });

  if (existing) {
    await updateTrainingRecord(existing.id, validated.hmsNovaTenantId, {
      title: validated.kursNavn,
      completedAt,
      proofDocKey: validated.diplomUrl,
      description,
    });
    return NextResponse.json({ trainingId: existing.id, created: false });
  }

  const training = await insertTraining({
    tenantId: validated.hmsNovaTenantId,
    userId: validated.hmsNovaUserId,
    courseKey: validated.kursKey,
    title: validated.kursNavn,
    provider: "Bransjekurs.no",
    completedAt,
    proofDocKey: validated.diplomUrl,
    isRequired: false,
    description,
  });

  return NextResponse.json({ trainingId: training.id, created: true });
}
