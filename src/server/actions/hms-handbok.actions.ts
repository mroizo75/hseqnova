"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";
import { notifyUsersByRoles } from "@/server/actions/notification.actions";
import type { HandbookVersionStatus } from "@prisma/client";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import {
  DEFAULT_POLICY_SECTIONS as DEFAULT_SECTIONS,
  HEALTH_SAFETY_POLICY_LEGACY_PATH,
  HEALTH_SAFETY_POLICY_PATH,
  applyUkPolicyDefaults,
  policySectionNeedsUkSync,
} from "@/lib/health-safety-policy";

const POLICY_REVALIDATE_PATHS = [HEALTH_SAFETY_POLICY_PATH, HEALTH_SAFETY_POLICY_LEGACY_PATH] as const;

function revalidatePolicyPaths() {
  for (const path of POLICY_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

// ── Typer ───────────────────────────────────────────────────────────────────
export type HandbookSignaturePublic = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  signedAt: Date | string;
  comment: string | null;
};

export type HandbookSectionData = {
  id: string;
  sectionKey: string;
  sectionNumber: string;
  title: string;
  content: string;
  legalRef: string | null;
  sortOrder: number;
  moduleLink: string | null;
  children: HandbookSectionData[];
};

export type HandbookVersionData = {
  id: string;
  version: string;
  status: HandbookVersionStatus;
  changeNote: string | null;
  approvedByName: string | null;
  approvedAt: Date | string | null;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  signatureCount: number;
  totalEmployees: number;
  sections: HandbookSectionData[];
};

export type HandbookData = {
  id: string;
  tenantId: string;
  lastReviewedAt: Date | string | null;
  reviewedByName: string | null;
  currentVersion: HandbookVersionData | null;
  signatures: HandbookSignaturePublic[];
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AnnualPlanProgress = {
  year: number;
  totalSteps: number;
  completedSteps: number;
  steps: Array<{
    key: string;
    title: string;
    category: string;
    completed: boolean;
    completedAt: string | null;
  }>;
};

export type LiveHandbookStats = {
  activeRiskAssessments: number;
  activeRoutines: number;
  openIncidentsLast30d: number;
  activeTrainings: number;
  lastIncidentAt: Date | string | null;
  lastRiskReviewAt: Date | string | null;
  lastRoutineReviewAt: Date | string | null;
  annualPlanProgress: AnnualPlanProgress | null;
};

// ── Hjelpefunksjoner ─────────────────────────────────────────────────────────

async function getOrCreateHandbook(tenantId: string) {
  const db = getAdminDb();
  const { data: existing } = await db
    .from("HmsHandbook")
    .select("id, tenantId, currentVersionId")
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (existing?.id) {
    const { data: versions } = await db
      .from("HandbookVersion")
      .select("id")
      .eq("handbookId", existing.id)
      .limit(1);
    if (!versions || versions.length === 0) {
      await seedDefaultVersion(existing.id, tenantId);
    }
    return existing;
  }

  const handbook = {
    id: createId(),
    tenantId,
    currentVersionId: null as string | null,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await db.from("HmsHandbook").insert(handbook);
  if (error) {
    throw { code: "HANDBOOK_CREATE_FAILED", message: error.message };
  }
  await seedDefaultVersion(handbook.id, tenantId);
  return handbook;
}

async function seedDefaultVersion(handbookId: string, tenantId: string) {
  const db = getAdminDb();
  const { data: existingVersion } = await db
    .from("HandbookVersion")
    .select("id")
    .eq("handbookId", handbookId)
    .maybeSingle();
  if (existingVersion) return;

  const versionId = createId();
  const now = new Date().toISOString();
  const { error: versionError } = await db.from("HandbookVersion").insert({
    id: versionId,
    handbookId,
    version: "1.0",
    status: "DRAFT",
    changeNote: "First version — default H&S policy sections",
    updatedAt: now,
  });
  if (versionError) {
    throw { code: "HANDBOOK_VERSION_FAILED", message: versionError.message };
  }

  const { error: sectionError } = await db.from("HandbookSection").insert(
    DEFAULT_SECTIONS.map((section) => ({
      id: createId(),
      versionId,
      sectionKey: section.sectionKey,
      sectionNumber: section.sectionNumber,
      title: section.title,
      content: section.content,
      legalRef: section.legalRef,
      sortOrder: section.sortOrder,
      moduleLink: section.moduleLink,
      updatedAt: now,
    })),
  );
  if (sectionError) {
    throw { code: "HANDBOOK_SECTION_FAILED", message: sectionError.message };
  }

  await db
    .from("HmsHandbook")
    .update({ currentVersionId: versionId, updatedAt: now })
    .eq("id", handbookId);
}

async function syncUkPolicySections(
  sections: Array<{
    id: string;
    sectionKey: string;
    sectionNumber: string;
    title: string;
    content: string;
    legalRef: string | null;
  }>,
) {
  const db = getAdminDb();
  const now = new Date().toISOString();
  let updated = 0;
  for (const section of sections) {
    const def =
      DEFAULT_SECTIONS.find((d) => d.sectionKey === section.sectionKey) ??
      DEFAULT_SECTIONS.find((d) => d.sectionNumber === section.sectionNumber);
    if (!def) continue;
    if (!policySectionNeedsUkSync(section)) continue;
    const { error } = await db
      .from("HandbookSection")
      .update({
        title: def.title,
        content: def.content,
        legalRef: def.legalRef,
        moduleLink: def.moduleLink,
        sectionNumber: def.sectionNumber,
        sortOrder: def.sortOrder,
        updatedAt: now,
      })
      .eq("id", section.id);
    if (!error) updated += 1;
  }
  return updated;
}

function buildSectionTree(sections: Array<{
  id: string;
  sectionKey: string;
  sectionNumber: string;
  title: string;
  content: string;
  legalRef: string | null;
  sortOrder: number;
  moduleLink: string | null;
  parentId: string | null;
}>): HandbookSectionData[] {
  const map = new Map<string, HandbookSectionData>();
  const roots: HandbookSectionData[] = [];

  for (const s of sections) {
    const uk = applyUkPolicyDefaults(s);
    map.set(s.id, {
      id: uk.id,
      sectionKey: uk.sectionKey,
      sectionNumber: uk.sectionNumber,
      title: uk.title,
      content: uk.content,
      legalRef: uk.legalRef,
      sortOrder: uk.sortOrder,
      moduleLink: uk.moduleLink,
      children: [],
    });
  }

  for (const s of sections) {
    const node = map.get(s.id)!;
    if (s.parentId && map.has(s.parentId)) {
      map.get(s.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  for (const node of map.values()) {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return roots;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function getHandbookData(tenantId: string): Promise<{
  success: true;
  handbook: HandbookData;
  stats: LiveHandbookStats;
} | { success: false; error: string }> {
  try {
    await getOrCreateHandbook(tenantId);
    const db = getAdminDb();

    const { data: fullHandbook, error: handbookError } = await db
      .from("HmsHandbook")
      .select("*")
      .eq("tenantId", tenantId)
      .single();
    if (handbookError || !fullHandbook) {
      throw handbookError ?? { message: "Handbook not found" };
    }

    const { data: signatures } = await db
      .from("HandbookSignature")
      .select("id, userId, signedAt, comment")
      .eq("handbookId", fullHandbook.id)
      .order("signedAt", { ascending: false });

    const signerIds = [...new Set((signatures ?? []).map((row) => row.userId as string))];
    const { data: signerUsers } = signerIds.length
      ? await db.from("User").select("id, name, email").in("id", signerIds)
      : { data: [] as Array<{ id: string; name: string | null; email: string }> };
    const signerById = new Map((signerUsers ?? []).map((user) => [user.id, user]));

    let reviewedByName: string | null = null;
    if (fullHandbook.reviewedById) {
      const { data: reviewer } = await db
        .from("User")
        .select("name")
        .eq("id", fullHandbook.reviewedById)
        .maybeSingle();
      reviewedByName = reviewer?.name ?? null;
    }

    const versionId = fullHandbook.currentVersionId as string | null;
    let currentVersion: {
      id: string;
      version: string;
      status: HandbookVersionStatus;
      changeNote: string | null;
      approvedAt: string | null;
      publishedAt: string | null;
      createdAt: string;
      approvedByName: string | null;
      signatures: unknown[];
      sections: Array<{
        id: string;
        sectionKey: string;
        sectionNumber: string;
        title: string;
        content: string;
        legalRef: string | null;
        sortOrder: number;
        moduleLink: string | null;
        parentId: string | null;
      }>;
    } | null = null;

    if (versionId) {
      const { data: version } = await db.from("HandbookVersion").select("*").eq("id", versionId).maybeSingle();
      if (version) {
        const { data: sections } = await db
          .from("HandbookSection")
          .select("*")
          .eq("versionId", version.id)
          .order("sortOrder", { ascending: true });
        if (sections && sections.length > 0) {
          const synced = await syncUkPolicySections(
            sections.map((row) => ({
              id: row.id as string,
              sectionKey: row.sectionKey as string,
              sectionNumber: String(row.sectionNumber ?? ""),
              title: row.title as string,
              content: row.content as string,
              legalRef: (row.legalRef as string | null) ?? null,
            })),
          );
          if (synced > 0) {
            const { data: refreshed } = await db
              .from("HandbookSection")
              .select("*")
              .eq("versionId", version.id)
              .order("sortOrder", { ascending: true });
            if (refreshed) {
              sections.splice(0, sections.length, ...refreshed);
            }
          }
        }
        const { data: versionSignatures } = await db
          .from("HandbookSignature")
          .select("id")
          .eq("versionId", version.id);
        let approvedByName: string | null = null;
        if (version.approvedById) {
          const { data: approver } = await db
            .from("User")
            .select("name")
            .eq("id", version.approvedById)
            .maybeSingle();
          approvedByName = approver?.name ?? null;
        }
        currentVersion = {
          ...version,
          approvedByName,
          signatures: versionSignatures ?? [],
          sections: (sections ?? []) as Array<{
            id: string;
            sectionKey: string;
            sectionNumber: string;
            title: string;
            content: string;
            legalRef: string | null;
            sortOrder: number;
            moduleLink: string | null;
            parentId: string | null;
          }>,
        };
      }
    }

    const { count: totalEmployees } = await db
      .from("UserTenant")
      .select("id", { count: "exact", head: true })
      .eq("tenantId", tenantId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      riskCount,
      routineCount,
      incidentCount,
      trainingCount,
      lastIncident,
      lastRiskReview,
      lastRoutineReview,
    ] = await Promise.all([
      db.from("RiskAssessment").select("id", { count: "exact", head: true }).eq("tenantId", tenantId),
      db.from("Routine").select("id", { count: "exact", head: true }).eq("tenantId", tenantId).eq("status", "ACTIVE"),
      db
        .from("Incident")
        .select("id", { count: "exact", head: true })
        .eq("tenantId", tenantId)
        .gte("occurredAt", thirtyDaysAgo)
        .neq("status", "CLOSED"),
      db.from("Training").select("id", { count: "exact", head: true }).eq("tenantId", tenantId).is("completedAt", null),
      db.from("Incident").select("occurredAt").eq("tenantId", tenantId).order("occurredAt", { ascending: false }).limit(1).maybeSingle(),
      db.from("RiskAssessment").select("updatedAt").eq("tenantId", tenantId).order("updatedAt", { ascending: false }).limit(1).maybeSingle(),
      db
        .from("Routine")
        .select("lastReviewedAt")
        .eq("tenantId", tenantId)
        .eq("status", "ACTIVE")
        .order("lastReviewedAt", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const versionData: HandbookVersionData | null = currentVersion
      ? {
          id: currentVersion.id,
          version: currentVersion.version,
          status: currentVersion.status,
          changeNote: currentVersion.changeNote,
          approvedByName: currentVersion.approvedByName,
          approvedAt: currentVersion.approvedAt ? new Date(currentVersion.approvedAt) : null,
          publishedAt: currentVersion.publishedAt ? new Date(currentVersion.publishedAt) : null,
          createdAt: new Date(currentVersion.createdAt),
          signatureCount: currentVersion.signatures.length,
          totalEmployees: totalEmployees ?? 0,
          sections: buildSectionTree(currentVersion.sections),
        }
      : null;

    return {
      success: true,
      handbook: {
        id: fullHandbook.id,
        tenantId: fullHandbook.tenantId,
        lastReviewedAt: fullHandbook.lastReviewedAt ? new Date(fullHandbook.lastReviewedAt) : null,
        reviewedByName,
        currentVersion: versionData,
        signatures: (signatures ?? []).map((row) => ({
          id: row.id,
          userId: row.userId,
          userName: signerById.get(row.userId)?.name ?? null,
          userEmail: signerById.get(row.userId)?.email ?? "",
          signedAt: new Date(row.signedAt),
          comment: row.comment,
        })),
        createdAt: new Date(fullHandbook.createdAt),
        updatedAt: new Date(fullHandbook.updatedAt),
      },
      stats: {
        activeRiskAssessments: riskCount.count ?? 0,
        activeRoutines: routineCount.count ?? 0,
        openIncidentsLast30d: incidentCount.count ?? 0,
        activeTrainings: trainingCount.count ?? 0,
        lastIncidentAt: lastIncident.data?.occurredAt ? new Date(lastIncident.data.occurredAt) : null,
        lastRiskReviewAt: lastRiskReview.data?.updatedAt ? new Date(lastRiskReview.data.updatedAt) : null,
        lastRoutineReviewAt: lastRoutineReview.data?.lastReviewedAt
          ? new Date(lastRoutineReview.data.lastReviewedAt)
          : null,
        annualPlanProgress: await getAnnualPlanProgress(tenantId),
      },
    };
  } catch {
    return { success: false, error: "Could not load the health and safety policy" };
  }
}

async function getAnnualPlanProgress(
  _tenantId: string,
): Promise<AnnualPlanProgress | null> {
  // Annual H&S plan module removed from UK product
  return null;
}

// ── Versjonskontroll ────────────────────────────────────────────────────────

const createDraftSchema = z.object({ tenantId: z.string().min(1), changeNote: z.string().optional() });

export async function createNewDraft(
  input: z.infer<typeof createDraftSchema>,
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  try {
    const { tenantId, changeNote } = createDraftSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.tenantId !== tenantId) {
      return { success: false, error: "Not authorised" };
    }
    const permissions = getPermissions(session.user.role as import("@prisma/client").Role);
    if (!permissions.canUpdateSettings) return { success: false, error: "Ingen tilgang" };

    const handbook = await getOrCreateHandbook(tenantId);

    const existingDraft = await prisma.handbookVersion.findFirst({
      where: { handbookId: handbook.id, status: "DRAFT" },
    });
    if (existingDraft) return { success: false, error: "Det finnes allerede et utkast (v" + existingDraft.version + ")" };

    const currentVersion = handbook.currentVersionId
      ? await prisma.handbookVersion.findUnique({
          where: { id: handbook.currentVersionId },
          include: { sections: true },
        })
      : await prisma.handbookVersion.findFirst({
          where: { handbookId: handbook.id },
          orderBy: { createdAt: "desc" },
          include: { sections: true },
        });

    const nextVersion = bumpVersion(currentVersion?.version ?? "0.9");

    const newVersion = await prisma.handbookVersion.create({
      data: {
        handbookId: handbook.id,
        version: nextVersion,
        status: "DRAFT",
        changeNote: changeNote ?? null,
        basedOnVersionId: currentVersion?.id ?? null,
      },
    });

    if (currentVersion?.sections && currentVersion.sections.length > 0) {
      await prisma.handbookSection.createMany({
        data: currentVersion.sections.map((s) => ({
          versionId: newVersion.id,
          parentId: null,
          sectionKey: s.sectionKey,
          sectionNumber: s.sectionNumber,
          title: s.title,
          content: s.content,
          legalRef: s.legalRef,
          sortOrder: s.sortOrder,
          moduleLink: s.moduleLink,
        })),
      });
    }

    revalidatePolicyPaths();
    return { success: true, versionId: newVersion.id };
  } catch {
    return { success: false, error: "Could not create draft" };
  }
}

const updateSectionSchema = z.object({
  sectionId: z.string().min(1),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  legalRef: z.string().optional(),
});

export async function updateDraftSection(
  input: z.infer<typeof updateSectionSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { sectionId, ...data } = updateSectionSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authorised" };

    const section = await prisma.handbookSection.findUniqueOrThrow({
      where: { id: sectionId },
      include: {
        version: {
          include: { handbook: true },
        },
      },
    });

    if (section.version.handbook.tenantId !== session.user.tenantId) {
      return { success: false, error: "Not authorised" };
    }
    if (section.version.status !== "DRAFT") {
      return { success: false, error: "Kan kun redigere seksjoner i utkast" };
    }

    const permissions = getPermissions(session.user.role as import("@prisma/client").Role);
    if (!permissions.canUpdateSettings) return { success: false, error: "Ingen tilgang" };

    await prisma.handbookSection.update({
      where: { id: sectionId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.legalRef !== undefined && { legalRef: data.legalRef || null }),
      },
    });

    revalidatePolicyPaths();
    return { success: true };
  } catch {
    return { success: false, error: "Could not update section" };
  }
}

const submitForApprovalSchema = z.object({ versionId: z.string().min(1) });

export async function submitForApproval(
  input: z.infer<typeof submitForApprovalSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { versionId } = submitForApprovalSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authorised" };

    const version = await prisma.handbookVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: { handbook: true },
    });

    if (version.handbook.tenantId !== session.user.tenantId) {
      return { success: false, error: "Not authorised" };
    }
    if (version.status !== "DRAFT") {
      return { success: false, error: "Kun utkast kan sendes til godkjenning" };
    }

    await prisma.handbookVersion.update({
      where: { id: versionId },
      data: { status: "PENDING_APPROVAL" },
    });

    notifyUsersByRoles(version.handbook.tenantId, ["ADMIN", "HMS"], {
      type: "HANDBOOK_APPROVAL_REQUESTED",
      title: "Health and safety policy needs approval",
      message: `Versjon ${version.version} er sendt til godkjenning`,
      link: HEALTH_SAFETY_POLICY_PATH,
    }).catch(() => {});

    revalidatePolicyPaths();
    return { success: true };
  } catch {
    return { success: false, error: "Could not submit for approval" };
  }
}

const approveVersionSchema = z.object({ versionId: z.string().min(1) });

export async function approveVersion(
  input: z.infer<typeof approveVersionSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { versionId } = approveVersionSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authorised" };

    const permissions = getPermissions(session.user.role as import("@prisma/client").Role);
    if (!permissions.canUpdateSettings && !permissions.canApproveDocuments) {
      return { success: false, error: "Kun admin/HMS kan godkjenne" };
    }

    const version = await prisma.handbookVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: { handbook: true },
    });

    if (version.handbook.tenantId !== session.user.tenantId) {
      return { success: false, error: "Not authorised" };
    }
    if (version.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Versjonen er ikke til godkjenning" };
    }

    // Arkiver tidligere godkjent versjon
    if (version.handbook.currentVersionId && version.handbook.currentVersionId !== versionId) {
      await prisma.handbookVersion.update({
        where: { id: version.handbook.currentVersionId },
        data: { status: "ARCHIVED" },
      });
    }

    const now = new Date();
    await prisma.handbookVersion.update({
      where: { id: versionId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: now,
        publishedAt: now,
      },
    });

    await prisma.hmsHandbook.update({
      where: { id: version.handbookId },
      data: {
        currentVersionId: versionId,
        lastReviewedAt: now,
        reviewedById: session.user.id,
      },
    });

    notifyUsersByRoles(version.handbook.tenantId, ["EMPLOYEE", "VERNEOMBUD", "HMS", "ADMIN"], {
      type: "HANDBOOK_NEW_VERSION",
      title: "New health and safety policy version published",
      message: `Versjon ${version.version} er godkjent – vennligst les og signer`,
      link: HEALTH_SAFETY_POLICY_PATH,
    }).catch(() => {});

    revalidatePolicyPaths();
    return { success: true };
  } catch {
    return { success: false, error: "Could not approve the version" };
  }
}

const rejectDraftSchema = z.object({
  versionId: z.string().min(1),
  rejectedNote: z.string().min(1, "Begrunnelse er påkrevd"),
});

export async function rejectDraft(
  input: z.infer<typeof rejectDraftSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { versionId, rejectedNote } = rejectDraftSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authorised" };

    const permissions = getPermissions(session.user.role as import("@prisma/client").Role);
    if (!permissions.canUpdateSettings && !permissions.canApproveDocuments) {
      return { success: false, error: "Kun admin/HMS kan avvise" };
    }

    const version = await prisma.handbookVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: { handbook: true },
    });

    if (version.handbook.tenantId !== session.user.tenantId) {
      return { success: false, error: "Not authorised" };
    }
    if (version.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Versjonen er ikke til godkjenning" };
    }

    await prisma.handbookVersion.update({
      where: { id: versionId },
      data: { status: "DRAFT", rejectedNote },
    });

    revalidatePolicyPaths();
    return { success: true };
  } catch {
    return { success: false, error: "Could not reject the draft" };
  }
}

// ── Signering ───────────────────────────────────────────────────────────────

const signHandbookSchema = z.object({
  tenantId: z.string().min(1),
  versionId: z.string().optional(),
  comment: z.string().max(1000).optional(),
});

export async function signHandbook(
  input: z.infer<typeof signHandbookSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tenantId, versionId, comment } = signHandbookSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.tenantId !== tenantId) {
      return { success: false, error: "Not authorised" };
    }

    const handbook = await getOrCreateHandbook(tenantId);
    const db = getAdminDb();
    const targetVersionId = versionId ?? handbook.currentVersionId ?? null;

    const { error } = await db.from("HandbookSignature").insert({
      id: createId(),
      handbookId: handbook.id,
      versionId: targetVersionId,
      userId: session.user.id,
      comment: comment ?? null,
      signedAt: new Date().toISOString(),
    });
    if (error) {
      throw { code: "HANDBOOK_ACK_FAILED", message: error.message };
    }

    revalidatePolicyPaths();
    return { success: true };
  } catch {
    return { success: false, error: "Could not save signature" };
  }
}

// ── Gjennomgang ─────────────────────────────────────────────────────────────

const markReviewedSchema = z.object({ tenantId: z.string().min(1) });

export async function markHandbookReviewed(
  input: z.infer<typeof markReviewedSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tenantId } = markReviewedSchema.parse(input);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.tenantId !== tenantId) {
      return { success: false, error: "Not authorised" };
    }
    const permissions = getPermissions(session.user.role as import("@prisma/client").Role);
    if (!permissions.canReadDocuments) return { success: false, error: "Ingen tilgang" };

    await getOrCreateHandbook(tenantId);
    const { error } = await getAdminDb()
      .from("HmsHandbook")
      .update({
        lastReviewedAt: new Date().toISOString(),
        reviewedById: session.user.id,
        updatedAt: new Date().toISOString(),
      })
      .eq("tenantId", tenantId);
    if (error) {
      throw { code: "HANDBOOK_REVIEW_FAILED", message: error.message };
    }

    revalidatePolicyPaths();
    return { success: true };
  } catch {
    return { success: false, error: "Could not save review" };
  }
}

// ── Versjonshistorikk og endringslogg ───────────────────────────────────────

export async function getVersionHistory(tenantId: string) {
  const handbook = await prisma.hmsHandbook.findUnique({
    where: { tenantId },
  });
  if (!handbook) return [];

  return prisma.handbookVersion.findMany({
    where: { handbookId: handbook.id },
    orderBy: { createdAt: "desc" },
    include: {
      approvedBy: { select: { name: true } },
      _count: { select: { signatures: true, sections: true } },
    },
  });
}

export async function getDraftVersion(tenantId: string) {
  const handbook = await prisma.hmsHandbook.findUnique({ where: { tenantId } });
  if (!handbook) return null;

  return prisma.handbookVersion.findFirst({
    where: { handbookId: handbook.id, status: { in: ["DRAFT", "PENDING_APPROVAL"] } },
    include: {
      sections: { orderBy: { sortOrder: "asc" } },
      approvedBy: { select: { name: true } },
    },
  });
}

export async function getHandbookSuggestions(tenantId: string) {
  const { data } = await getAdminDb()
    .from("ImprovementSuggestion")
    .select("*")
    .eq("tenantId", tenantId)
    .eq("status", "PENDING")
    .not("targetSectionKey", "is", null)
    .order("priority", { ascending: false })
    .limit(20);
  return data ?? [];
}

// ── Mal-import (superadmin) ──────────────────────────────────────────────────

const applyTemplateSchema = z.object({
  tenantId: z.string().min(1),
  industryKey: z.string().min(1),
  variables: z.record(z.string(), z.string()),
});

export async function applyHandbookTemplate(
  input: z.infer<typeof applyTemplateSchema>,
): Promise<{ success: boolean; error?: string; sectionsUpdated?: number }> {
  try {
    const { tenantId, industryKey, variables } = applyTemplateSchema.parse(input);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authorised" };

    if (!session.user.isSuperAdmin && !session.user.isSupport) {
      return { success: false, error: "Only superadmin or support can import templates" };
    }

    const { buildIndustryTemplate, replaceTemplateVariables } = await import(
      "@/lib/handbook-templates"
    );

    const { getIndustryPackage } = await import("@/lib/industry-packages");
    const bransjeLabel = getIndustryPackage(industryKey)?.displayName ?? industryKey;
    const template = buildIndustryTemplate(industryKey, bransjeLabel);

    const handbook = await getOrCreateHandbook(tenantId);

    let draftVersion = await prisma.handbookVersion.findFirst({
      where: { handbookId: handbook.id, status: "DRAFT" },
      include: { sections: true },
    });

    if (!draftVersion) {
      const currentVersion = handbook.currentVersionId
        ? await prisma.handbookVersion.findUnique({
            where: { id: handbook.currentVersionId },
          })
        : null;

      const newVersionNumber = currentVersion
        ? bumpVersion(currentVersion.version)
        : "1.0";

      draftVersion = await prisma.handbookVersion.create({
        data: {
          handbookId: handbook.id,
          version: newVersionNumber,
          status: "DRAFT",
          changeNote: `Imported industry template: ${bransjeLabel}`,
        },
        include: { sections: true },
      });

      if (currentVersion) {
        const existingSections = await prisma.handbookSection.findMany({
          where: { versionId: currentVersion.id },
        });
        if (existingSections.length > 0) {
          await prisma.handbookSection.createMany({
            data: existingSections.map((s) => ({
              versionId: draftVersion!.id,
              sectionKey: s.sectionKey,
              sectionNumber: s.sectionNumber,
              title: s.title,
              content: s.content,
              legalRef: s.legalRef,
              sortOrder: s.sortOrder,
              moduleLink: s.moduleLink,
              parentId: null,
            })),
          });

          draftVersion = await prisma.handbookVersion.findUniqueOrThrow({
            where: { id: draftVersion.id },
            include: { sections: true },
          });
        }
      }
    }

    let updatedCount = 0;
    for (const tplSection of template.sections) {
      const processedContent = replaceTemplateVariables(
        tplSection.content,
        variables,
      );

      const existing = draftVersion.sections.find(
        (s) => s.sectionKey === tplSection.sectionKey,
      );

      if (existing) {
        await prisma.handbookSection.update({
          where: { id: existing.id },
          data: { content: processedContent },
        });
      } else {
        const defaultSection = DEFAULT_SECTIONS.find(
          (ds) => ds.sectionKey === tplSection.sectionKey,
        );
        if (defaultSection) {
          await prisma.handbookSection.create({
            data: {
              versionId: draftVersion.id,
              sectionKey: tplSection.sectionKey,
              sectionNumber: defaultSection.sectionNumber,
              title: defaultSection.title,
              content: processedContent,
              legalRef: defaultSection.legalRef,
              sortOrder: defaultSection.sortOrder,
              moduleLink: defaultSection.moduleLink,
            },
          });
        }
      }
      updatedCount++;
    }

    return { success: true, sectionsUpdated: updatedCount };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ukjent feil";
    return { success: false, error: message };
  }
}

// ── Hjelpefunksjoner ────────────────────────────────────────────────────────

function bumpVersion(current: string): string {
  const parts = current.split(".");
  const major = parseInt(parts[0] ?? "1", 10);
  const minor = parseInt(parts[1] ?? "0", 10);
  return `${major}.${minor + 1}`;
}
