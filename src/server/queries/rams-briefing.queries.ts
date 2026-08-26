import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { RamsHazardSnapshot } from "@/features/rams-briefing/lib/rams-briefing-snapshot";

export type RamsBriefingRecord = {
  id: string;
  tenantId: string;
  sjaAnalysisId: string;
  briefedAt: Date;
  briefedByName: string;
  workLocation: string;
  methodSummary: string | null;
  hazardsSnapshot: RamsHazardSnapshot[];
  notes: string | null;
  attendees: string[];
};

function asBriefing(row: Record<string, unknown>): RamsBriefingRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenantId),
    sjaAnalysisId: String(row.sjaAnalysisId),
    briefedAt: new Date(String(row.briefedAt)),
    briefedByName: String(row.briefedByName),
    workLocation: String(row.workLocation),
    methodSummary: (row.methodSummary as string | null) ?? null,
    hazardsSnapshot: Array.isArray(row.hazardsSnapshot) ? (row.hazardsSnapshot as RamsHazardSnapshot[]) : [],
    notes: (row.notes as string | null) ?? null,
    attendees: Array.isArray(row.attendees) ? (row.attendees as string[]) : [],
  };
}

export async function loadRamsBriefings(sjaAnalysisId: string, tenantId: string): Promise<RamsBriefingRecord[]> {
  const { data, error } = await getAdminDb()
    .from("RamsBriefing")
    .select("*")
    .eq("sjaAnalysisId", sjaAnalysisId)
    .eq("tenantId", tenantId)
    .order("briefedAt", { ascending: false });
  if (error) {
    throw { code: "RAMS_BRIEFING_LIST_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => asBriefing(row as Record<string, unknown>));
}

export async function insertRamsBriefing(input: {
  tenantId: string;
  sjaAnalysisId: string;
  briefedByName: string;
  workLocation: string;
  methodSummary: string | null;
  hazardsSnapshot: RamsHazardSnapshot[];
  notes: string | null;
  attendees: string[];
}): Promise<RamsBriefingRecord> {
  const now = new Date().toISOString();
  const { data, error } = await getAdminDb()
    .from("RamsBriefing")
    .insert({
      id: createId(),
      tenantId: input.tenantId,
      sjaAnalysisId: input.sjaAnalysisId,
      briefedAt: now,
      briefedByName: input.briefedByName,
      workLocation: input.workLocation,
      methodSummary: input.methodSummary,
      hazardsSnapshot: input.hazardsSnapshot,
      notes: input.notes,
      attendees: input.attendees,
      createdAt: now,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw { code: "RAMS_BRIEFING_CREATE_FAILED", message: error?.message || "Could not save the briefing" };
  }
  return asBriefing(data as Record<string, unknown>);
}
