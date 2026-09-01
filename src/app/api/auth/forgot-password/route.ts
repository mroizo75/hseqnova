import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { createPasswordResetToken } from "@/lib/password-reset";
import { checkRateLimit, strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { validateRequestBody, createErrorResponse, ErrorCodes } from "@/lib/validations/api";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const identifier = `forgot-password:${ip}`;

    // Rate limit: 3 attempts per 60 seconds (FAIL CLOSED for security)
    const { success } = await checkRateLimit(identifier, strictRateLimiter, { failClosed: true });
    if (!success) {
      return createErrorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        "Too many requests. Please try again in 1 minute.",
        429
      );
    }

    // Validate input
    const validation = await validateRequestBody(request, forgotPasswordSchema);
    if (!validation.success) {
      return (validation as any).response;
    }

    const { email } = (validation as any).data;

    const { data: user, error: userError } = await getAdminDb()
      .from("User")
      .select("id, email, name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (userError) {
      throw { code: "USER_LOOKUP_FAILED", message: userError.message };
    }

    // SECURITY: Do not reveal whether a user exists
    // Always return success to prevent user enumeration
    if (!user) {
      console.log(`[Forgot Password] User not found: ${email}`);
      return NextResponse.json({
        success: true,
        message: "If this email address exists in our system, we have sent a reset link.",
      });
    }

    // Create reset token
    const userAgent = request.headers.get("user-agent") || undefined;
    const result = await createPasswordResetToken(user.id, ip, userAgent);

    if ("error" in result) {
      return createErrorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        result.error,
        429
      );
    }

    const { token, expires } = result;

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    const expiresInMinutes = Math.round(
      (expires.getTime() - Date.now()) / 60000
    );

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "HSEQ Nova <noreply@hseqnova.co.uk>",
        to: user.email,
        subject: "Reset password - HSEQ Nova",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset password</h2>
            <p>Dear ${user.name || ""},</p>
            <p>We received a request to reset the password for your HSEQ Nova account.</p>
            <p>Click the link below to reset your password:</p>
            <p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Reset password
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            <p><strong>This link expires in ${expiresInMinutes} minutes.</strong></p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              If you did not request a password reset, you can ignore this email.
              Your account remains secure.
            </p>
            <p style="color: #666; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
            <p style="color: #666; font-size: 12px;">
              Request from IP: ${ip}
            </p>
          </div>
        `,
      });

      console.log(`[Forgot Password] Reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("[Forgot Password] Failed to send email:", emailError);
      // Do not reveal email errors to the user
    }

    return NextResponse.json({
      success: true,
      message: "If this email address exists in our system, we have sent a reset link.",
    });
  } catch (error) {
    console.error("[Forgot Password] Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

