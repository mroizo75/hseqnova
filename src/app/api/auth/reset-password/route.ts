import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { validateResetToken, markTokenAsUsed } from "@/lib/password-reset";
import { checkRateLimit, apiRateLimiter, getClientIp } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { validateRequestBody, createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validations/api";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Reset password med token
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const identifier = `reset-password:${ip}`;

    // Rate limit (FAIL CLOSED for sikkerhet)
    const { success } = await checkRateLimit(identifier, apiRateLimiter, { failClosed: true });
    if (!success) {
      return createErrorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        "Too many requests. Please try again later.",
        429
      );
    }

    // Valider input
    const validation = await validateRequestBody(request, resetPasswordSchema);
    if (!validation.success) {
      return (validation as any).response;
    }

    const { token, password } = (validation as any).data;

    // Valider token
    const tokenValidation = await validateResetToken(token);
    if ("error" in tokenValidation) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        tokenValidation.error,
        400
      );
    }

    const { userId } = tokenValidation;

    // Hash nytt passord
    const hashedPassword = await bcrypt.hash(password, 12);

    const db = getAdminDb();
    const stamp = new Date().toISOString();
    const { error: updateError } = await db
      .from("User")
      .update({
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: stamp,
      })
      .eq("id", userId);

    if (updateError) {
      throw { code: "PASSWORD_UPDATE_FAILED", message: updateError.message };
    }

    await markTokenAsUsed(token);

    await db.from("Session").delete().eq("userId", userId);

    return createSuccessResponse(
      undefined,
      "Your password has been reset. You can now sign in with the new password."
    );
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "An error occurred. Please try again later.",
      500
    );
  }
}

