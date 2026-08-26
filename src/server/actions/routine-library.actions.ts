"use server";

import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getGlobalRoutineTemplateLibrary,
  type RoutineTemplateLibraryEntry,
} from "@/lib/routine-template-library";
import { parseIndustryScope, toIndustryScopeJson } from "@/lib/industry-scope";

const SYSTEM_LIBRARY_CREATED_BY = "SYSTEM_ROUTINE_LIBRARY";
const INDUSTRY_KEYS = [
  "all",
  "construction",
  "healthcare",
  "transport",
  "manufacturing",
  "retail",
  "hospitality",
  "education",
  "technology",
  "agriculture",
  "other",
] as const;

type IndustryKey = (typeof INDUSTRY_KEYS)[number];

async function requirePrivilegedAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return false;
  }

  const { data: user } = await getAdminDb()
    .from("User")
    .select("isSuperAdmin, isSupport")
    .eq("email", session.user.email)
    .maybeSingle();

  return !!user && (user.isSuperAdmin || user.isSupport);
}

function mapLibraryEntryToPersistence(entry: RoutineTemplateLibraryEntry) {
  return {
    title: entry.title,
    description: entry.description,
    category: entry.category,
    content: entry.content,
    legalReference: entry.legalReference,
    isGlobal: true,
    isActive: true,
    industryScope: toIndustryScopeJson(entry.industryScope),
    createdBy: SYSTEM_LIBRARY_CREATED_BY,
  };
}

export async function seedGlobalRoutineTemplateLibrary() {
  const library = getGlobalRoutineTemplateLibrary();
  const db = getAdminDb();
  let created = 0;
  let updated = 0;

  for (const entry of library) {
    const mapped = mapLibraryEntryToPersistence(entry);
    const { data: existing } = await db
      .from("RoutineTemplate")
      .select("id, description, category, content, legalReference, isGlobal, isActive, industryScope, createdBy")
      .is("tenantId", null)
      .eq("isGlobal", true)
      .eq("title", entry.title)
      .maybeSingle();

    if (!existing) {
      const now = new Date().toISOString();
      await db.from("RoutineTemplate").insert({
        id: createId(),
        tenantId: null,
        ...mapped,
        createdAt: now,
        updatedAt: now,
      });
      created += 1;
      continue;
    }

    const isUnchanged =
      existing.description === mapped.description &&
      existing.category === mapped.category &&
      JSON.stringify(existing.content) === JSON.stringify(mapped.content) &&
      existing.legalReference === mapped.legalReference &&
      existing.isGlobal === mapped.isGlobal &&
      existing.isActive === mapped.isActive &&
      JSON.stringify(existing.industryScope) === JSON.stringify(mapped.industryScope) &&
      existing.createdBy === mapped.createdBy;

    if (!isUnchanged) {
      await db
        .from("RoutineTemplate")
        .update({ ...mapped, updatedAt: new Date().toISOString() })
        .eq("id", existing.id);
      updated += 1;
    }
  }

  return {
    success: true as const,
    data: {
      created,
      updated,
      total: library.length,
    },
  };
}

export async function ensureGlobalRoutineTemplateLibrarySeeded() {
  const libraryTitles = getGlobalRoutineTemplateLibrary().map((entry) => entry.title);
  const { count } = await getAdminDb()
    .from("RoutineTemplate")
    .select("id", { count: "exact", head: true })
    .is("tenantId", null)
    .eq("isGlobal", true)
    .in("title", libraryTitles);

  if ((count ?? 0) === libraryTitles.length) {
    return { success: true as const, data: { seeded: false } };
  }

  await seedGlobalRoutineTemplateLibrary();
  return { success: true as const, data: { seeded: true } };
}

export async function getRoutineLibraryStatus() {
  const hasAccess = await requirePrivilegedAccess();
  if (!hasAccess) {
    return { success: false as const, error: "Not authorised." };
  }

  const library = getGlobalRoutineTemplateLibrary();
  const libraryTitles = new Set(library.map((entry) => entry.title));
  const expectedByIndustry = Object.fromEntries(INDUSTRY_KEYS.map((industry) => [industry, 0])) as Record<
    IndustryKey,
    number
  >;

  for (const entry of library) {
    for (const scope of entry.industryScope) {
      const key = scope as IndustryKey;
      if (key in expectedByIndustry) {
        expectedByIndustry[key] += 1;
      }
    }
  }

  const { data: templates } = await getAdminDb()
    .from("RoutineTemplate")
    .select("title, industryScope, updatedAt, isActive, createdBy")
    .is("tenantId", null)
    .eq("isGlobal", true)
    .in("title", Array.from(libraryTitles));

  const rows = templates ?? [];
  const existingByIndustry = Object.fromEntries(INDUSTRY_KEYS.map((industry) => [industry, 0])) as Record<
    IndustryKey,
    number
  >;

  for (const template of rows) {
    const scopes = parseIndustryScope(template.industryScope);
    for (const scope of scopes) {
      const key = scope as IndustryKey;
      if (key in existingByIndustry) {
        existingByIndustry[key] += 1;
      }
    }
  }

  const syncedTemplates = rows.filter((template) => template.createdBy === SYSTEM_LIBRARY_CREATED_BY);
  const lastSyncedAt =
    syncedTemplates.length > 0
      ? syncedTemplates
          .map((template) => new Date(template.updatedAt))
          .sort((a, b) => b.getTime() - a.getTime())[0]
      : null;

  const perIndustry = INDUSTRY_KEYS.map((industry) => ({
    industry,
    expected: expectedByIndustry[industry],
    existing: existingByIndustry[industry],
    missing: Math.max(expectedByIndustry[industry] - existingByIndustry[industry], 0),
  }));

  const totalExpected = perIndustry.reduce((sum, item) => sum + item.expected, 0);
  const totalExisting = perIndustry.reduce((sum, item) => sum + item.existing, 0);
  const missingTotal = perIndustry.reduce((sum, item) => sum + item.missing, 0);
  const activeCount = rows.filter((template) => template.isActive).length;

  return {
    success: true as const,
    data: {
      totalTemplates: library.length,
      totalExpected,
      totalExisting,
      missingTotal,
      activeCount,
      lastSyncedAt,
      health: missingTotal === 0 ? "HEALTHY" : "MISSING",
      perIndustry,
    },
  };
}

export async function syncRoutineLibraryNow() {
  const hasAccess = await requirePrivilegedAccess();
  if (!hasAccess) {
    return { success: false as const, error: "Not authorised." };
  }

  const result = await seedGlobalRoutineTemplateLibrary();
  return {
    success: true as const,
    data: result.data,
  };
}
