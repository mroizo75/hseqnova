"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { sendUserInvitationEmail } from "@/lib/email-service";
import { sendEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/signup-checkout";

type RegistrationUser = {
  id: string;
  role: string;
  user: { name: string | null; email: string };
};

export type PendingRegistration = {
  id: string;
  name: string;
  orgNumber: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  employeeCount: number | null;
  industry: string | null;
  createdAt: string;
  onboardingStatus: string | null;
  onboardingCompletedAt: string | null;
  notes: string | null;
  pricingTier: string | null;
  trialEndsAt: string | null;
  status: string;
  salesRep: string | null;
  users: RegistrationUser[];
  subscription: { price: number; billingInterval: string } | null;
};

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

function temporaryPassword(): string {
  return `Hn-${randomBytes(6).toString("base64url")}`;
}

async function requireStaff(): Promise<{ id: string; name: string | null; email: string }> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    throw { code: "UNAUTHENTICATED", message: "Not authenticated" };
  }
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email, isSuperAdmin, isSupport")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    throw { code: "STAFF_LOOKUP_FAILED", message: error.message };
  }
  if (!data?.isSuperAdmin && !data?.isSupport) {
    throw { code: "FORBIDDEN", message: "Only support staff can manage registrations" };
  }
  return { id: String(data.id), name: (data.name as string | null) ?? null, email: String(data.email) };
}

async function loadUsersForTenants(tenantIds: string[]): Promise<Map<string, RegistrationUser[]>> {
  const grouped = new Map<string, RegistrationUser[]>();
  if (tenantIds.length === 0) return grouped;

  const { data: memberships, error } = await getAdminDb()
    .from("UserTenant")
    .select("id, tenantId, role, userId")
    .in("tenantId", tenantIds);
  if (error) {
    throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
  }

  const userIds = [...new Set((memberships ?? []).map((row) => String(row.userId)))];
  const { data: users, error: userError } =
    userIds.length > 0
      ? await getAdminDb().from("User").select("id, name, email").in("id", userIds)
      : { data: [], error: null };
  if (userError) {
    throw { code: "USER_LOOKUP_FAILED", message: userError.message };
  }
  const byId = new Map((users ?? []).map((user) => [String(user.id), user]));

  for (const row of memberships ?? []) {
    const user = byId.get(String(row.userId));
    if (!user) continue;
    const list = grouped.get(String(row.tenantId)) ?? [];
    list.push({
      id: String(row.id),
      role: String(row.role),
      user: { name: (user.name as string | null) ?? null, email: String(user.email) },
    });
    grouped.set(String(row.tenantId), list);
  }
  return grouped;
}

function asRegistration(
  row: Record<string, unknown>,
  users: RegistrationUser[],
  subscription: { price: number; billingInterval: string } | null,
): PendingRegistration {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    orgNumber: (row.orgNumber as string | null) ?? (row.companyNumber as string | null) ?? null,
    contactPerson: (row.contactPerson as string | null) ?? null,
    contactEmail: (row.contactEmail as string | null) ?? null,
    contactPhone: (row.contactPhone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    postalCode: (row.postalCode as string | null) ?? null,
    employeeCount: row.employeeCount === null || row.employeeCount === undefined ? null : Number(row.employeeCount),
    industry: (row.industry as string | null) ?? null,
    createdAt: String(row.createdAt ?? nowIso()),
    onboardingStatus: (row.onboardingStatus as string | null) ?? null,
    onboardingCompletedAt: (row.onboardingCompletedAt as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    pricingTier: (row.pricingTier as string | null) ?? null,
    trialEndsAt: (row.trialEndsAt as string | null) ?? null,
    status: String(row.status ?? "TRIAL"),
    salesRep: (row.salesRep as string | null) ?? null,
    users,
    subscription,
  };
}

export async function getPendingRegistrations(): Promise<
  { success: true; data: PendingRegistration[] } | { success: false; error: string }
> {
  try {
    await requireStaff();
    const { data, error } = await getAdminDb()
      .from("Tenant")
      .select(
        "id, name, orgNumber, companyNumber, contactPerson, contactEmail, contactPhone, address, city, postalCode, employeeCount, industry, createdAt, onboardingStatus, onboardingCompletedAt, notes, pricingTier, trialEndsAt, status, salesRep",
      )
      .neq("status", "CANCELLED")
      .in("onboardingStatus", ["NOT_STARTED", "IN_PROGRESS", "ADMIN_CREATED"])
      .order("createdAt", { ascending: false })
      .limit(100);
    if (error) {
      throw { code: "REGISTRATION_LIST_FAILED", message: error.message };
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const tenantIds = rows.map((row) => String(row.id));
    const usersByTenant = await loadUsersForTenants(tenantIds);
    const { data: subscriptions, error: subError } =
      tenantIds.length > 0
        ? await getAdminDb()
            .from("Subscription")
            .select("tenantId, price, billingInterval")
            .in("tenantId", tenantIds)
        : { data: [], error: null };
    if (subError) {
      throw { code: "SUBSCRIPTION_LOOKUP_FAILED", message: subError.message };
    }
    const subByTenant = new Map(
      (subscriptions ?? []).map((row) => [
        String(row.tenantId),
        { price: Number(row.price ?? 0), billingInterval: String(row.billingInterval ?? "MONTHLY") },
      ]),
    );

    return {
      success: true,
      data: rows.map((row) =>
        asRegistration(row, usersByTenant.get(String(row.id)) ?? [], subByTenant.get(String(row.id)) ?? null),
      ),
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load registrations") };
  }
}

export async function getRegistrationDetails(
  id: string,
): Promise<{ success: true; data: PendingRegistration } | { success: false; error: string }> {
  try {
    await requireStaff();
    const { data, error } = await getAdminDb()
      .from("Tenant")
      .select(
        "id, name, orgNumber, companyNumber, contactPerson, contactEmail, contactPhone, address, city, postalCode, employeeCount, industry, createdAt, onboardingStatus, onboardingCompletedAt, notes, pricingTier, trialEndsAt, status, salesRep",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw { code: "REGISTRATION_LOOKUP_FAILED", message: error.message };
    }
    if (!data) {
      return { success: false, error: "Registration not found" };
    }

    const usersByTenant = await loadUsersForTenants([id]);
    const { data: subscription, error: subError } = await getAdminDb()
      .from("Subscription")
      .select("tenantId, price, billingInterval")
      .eq("tenantId", id)
      .maybeSingle();
    if (subError) {
      throw { code: "SUBSCRIPTION_LOOKUP_FAILED", message: subError.message };
    }

    return {
      success: true,
      data: asRegistration(
        data as Record<string, unknown>,
        usersByTenant.get(id) ?? [],
        subscription
          ? { price: Number(subscription.price ?? 0), billingInterval: String(subscription.billingInterval ?? "MONTHLY") }
          : null,
      ),
    };
  } catch (error: unknown) {
    return { success: false, error: errorMessage(error, "Could not load the registration") };
  }
}

const activateSchema = z.object({
  tenantId: z.string().min(1),
  adminEmail: z.string().email(),
  adminName: z.string().min(2),
  adminPassword: z.string().min(8),
  notes: z.string().optional(),
});

export async function activateTenant(input: z.infer<typeof activateSchema>) {
  try {
    const staff = await requireStaff();
    const validated = activateSchema.parse(input);
    const email = validated.adminEmail.toLowerCase().trim();
    const db = getAdminDb();
    const now = nowIso();

    const { data: tenant, error: tenantError } = await db
      .from("Tenant")
      .select("id, name, status")
      .eq("id", validated.tenantId)
      .maybeSingle();
    if (tenantError) {
      throw { code: "TENANT_LOOKUP_FAILED", message: tenantError.message };
    }
    if (!tenant) {
      return { success: false as const, error: "Company not found" };
    }
    if (tenant.status === "CANCELLED") {
      return { success: false as const, error: "This registration was rejected" };
    }

    const { data: existingUser, error: userError } = await db
      .from("User")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (userError) {
      throw { code: "USER_LOOKUP_FAILED", message: userError.message };
    }

    const hashed = await bcrypt.hash(validated.adminPassword, 10);
    let userId = existingUser?.id ? String(existingUser.id) : createId();

    if (existingUser?.id) {
      const { error } = await db
        .from("User")
        .update({
          name: validated.adminName,
          password: hashed,
          emailVerified: now,
          lastTenantId: validated.tenantId,
          updatedAt: now,
        })
        .eq("id", userId);
      if (error) {
        throw { code: "USER_UPDATE_FAILED", message: error.message };
      }
    } else {
      const { error } = await db.from("User").insert({
        id: userId,
        email,
        name: validated.adminName,
        password: hashed,
        emailVerified: now,
        preferredLocale: "en-GB",
        lastTenantId: validated.tenantId,
        createdAt: now,
        updatedAt: now,
      });
      if (error) {
        throw { code: "USER_CREATE_FAILED", message: error.message };
      }
    }

    const { data: membership, error: membershipLookupError } = await db
      .from("UserTenant")
      .select("id")
      .eq("userId", userId)
      .eq("tenantId", validated.tenantId)
      .maybeSingle();
    if (membershipLookupError) {
      throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: membershipLookupError.message };
    }
    if (!membership?.id) {
      const { error } = await db.from("UserTenant").insert({
        id: createId(),
        userId,
        tenantId: validated.tenantId,
        role: "ADMIN",
        createdAt: now,
        updatedAt: now,
      });
      if (error) {
        throw { code: "MEMBERSHIP_CREATE_FAILED", message: error.message };
      }
    }

    const { error: tenantUpdateError } = await db
      .from("Tenant")
      .update({
        status: "ACTIVE",
        onboardingStatus: "ADMIN_CREATED",
        onboardingCompletedAt: now,
        contactEmail: email,
        contactPerson: validated.adminName,
        salesRep: staff.name || staff.email,
        notes: validated.notes?.trim() || null,
        updatedAt: now,
      })
      .eq("id", validated.tenantId);
    if (tenantUpdateError) {
      throw { code: "TENANT_UPDATE_FAILED", message: tenantUpdateError.message };
    }

    await sendUserInvitationEmail({
      to: email,
      userName: validated.adminName,
      userEmail: email,
      tempPassword: validated.adminPassword,
      companyName: String(tenant.name),
      invitedByName: staff.name || "HSEQ Nova",
    });

    revalidatePath("/admin/registrations");
    revalidatePath(`/admin/registrations/${validated.tenantId}`);
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not activate the company") };
  }
}

export async function rejectRegistration(tenantId: string, reason: string) {
  try {
    const staff = await requireStaff();
    const trimmed = reason.trim();
    if (!trimmed) {
      return { success: false as const, error: "A reason is required" };
    }

    const db = getAdminDb();
    const { data: tenant, error } = await db
      .from("Tenant")
      .select("id, name, contactEmail, contactPerson")
      .eq("id", tenantId)
      .maybeSingle();
    if (error) {
      throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
    }
    if (!tenant) {
      return { success: false as const, error: "Company not found" };
    }

    const now = nowIso();
    const { error: updateError } = await db
      .from("Tenant")
      .update({
        status: "CANCELLED",
        onboardingStatus: "NOT_STARTED",
        salesRep: staff.name || staff.email,
        notes: trimmed,
        updatedAt: now,
      })
      .eq("id", tenantId);
    if (updateError) {
      throw { code: "TENANT_UPDATE_FAILED", message: updateError.message };
    }

    if (tenant.contactEmail) {
      const loginUrl = `${appBaseUrl()}/register`;
      await sendEmail({
        to: String(tenant.contactEmail),
        subject: "HSEQ Nova registration",
        html: `<p>Hello ${tenant.contactPerson || ""},</p>
<p>We are unable to proceed with the HSEQ Nova registration for <strong>${tenant.name}</strong>.</p>
<p>${trimmed}</p>
<p>If you believe this is a mistake, write to hello@hseqnova.co.uk or start again at <a href="${loginUrl}">${loginUrl}</a>.</p>`,
      });
    }

    revalidatePath("/admin/registrations");
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not reject the registration") };
  }
}

export async function resendWelcomeEmail(input: { tenantId: string; userEmail: string }) {
  try {
    const staff = await requireStaff();
    const email = input.userEmail.toLowerCase().trim();
    const db = getAdminDb();

    const { data: tenant, error: tenantError } = await db
      .from("Tenant")
      .select("id, name")
      .eq("id", input.tenantId)
      .maybeSingle();
    if (tenantError) {
      throw { code: "TENANT_LOOKUP_FAILED", message: tenantError.message };
    }
    if (!tenant) {
      return { success: false as const, error: "Company not found" };
    }

    const { data: user, error: userError } = await db
      .from("User")
      .select("id, name, email")
      .eq("email", email)
      .maybeSingle();
    if (userError) {
      throw { code: "USER_LOOKUP_FAILED", message: userError.message };
    }
    if (!user) {
      return { success: false as const, error: "User not found" };
    }

    const { data: membership, error: membershipError } = await db
      .from("UserTenant")
      .select("id")
      .eq("userId", user.id)
      .eq("tenantId", input.tenantId)
      .maybeSingle();
    if (membershipError) {
      throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: membershipError.message };
    }
    if (!membership) {
      return { success: false as const, error: "That user is not on this company" };
    }

    const password = temporaryPassword();
    const hashed = await bcrypt.hash(password, 10);
    const { error: updateError } = await db
      .from("User")
      .update({ password: hashed, updatedAt: nowIso() })
      .eq("id", user.id);
    if (updateError) {
      throw { code: "USER_UPDATE_FAILED", message: updateError.message };
    }

    await sendUserInvitationEmail({
      to: email,
      userName: (user.name as string | null) || "there",
      userEmail: email,
      tempPassword: password,
      companyName: String(tenant.name),
      invitedByName: staff.name || "HSEQ Nova",
    });

    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not resend the welcome email") };
  }
}
