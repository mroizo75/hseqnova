import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/email-verification";
import { checkRateLimit, strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const identifier = `resend-verification:${ip}`;

    // Rate limit: 3 forsøk per 60 sekunder (FAIL CLOSED for sikkerhet)
    const { success } = await checkRateLimit(identifier, strictRateLimiter, { failClosed: true });
    if (!success) {
      return NextResponse.json(
        { error: "For mange forespørsler. Prøv igjen om 1 minutt." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-post er påkrevd" },
        { status: 400 }
      );
    }

    // Finn bruker
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    // SIKKERHET: Ikke avslør om bruker eksisterer eller ikke
    if (!user) {
      console.log(`[Resend Verification] User not found: ${email}`);
      return NextResponse.json({
        success: true,
        message: "Hvis e-posten finnes og ikke er verifisert, har vi sendt en ny verifikasjonslenke.",
      });
    }

    // Sjekk om bruker allerede er verifisert
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "E-postadressen er allerede verifisert.",
      });
    }

    // Opprett verification token
    const result = await createVerificationToken(user.email);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const { token, expires } = result;

    // Send email
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
    const expiresInHours = Math.round(
      (expires.getTime() - Date.now()) / (60 * 60 * 1000)
    );

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "HSEQ Nova <noreply@hseqnova.com>",
        to: user.email,
        subject: "Verify your email address - HSEQ Nova",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to HSEQ Nova!</h2>
            <p>Hi ${user.name || ""},</p>
            <p>Thank you for registering with HSEQ Nova. Click the link below to verify your email address:</p>
            <p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Verify email address
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${verifyUrl}</p>
            <p><strong>This link expires in ${expiresInHours} hours.</strong></p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              If you did not create an account with HSEQ Nova, you can ignore this email.
            </p>
            <p style="color: #666; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        `,
      });

      console.log(`[Resend Verification] Verification email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("[Resend Verification] Failed to send email:", emailError);
      // Ikke avsløre email-feil til bruker
    }

    return NextResponse.json({
      success: true,
      message: "Hvis e-posten finnes og ikke er verifisert, har vi sendt en ny verifikasjonslenke.",
    });
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      { error: "En feil oppstod. Prøv igjen senere." },
      { status: 500 }
    );
  }
}

