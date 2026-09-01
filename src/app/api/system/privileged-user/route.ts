import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { sendPrivilegedAccessEmail } from "@/lib/email-service";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  validateRequestBody,
} from "@/lib/validations/api";
import { generateSecurePassword } from "@/lib/privileged-users";
import { flagsFromPlatformRole } from "@/lib/platform-access";

const privilegedUserSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(12).max(128).optional(),
  role: z.enum(["SUPERADMIN", "SUPPORT", "SALES_MANAGER", "SALES"]),
});

function extractBootstrapToken(request: NextRequest) {
  const directHeader =
    request.headers.get("x-bootstrap-token") || request.headers.get("x-static-access-token");

  if (directHeader) {
    return directHeader.trim();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export async function POST(request: NextRequest) {
  const configuredToken = process.env.SYSTEM_BOOTSTRAP_TOKEN;

  if (!configuredToken) {
    return createErrorResponse(
      ErrorCodes.SERVICE_UNAVAILABLE,
      "Bootstrap token is not configured on the server.",
      503,
    );
  }

  const providedToken = extractBootstrapToken(request);
  if (!providedToken || providedToken !== configuredToken) {
    return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Invalid bootstrap token", 401);
  }

  const validation = await validateRequestBody(request, privilegedUserSchema);
  if ("response" in validation) {
    return validation.response;
  }

  const { email, name, password, role } = validation.data;
  const db = getAdminDb();
  const now = new Date().toISOString();

  const { data: existingUser, error: lookupError } = await db
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, lookupError.message, 500);
  }
  if (existingUser) {
    return createErrorResponse(ErrorCodes.ALREADY_EXISTS, "User already exists", 409);
  }

  const plainPassword = password ?? generateSecurePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const flags = flagsFromPlatformRole(role);
  const userId = createId();

  const { error: insertError } = await db.from("User").insert({
    id: userId,
    email,
    name,
    password: hashedPassword,
    isSuperAdmin: flags.isSuperAdmin,
    isSupport: flags.isSupport,
    isSales: flags.isSales,
    isSalesManager: flags.isSalesManager,
    emailVerified: now,
    preferredLocale: "en-GB",
    createdAt: now,
    updatedAt: now,
  });
  if (insertError) {
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, insertError.message, 500);
  }

  try {
    await sendPrivilegedAccessEmail({
      to: email,
      name,
      role,
      tempPassword: plainPassword,
    });
  } catch (error) {
    await db.from("User").delete().eq("id", userId);
    return createErrorResponse(
      ErrorCodes.EMAIL_SEND_FAILED,
      "Could not send the confirmation email. The user was not created.",
      502,
      error instanceof Error ? error.message : undefined,
    );
  }

  return createSuccessResponse(
    {
      id: userId,
      email,
      role,
      tempPassword: plainPassword,
    },
    `Privileged user ${email} created`,
  );
}
