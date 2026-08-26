"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/server-authorization";
import { requireTenantModule } from "@/lib/require-tenant-module";
import { loadSjaById } from "@/server/queries/sja.queries";
import { insertRamsBriefing } from "@/server/queries/rams-briefing.queries";
import { buildRamsBriefingSnapshot, parseAttendeeNames } from "@/features/rams-briefing/lib/rams-briefing-snapshot";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function recordRamsBriefing(input: {
  sjaAnalysisId: string;
  attendees: string;
  notes?: string;
}) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false as const, error: "Not authenticated" };
    }
    if (!auth.permissions.canReadSja && !auth.permissions.canCreateSja) {
      return { success: false as const, error: "You cannot record a RAMS briefing" };
    }
    await requireTenantModule("sja");

    const names = parseAttendeeNames(input.attendees);
    if (names.length === 0) {
      return { success: false as const, error: "Add at least one person who received the briefing" };
    }

    const analysis = await loadSjaById(input.sjaAnalysisId, auth.tenantId);
    if (!analysis) {
      return { success: false as const, error: "RAMS not found" };
    }
    if (analysis.status !== "ACTIVE") {
      return { success: false as const, error: "Pre-start briefing is only for an active RAMS" };
    }

    await insertRamsBriefing({
      tenantId: auth.tenantId,
      sjaAnalysisId: analysis.id,
      briefedByName: auth.userEmail,
      workLocation: analysis.workLocation,
      methodSummary: analysis.description,
      hazardsSnapshot: buildRamsBriefingSnapshot(analysis.hazards),
      notes: input.notes?.trim() || null,
      attendees: names,
    });

    revalidatePath(`/dashboard/sja/${analysis.id}`);
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not save the pre-start briefing") };
  }
}
