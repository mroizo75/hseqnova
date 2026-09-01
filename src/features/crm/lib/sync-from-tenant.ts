import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { CrmDealStage, CrmSource, TenantCrmInput } from "@/features/crm/lib/types";
import { dealStageFromTenant, organisationPayloadFromTenant } from "@/features/crm/lib/scope";
import { isOpenDealStage } from "@/features/crm/lib/labels";

function nowIso(): string {
  return new Date().toISOString();
}

export async function syncCrmFromTenant(
  tenant: TenantCrmInput,
  opts?: {
    source?: CrmSource;
    ownerId?: string | null;
    stage?: CrmDealStage;
    createdById?: string | null;
  },
): Promise<{ organisationId: string; dealId: string }> {
  const db = getAdminDb();
  const now = nowIso();
  const stage = opts?.stage ?? dealStageFromTenant(tenant);
  const payload = organisationPayloadFromTenant(tenant);

  const { data: existing, error: lookupError } = await db
    .from("CrmOrganisation")
    .select("id")
    .eq("tenantId", tenant.id)
    .maybeSingle();
  if (lookupError) {
    throw { code: "CRM_ORG_LOOKUP_FAILED", message: lookupError.message };
  }

  let organisationId = existing?.id ? String(existing.id) : createId();

  if (existing?.id) {
    const { error } = await db
      .from("CrmOrganisation")
      .update({
        ...payload,
        updatedAt: now,
      })
      .eq("id", organisationId);
    if (error) {
      throw { code: "CRM_ORG_UPDATE_FAILED", message: error.message };
    }
  } else {
    const { error } = await db.from("CrmOrganisation").insert({
      id: organisationId,
      ...payload,
      tenantId: tenant.id,
      ownerId: opts?.ownerId ?? null,
      source: opts?.source ?? "WEBSITE",
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      throw { code: "CRM_ORG_CREATE_FAILED", message: error.message };
    }
  }

  const contactName = tenant.contactPerson?.trim() || tenant.name;
  if (tenant.contactPerson || tenant.contactEmail || tenant.contactPhone) {
    const { data: primary } = await db
      .from("CrmContact")
      .select("id")
      .eq("organisationId", organisationId)
      .eq("isPrimary", true)
      .maybeSingle();

    if (primary?.id) {
      await db
        .from("CrmContact")
        .update({
          name: contactName,
          email: tenant.contactEmail ?? null,
          phone: tenant.contactPhone ?? null,
          updatedAt: now,
        })
        .eq("id", primary.id);
    } else {
      await db.from("CrmContact").insert({
        id: createId(),
        organisationId,
        name: contactName,
        email: tenant.contactEmail ?? null,
        phone: tenant.contactPhone ?? null,
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const { data: openDeals } = await db
    .from("CrmDeal")
    .select("id, stage")
    .eq("organisationId", organisationId)
    .in("stage", ["NEW", "QUALIFIED", "DEMO", "PROPOSAL", "NEGOTIATION"]);

  const { data: anyDeal } = await db
    .from("CrmDeal")
    .select("id, stage")
    .eq("organisationId", organisationId)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  let dealId: string;
  const targetIsOpen = isOpenDealStage(stage);
  const existingOpen = (openDeals ?? [])[0];

  if (targetIsOpen && existingOpen?.id) {
    dealId = String(existingOpen.id);
    const { error } = await db
      .from("CrmDeal")
      .update({
        title: `${tenant.name} — HSEQ Nova`,
        stage,
        ownerId: opts?.ownerId === undefined ? undefined : opts.ownerId,
        updatedAt: now,
      })
      .eq("id", dealId);
    if (error) {
      throw { code: "CRM_DEAL_UPDATE_FAILED", message: error.message };
    }
  } else if (!targetIsOpen && existingOpen?.id) {
    dealId = String(existingOpen.id);
    const { error } = await db
      .from("CrmDeal")
      .update({
        title: `${tenant.name} — HSEQ Nova`,
        stage,
        ownerId: opts?.ownerId === undefined ? undefined : opts.ownerId,
        updatedAt: now,
      })
      .eq("id", dealId);
    if (error) {
      throw { code: "CRM_DEAL_UPDATE_FAILED", message: error.message };
    }
  } else if (anyDeal?.id && !targetIsOpen) {
    dealId = String(anyDeal.id);
    const { error } = await db
      .from("CrmDeal")
      .update({
        title: `${tenant.name} — HSEQ Nova`,
        stage,
        updatedAt: now,
      })
      .eq("id", dealId);
    if (error) {
      throw { code: "CRM_DEAL_UPDATE_FAILED", message: error.message };
    }
  } else {
    dealId = createId();
    const { error } = await db.from("CrmDeal").insert({
      id: dealId,
      organisationId,
      ownerId: opts?.ownerId ?? null,
      title: `${tenant.name} — HSEQ Nova`,
      valueGbp: 0,
      currency: "GBP",
      stage,
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      throw { code: "CRM_DEAL_CREATE_FAILED", message: error.message };
    }
  }

  if (opts?.createdById) {
    await db.from("CrmActivity").insert({
      id: createId(),
      organisationId,
      dealId,
      type: "NOTE",
      channel: "OTHER",
      note: `Linked to organisation ${tenant.name}`,
      createdById: opts.createdById,
      createdAt: now,
    });
  }

  return { organisationId, dealId };
}

export async function markCrmDealLostForTenant(tenantId: string, reason: string) {
  const db = getAdminDb();
  const { data: org } = await db
    .from("CrmOrganisation")
    .select("id")
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (!org?.id) {
    return;
  }
  await db
    .from("CrmDeal")
    .update({
      stage: "LOST",
      lostReason: reason,
      updatedAt: nowIso(),
    })
    .eq("organisationId", org.id)
    .in("stage", ["NEW", "QUALIFIED", "DEMO", "PROPOSAL", "NEGOTIATION"]);
}
