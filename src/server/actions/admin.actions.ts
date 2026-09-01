"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { flagsFromPlatformRole, type PlatformRole } from "@/lib/platform-access";
import { SessionUser } from "@/types";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser;

  if (!session || !user.isSuperAdmin) {
    throw new Error("Unauthorized: Superadmin required");
  }

  return user;
}

const platformRoleSchema = z.enum(["NONE", "SUPERADMIN", "SUPPORT", "SALES_MANAGER", "SALES"]);

const createAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  platformRole: platformRoleSchema.default("NONE"),
  tenantId: z.string().optional(),
  role: z.enum(["ADMIN", "HMS", "LEDER", "VERNEOMBUD", "ANSATT", "BHT", "REVISOR"]).optional(),
});

const updateAdminUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  platformRole: platformRoleSchema.optional(),
  tenantId: z.string().optional(),
  role: z.enum(["ADMIN", "HMS", "LEDER", "VERNEOMBUD", "ANSATT", "BHT", "REVISOR"]).optional(),
});

function isPlatform(role: PlatformRole) {
  return role !== "NONE";
}

export async function createAdminUser(input: z.infer<typeof createAdminUserSchema>) {
  try {
    await requireSuperAdmin();
    const validated = createAdminUserSchema.parse(input);
    const flags = flagsFromPlatformRole(validated.platformRole);
    const mustHaveTenant = !isPlatform(validated.platformRole);

    if (mustHaveTenant && (!validated.tenantId || validated.tenantId === "NONE" || !validated.role)) {
      return { success: false, error: "Organisation users must be linked to a company with a valid role" };
    }

    const normalizedEmail = validated.email.toLowerCase().trim();
    const db = getAdminDb();
    const { data: existingUser } = await db.from("User").select("id").eq("email", normalizedEmail).maybeSingle();
    if (existingUser) {
      return { success: false, error: "That email is already in use" };
    }

    if (mustHaveTenant) {
      const { data: tenantExists } = await db.from("Tenant").select("id").eq("id", validated.tenantId!).maybeSingle();
      if (!tenantExists) {
        return { success: false, error: "Organisation not found" };
      }
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const userId = createId();
    const now = new Date().toISOString();

    const { error: insertError } = await db.from("User").insert({
      id: userId,
      email: normalizedEmail,
      name: validated.name,
      password: hashedPassword,
      isSuperAdmin: flags.isSuperAdmin,
      isSupport: flags.isSupport,
      isSales: flags.isSales,
      isSalesManager: flags.isSalesManager,
      preferredLocale: "en-GB",
      createdAt: now,
      updatedAt: now,
    });
    if (insertError) {
      throw { code: "USER_CREATE_FAILED", message: insertError.message };
    }

    if (mustHaveTenant) {
      const { error: membershipError } = await db.from("UserTenant").insert({
        id: createId(),
        userId,
        tenantId: validated.tenantId!,
        role: validated.role!,
        createdAt: now,
        updatedAt: now,
      });
      if (membershipError) {
        throw { code: "MEMBERSHIP_CREATE_FAILED", message: membershipError.message };
      }
    }

    revalidatePath("/admin/users");
    return { success: true, data: { id: userId } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create the user",
    };
  }
}

export async function updateAdminUser(userId: string, input: z.infer<typeof updateAdminUserSchema>) {
  try {
    await requireSuperAdmin();
    const validated = updateAdminUserSchema.parse(input);
    const db = getAdminDb();
    const { data: existingUser } = await db
      .from("User")
      .select("id, isSuperAdmin, isSupport, isSales, isSalesManager")
      .eq("id", userId)
      .maybeSingle();
    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    const platformRole = validated.platformRole ?? "NONE";
    const flags = flagsFromPlatformRole(platformRole);
    const now = new Date().toISOString();

    if (!isPlatform(platformRole)) {
      if (!validated.tenantId || validated.tenantId === "NONE" || !validated.role) {
        return { success: false, error: "Organisation users must be linked to a company with a valid role" };
      }
    }

    const { error: updateError } = await db
      .from("User")
      .update({
        name: validated.name,
        isSuperAdmin: flags.isSuperAdmin,
        isSupport: flags.isSupport,
        isSales: flags.isSales,
        isSalesManager: flags.isSalesManager,
        updatedAt: now,
      })
      .eq("id", userId);
    if (updateError) {
      throw { code: "USER_UPDATE_FAILED", message: updateError.message };
    }

    await db.from("UserTenant").delete().eq("userId", userId);

    if (!isPlatform(platformRole) && validated.tenantId && validated.tenantId !== "NONE" && validated.role) {
      const { error: membershipError } = await db.from("UserTenant").insert({
        id: createId(),
        userId,
        tenantId: validated.tenantId,
        role: validated.role,
        createdAt: now,
        updatedAt: now,
      });
      if (membershipError) {
        throw { code: "MEMBERSHIP_CREATE_FAILED", message: membershipError.message };
      }
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: { id: userId } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update the user",
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    await requireSuperAdmin();
    const db = getAdminDb();
    const { data: user } = await db.from("User").select("id, isSuperAdmin").eq("id", userId).maybeSingle();
    if (!user) {
      return { success: false, error: "User not found" };
    }
    if (user.isSuperAdmin) {
      return { success: false, error: "Superadmin users cannot be deleted" };
    }
    const { error } = await db.from("User").delete().eq("id", userId);
    if (error) {
      throw { code: "USER_DELETE_FAILED", message: error.message };
    }
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete the user",
    };
  }
}
