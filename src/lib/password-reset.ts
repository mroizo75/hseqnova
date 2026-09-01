import crypto from "crypto";
import { createId } from "@/lib/ids";
import { getAdminDb } from "@/lib/supabase/admin";

const TOKEN_EXPIRY_HOURS = 1;
const MAX_TOKENS_PER_USER_PER_DAY = 5;

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ token: string; expires: Date } | { error: string }> {
  try {
    const db = getAdminDb();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count, error: countError } = await db
      .from("PasswordResetToken")
      .select("id", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("createdAt", oneDayAgo.toISOString());

    if (countError) {
      throw { code: "RESET_TOKEN_COUNT_FAILED", message: countError.message };
    }

    if ((count ?? 0) >= MAX_TOKENS_PER_USER_PER_DAY) {
      return {
        error: "Too many reset requests. Try again in a few hours.",
      };
    }

    const token = generateResetToken();
    const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const { error: deleteError } = await db
      .from("PasswordResetToken")
      .delete()
      .eq("userId", userId)
      .eq("used", false)
      .lt("expires", new Date().toISOString());

    if (deleteError) {
      throw { code: "RESET_TOKEN_CLEANUP_FAILED", message: deleteError.message };
    }

    const { error: insertError } = await db.from("PasswordResetToken").insert({
      id: createId(),
      userId,
      token,
      expires: expires.toISOString(),
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    if (insertError) {
      throw { code: "RESET_TOKEN_CREATE_FAILED", message: insertError.message };
    }

    return { token, expires };
  } catch {
    return { error: "Could not create a reset token." };
  }
}

export async function validateResetToken(
  token: string,
): Promise<{ userId: string } | { error: string }> {
  try {
    const { data, error } = await getAdminDb()
      .from("PasswordResetToken")
      .select("userId, used, expires")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw { code: "RESET_TOKEN_LOOKUP_FAILED", message: error.message };
    }

    if (!data) {
      return { error: "Invalid or expired reset link." };
    }

    if (data.used) {
      return { error: "This reset link has already been used." };
    }

    if (new Date(data.expires) < new Date()) {
      return { error: "This reset link has expired. Request a new one." };
    }

    return { userId: data.userId };
  } catch {
    return { error: "Could not validate the reset link." };
  }
}

export async function markTokenAsUsed(token: string): Promise<void> {
  const { error } = await getAdminDb()
    .from("PasswordResetToken")
    .update({ used: true })
    .eq("token", token);

  if (error) {
    throw { code: "RESET_TOKEN_UPDATE_FAILED", message: error.message };
  }
}

export async function cleanupExpiredTokens(): Promise<number> {
  const { data, error } = await getAdminDb()
    .from("PasswordResetToken")
    .delete()
    .lt("expires", new Date().toISOString())
    .select("id");

  if (error) {
    throw { code: "RESET_TOKEN_CLEANUP_FAILED", message: error.message };
  }

  return data?.length ?? 0;
}
