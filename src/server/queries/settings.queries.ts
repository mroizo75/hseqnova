import { getAdminDb } from "@/lib/supabase/admin";
import type { Role, Subscription, Tenant, User, UserTenant } from "@prisma/client";

export type SettingsUser = Pick<
  User,
  "id" | "name" | "email" | "phone" | "preferredLocale" | "createdAt"
>;

export type ManagedTenantUser = {
  userId: string;
  role: string;
  invitationSentAt: Date | null;
  employeeNumber: string | null;
  position: string | null;
  managerId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
  };
};

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function loadTenantWithSubscription(tenantId: string): Promise<
  | (Tenant & { subscription: Subscription | null })
  | null
> {
  const db = getAdminDb();
  const [{ data: tenant }, { data: subscription }] = await Promise.all([
    db.from("Tenant").select("*").eq("id", tenantId).maybeSingle(),
    db.from("Subscription").select("*").eq("tenantId", tenantId).maybeSingle(),
  ]);
  if (!tenant) return null;
  return {
    ...(tenant as Tenant),
    subscription: (subscription as Subscription | null) ?? null,
  };
}

export async function loadSettingsUser(userId: string): Promise<SettingsUser | null> {
  const { data } = await getAdminDb()
    .from("User")
    .select("id, name, email, phone, preferredLocale, createdAt")
    .eq("id", userId)
    .maybeSingle();
  return (data as SettingsUser | null) ?? null;
}

export async function loadMembership(
  userId: string,
  tenantId: string,
): Promise<UserTenant | null> {
  const { data } = await getAdminDb()
    .from("UserTenant")
    .select("*")
    .eq("userId", userId)
    .eq("tenantId", tenantId)
    .maybeSingle();
  return (data as UserTenant | null) ?? null;
}

export async function loadTavleSettings(tenantId: string): Promise<{
  subscription: {
    plan: string;
    status: string;
    pricePerMonth: number;
    isAddon: boolean;
    endsAt: string;
    maxTavler: number;
  } | null;
  tavleCount: number;
}> {
  const db = getAdminDb();
  const [{ data: row }, { count }] = await Promise.all([
    db
      .from("HmsTavleSubscription")
      .select("plan, status, pricePerMonth, isAddon, endsAt, maxTavler")
      .eq("tenantId", tenantId)
      .maybeSingle(),
    db.from("HmsTavle").select("id", { count: "exact", head: true }).eq("tenantId", tenantId),
  ]);

  return {
    subscription: row
      ? {
          plan: row.plan as string,
          status: row.status as string,
          pricePerMonth: Number(row.pricePerMonth),
          isAddon: Boolean(row.isAddon),
          endsAt:
            typeof row.endsAt === "string"
              ? row.endsAt
              : new Date(row.endsAt as string).toISOString(),
          maxTavler: Number(row.maxTavler),
        }
      : null,
    tavleCount: count ?? 0,
  };
}

export async function loadManagedUsers(tenantId: string): Promise<ManagedTenantUser[]> {
  const { data: memberships } = await getAdminDb()
    .from("UserTenant")
    .select("userId, role, invitationSentAt, employeeNumber, position, managerId, createdAt")
    .eq("tenantId", tenantId)
    .order("createdAt", { ascending: false });

  const rows = memberships ?? [];
  if (rows.length === 0) return [];

  const userIds = rows.map((row) => row.userId as string);
  const { data: users } = await getAdminDb()
    .from("User")
    .select("id, name, email, createdAt")
    .in("id", userIds);

  const userById = new Map((users ?? []).map((user) => [user.id as string, user]));

  return rows.flatMap((row) => {
    const user = userById.get(row.userId as string);
    if (!user) return [];
    return [
      {
        userId: row.userId as string,
        role: row.role as string,
        invitationSentAt: asDate(row.invitationSentAt as string | null),
        employeeNumber: (row.employeeNumber as string | null) ?? null,
        position: (row.position as string | null) ?? null,
        managerId: (row.managerId as string | null) ?? null,
        user: {
          id: user.id as string,
          name: (user.name as string | null) ?? null,
          email: user.email as string,
          createdAt: asDate(user.createdAt as string) ?? new Date(),
        },
      },
    ];
  });
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN";
}
