"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { sendEmail } from "@/lib/email";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeAllCrm, isSalesStaff } from "@/lib/platform-access";
import { CRM_DEAL_STAGES, CRM_ACTIVITY_TYPES, CRM_ACTIVITY_CHANNELS } from "@/features/crm/lib/types";
import { isCrmDealStage } from "@/features/crm/lib/labels";
import { crmReplyToAddress } from "@/features/crm/lib/scope";

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

function fail(message: string): ActionResult<never> {
  return { success: false, error: message };
}

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateCrm(paths: string[] = []) {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/pipeline");
  revalidatePath("/admin/crm/companies");
  revalidatePath("/admin/crm/tasks");
  for (const path of paths) {
    revalidatePath(path);
  }
}

async function assertOrgAccess(organisationId: string, staffId: string, canSeeAll: boolean) {
  const { data, error } = await getAdminDb()
    .from("CrmOrganisation")
    .select("id, ownerId")
    .eq("id", organisationId)
    .maybeSingle();
  if (error) {
    throw { code: "CRM_ORG_LOOKUP_FAILED", message: error.message };
  }
  if (!data) {
    return null;
  }
  if (!canSeeAll && data.ownerId !== staffId) {
    return null;
  }
  return data as { id: string; ownerId: string | null };
}

const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name is required"),
  companyNumber: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  employeeCount: z.coerce.number().int().positive().optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  contactName: z.string().trim().min(2, "Contact name is required"),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().optional(),
  valueGbp: z.coerce.number().min(0).optional(),
  ownerId: z.string().optional(),
});

export async function createCrmCompany(
  input: z.infer<typeof createCompanySchema>,
): Promise<ActionResult<{ organisationId: string; dealId: string }>> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const parsed = createCompanySchema.parse(input);
    const ownerId = canSeeAllCrm(staff) ? parsed.ownerId || staff.id : staff.id;
    const db = getAdminDb();
    const now = nowIso();
    const organisationId = createId();
    const dealId = createId();

    const { error: orgError } = await db.from("CrmOrganisation").insert({
      id: organisationId,
      name: parsed.name,
      companyNumber: parsed.companyNumber || null,
      industry: parsed.industry || null,
      employeeCount: parsed.employeeCount ?? null,
      website: parsed.website || null,
      address: parsed.address || null,
      city: parsed.city || null,
      postalCode: parsed.postalCode || null,
      notes: parsed.notes || null,
      ownerId,
      source: "MANUAL",
      createdAt: now,
      updatedAt: now,
    });
    if (orgError) {
      throw { code: "CRM_ORG_CREATE_FAILED", message: orgError.message };
    }

    await db.from("CrmContact").insert({
      id: createId(),
      organisationId,
      name: parsed.contactName,
      email: parsed.contactEmail || null,
      phone: parsed.contactPhone || null,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    });

    const { error: dealError } = await db.from("CrmDeal").insert({
      id: dealId,
      organisationId,
      ownerId,
      title: `${parsed.name} — HSEQ Nova`,
      valueGbp: parsed.valueGbp ?? 0,
      currency: "GBP",
      stage: "NEW",
      createdAt: now,
      updatedAt: now,
    });
    if (dealError) {
      throw { code: "CRM_DEAL_CREATE_FAILED", message: dealError.message };
    }

    await db.from("CrmActivity").insert({
      id: createId(),
      organisationId,
      dealId,
      type: "NOTE",
      channel: "OTHER",
      note: "Company added to the sales pipeline",
      createdById: staff.id,
      createdAt: now,
    });

    revalidateCrm([`/admin/crm/companies/${organisationId}`, `/admin/crm/deals/${dealId}`]);
    return { success: true, data: { organisationId, dealId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input");
    }
    return fail(error instanceof Error ? error.message : "Could not create company");
  }
}

const updateDealStageSchema = z.object({
  dealId: z.string().min(1),
  stage: z.enum(CRM_DEAL_STAGES),
  lostReason: z.string().trim().optional(),
});

export async function updateCrmDealStage(
  input: z.infer<typeof updateDealStageSchema>,
): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const parsed = updateDealStageSchema.parse(input);
    if (!isCrmDealStage(parsed.stage)) {
      return fail("Invalid stage");
    }
    if (parsed.stage === "LOST" && !parsed.lostReason) {
      return fail("A lost reason is required");
    }

    const db = getAdminDb();
    const { data: deal, error } = await db
      .from("CrmDeal")
      .select("id, ownerId, organisationId, stage")
      .eq("id", parsed.dealId)
      .maybeSingle();
    if (error) {
      throw { code: "CRM_DEAL_LOOKUP_FAILED", message: error.message };
    }
    if (!deal) {
      return fail("Deal not found");
    }
    if (!canSeeAllCrm(staff) && deal.ownerId !== staff.id) {
      return fail("You can only update your own deals");
    }

    const { error: updateError } = await db
      .from("CrmDeal")
      .update({
        stage: parsed.stage,
        lostReason: parsed.stage === "LOST" ? parsed.lostReason : null,
        updatedAt: nowIso(),
      })
      .eq("id", parsed.dealId);
    if (updateError) {
      throw { code: "CRM_DEAL_UPDATE_FAILED", message: updateError.message };
    }

    revalidateCrm([
      `/admin/crm/deals/${parsed.dealId}`,
      `/admin/crm/companies/${deal.organisationId}`,
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input");
    }
    return fail(error instanceof Error ? error.message : "Could not update the deal");
  }
}

const assignOwnerSchema = z.object({
  organisationId: z.string().min(1),
  ownerId: z.string().nullable(),
  dealId: z.string().optional(),
});

export async function assignCrmOwner(
  input: z.infer<typeof assignOwnerSchema>,
): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !canSeeAllCrm(staff)) {
      return fail("Only a sales manager can assign owners");
    }
    const parsed = assignOwnerSchema.parse(input);
    const db = getAdminDb();
    const now = nowIso();

    const { error: orgError } = await db
      .from("CrmOrganisation")
      .update({ ownerId: parsed.ownerId, updatedAt: now })
      .eq("id", parsed.organisationId);
    if (orgError) {
      throw { code: "CRM_ORG_UPDATE_FAILED", message: orgError.message };
    }

    if (parsed.dealId) {
      await db
        .from("CrmDeal")
        .update({ ownerId: parsed.ownerId, updatedAt: now })
        .eq("id", parsed.dealId);
    } else {
      await db
        .from("CrmDeal")
        .update({ ownerId: parsed.ownerId, updatedAt: now })
        .eq("organisationId", parsed.organisationId)
        .in("stage", ["NEW", "QUALIFIED", "DEMO", "PROPOSAL", "NEGOTIATION"]);
    }

    revalidateCrm([
      `/admin/crm/companies/${parsed.organisationId}`,
      parsed.dealId ? `/admin/crm/deals/${parsed.dealId}` : "/admin/crm/pipeline",
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not assign owner");
  }
}

const logActivitySchema = z.object({
  organisationId: z.string().min(1),
  dealId: z.string().optional(),
  type: z.enum(CRM_ACTIVITY_TYPES),
  channel: z.enum(CRM_ACTIVITY_CHANNELS),
  note: z.string().trim().min(2, "Write a short note"),
});

export async function logCrmActivity(input: z.infer<typeof logActivitySchema>): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const parsed = logActivitySchema.parse(input);
    const org = await assertOrgAccess(parsed.organisationId, staff.id, canSeeAllCrm(staff));
    if (!org) {
      return fail("Company not found");
    }

    const { error } = await getAdminDb().from("CrmActivity").insert({
      id: createId(),
      organisationId: parsed.organisationId,
      dealId: parsed.dealId || null,
      type: parsed.type,
      channel: parsed.channel,
      note: parsed.note,
      createdById: staff.id,
      createdAt: nowIso(),
    });
    if (error) {
      throw { code: "CRM_ACTIVITY_CREATE_FAILED", message: error.message };
    }

    revalidateCrm([
      `/admin/crm/companies/${parsed.organisationId}`,
      parsed.dealId ? `/admin/crm/deals/${parsed.dealId}` : "/admin/crm/pipeline",
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input");
    }
    return fail(error instanceof Error ? error.message : "Could not save activity");
  }
}

const createTaskSchema = z.object({
  organisationId: z.string().min(1),
  dealId: z.string().optional(),
  title: z.string().trim().min(2, "Task title is required"),
  dueAt: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function createCrmTask(input: z.infer<typeof createTaskSchema>): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const parsed = createTaskSchema.parse(input);
    const org = await assertOrgAccess(parsed.organisationId, staff.id, canSeeAllCrm(staff));
    if (!org) {
      return fail("Company not found");
    }

    const assignedToId = canSeeAllCrm(staff) ? parsed.assignedToId || staff.id : staff.id;
    const { error } = await getAdminDb().from("CrmTask").insert({
      id: createId(),
      organisationId: parsed.organisationId,
      dealId: parsed.dealId || null,
      assignedToId,
      title: parsed.title,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt).toISOString() : null,
      status: "OPEN",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    if (error) {
      throw { code: "CRM_TASK_CREATE_FAILED", message: error.message };
    }

    revalidateCrm([`/admin/crm/companies/${parsed.organisationId}`, "/admin/crm/tasks"]);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input");
    }
    return fail(error instanceof Error ? error.message : "Could not create task");
  }
}

export async function completeCrmTask(taskId: string): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const db = getAdminDb();
    const { data: task, error } = await db
      .from("CrmTask")
      .select("id, assignedToId, organisationId")
      .eq("id", taskId)
      .maybeSingle();
    if (error) {
      throw { code: "CRM_TASK_LOOKUP_FAILED", message: error.message };
    }
    if (!task) {
      return fail("Task not found");
    }
    if (!canSeeAllCrm(staff) && task.assignedToId !== staff.id) {
      return fail("You can only complete your own tasks");
    }

    const { error: updateError } = await db
      .from("CrmTask")
      .update({ status: "DONE", updatedAt: nowIso() })
      .eq("id", taskId);
    if (updateError) {
      throw { code: "CRM_TASK_UPDATE_FAILED", message: updateError.message };
    }

    revalidateCrm([`/admin/crm/companies/${task.organisationId}`, "/admin/crm/tasks"]);
    return { success: true, data: undefined };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not complete task");
  }
}

const updateDealValueSchema = z.object({
  dealId: z.string().min(1),
  valueGbp: z.coerce.number().min(0),
  expectedCloseAt: z.string().optional(),
  title: z.string().trim().min(2).optional(),
});

export async function updateCrmDealDetails(
  input: z.infer<typeof updateDealValueSchema>,
): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const parsed = updateDealValueSchema.parse(input);
    const db = getAdminDb();
    const { data: deal, error } = await db
      .from("CrmDeal")
      .select("id, ownerId, organisationId")
      .eq("id", parsed.dealId)
      .maybeSingle();
    if (error || !deal) {
      return fail("Deal not found");
    }
    if (!canSeeAllCrm(staff) && deal.ownerId !== staff.id) {
      return fail("You can only update your own deals");
    }

    const { error: updateError } = await db
      .from("CrmDeal")
      .update({
        valueGbp: parsed.valueGbp,
        expectedCloseAt: parsed.expectedCloseAt ? new Date(parsed.expectedCloseAt).toISOString() : null,
        title: parsed.title,
        updatedAt: nowIso(),
      })
      .eq("id", parsed.dealId);
    if (updateError) {
      throw { code: "CRM_DEAL_UPDATE_FAILED", message: updateError.message };
    }

    revalidateCrm([
      `/admin/crm/deals/${parsed.dealId}`,
      `/admin/crm/companies/${deal.organisationId}`,
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input");
    }
    return fail(error instanceof Error ? error.message : "Could not update the deal");
  }
}

const sendCrmEmailSchema = z.object({
  dealId: z.string().min(1),
  to: z.string().email("Enter a valid recipient email"),
  subject: z.string().trim().min(3, "Subject is required").max(200),
  body: z.string().trim().min(10, "Write a short message").max(20000),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendCrmEmail(input: z.infer<typeof sendCrmEmailSchema>): Promise<ActionResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff || !isSalesStaff(staff)) {
      return fail("You do not have access to CRM");
    }
    const parsed = sendCrmEmailSchema.parse(input);
    const db = getAdminDb();
    const { data: deal, error } = await db
      .from("CrmDeal")
      .select("id, ownerId, organisationId, title")
      .eq("id", parsed.dealId)
      .maybeSingle();
    if (error || !deal) {
      return fail("Deal not found");
    }
    if (!canSeeAllCrm(staff) && deal.ownerId !== staff.id) {
      return fail("You can only email from your own deals");
    }

    let owner: { name: string | null; email: string } | null = null;
    if (deal.ownerId) {
      const { data: ownerRow } = await db
        .from("User")
        .select("name, email")
        .eq("id", deal.ownerId)
        .maybeSingle();
      if (ownerRow?.email) {
        owner = {
          name: (ownerRow.name as string | null) ?? null,
          email: String(ownerRow.email),
        };
      }
    }

    const replyTo = crmReplyToAddress({
      owner,
      staff: { name: staff.name, email: staff.email },
    });
    const senderName = owner?.name || staff.name || "HSEQ Nova";
    const html = `<p>${escapeHtml(parsed.body).replace(/\n/g, "<br />")}</p>
<p style="margin-top:24px;color:#64748b;font-size:13px">Reply to this email to reach ${escapeHtml(senderName)} directly.</p>`;

    await sendEmail({
      to: parsed.to,
      subject: parsed.subject,
      html,
      replyTo,
    });

    const { error: activityError } = await db.from("CrmActivity").insert({
      id: createId(),
      organisationId: deal.organisationId,
      dealId: parsed.dealId,
      type: "FOLLOW_UP",
      channel: "EMAIL",
      note: `Email to ${parsed.to}: ${parsed.subject}\n\n${parsed.body}`,
      createdById: staff.id,
      createdAt: nowIso(),
    });
    if (activityError) {
      throw { code: "CRM_ACTIVITY_CREATE_FAILED", message: activityError.message };
    }

    revalidateCrm([
      `/admin/crm/deals/${parsed.dealId}`,
      `/admin/crm/companies/${deal.organisationId}`,
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message ?? "Invalid input");
    }
    return fail(error instanceof Error ? error.message : "Could not send the email");
  }
}
