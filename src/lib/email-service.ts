/**
 * Email Service
 * Håndterer sending av e-poster via Resend
 */

import { Resend } from "resend";
import { getPrivilegedRoleLabel, PrivilegedRole } from "./privileged-users";
import { sendLoginDetailsEmail } from "@/lib/login-details-email";
import { sendEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "HSEQ Nova <noreply@hseqnova.co.uk>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://hseqnova.co.uk";

interface SendUserInvitationEmailParams {
  to: string;
  userName: string;
  userEmail: string;
  tempPassword: string;
  companyName: string;
  invitedByName: string;
}

interface SendPrivilegedAccessEmailParams {
  to: string;
  name: string;
  role: PrivilegedRole;
  tempPassword: string;
}

/**
 * Send invitasjonsepost til ny bruker
 */
export async function sendUserInvitationEmail({
  to,
  userName,
  userEmail,
  tempPassword,
  companyName,
  invitedByName,
}: SendUserInvitationEmailParams) {
  await sendLoginDetailsEmail({
    to,
    userName,
    userEmail,
    password: tempPassword,
    companyName,
    invitedByName,
  });
  return { success: true as const };
}

export async function sendExistingUserAddedToCompanyEmail({
  to,
  userName,
  companyName,
  invitedByName,
}: {
  to: string;
  userName: string;
  companyName: string;
  invitedByName: string;
}) {
  const loginUrl = `${BASE_URL}/login`;
  const html = `
<!DOCTYPE html>
<html lang="en-GB">
<body style="font-family: Arial, sans-serif; color: #1a1a1a;">
  <p>Hello <strong>${userName}</strong>,</p>
  <p><strong>${invitedByName}</strong> has added you to <strong>${companyName}</strong> in HSEQ Nova.</p>
  <p>Sign in with your existing password, then switch company.</p>
  <p><a href="${loginUrl}">${loginUrl}</a></p>
  <p>Kind regards,<br/>HSEQ Nova</p>
</body>
</html>`;
  await sendEmail({
    to,
    subject: `You have been added to ${companyName} in HSEQ Nova`,
    html,
  });
  return { success: true as const };
}

export async function sendPrivilegedAccessEmail({
  to,
  name,
  role,
  tempPassword,
}: SendPrivilegedAccessEmailParams) {
  const loginUrl = `${BASE_URL}/login`;
  const roleLabel = getPrivilegedRoleLabel(role);
  const html = `
<!DOCTYPE html>
<html lang="no">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Privilegert tilgang aktivert</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="background: linear-gradient(135deg, #0f172a, #0891b2); padding: 32px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Tilgang aktivert</h1>
          <p style="color: #e0f2fe; margin: 8px 0 0; font-size: 16px;">${roleLabel.toUpperCase()} · HSEQ Nova</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          <p style="font-size: 16px; color: #0f172a; margin: 0 0 16px;">Hei ${name},</p>
          <p style="font-size: 16px; color: #0f172a; margin: 0 0 16px;">
            Du har fått ${roleLabel}-tilgang til HSEQ Nova. Denne rollen gir full administrativ tilgang til alle kunder og konfigurasjoner. Del aldri disse opplysningene videre.
          </p>
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h2 style="margin: 0 0 12px; font-size: 16px; color: #0f172a;">Påloggingsinformasjon</h2>
            <p style="margin: 0; font-size: 14px; color: #475569;">
              <strong>E-post:</strong> ${to}<br />
              <strong>Midlertidig passord:</strong>
              <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code>
            </p>
          </div>
          <p style="font-size: 15px; color: #0f172a; margin: 0 0 24px;">
            Logg inn via lenken nedenfor og bytt passord umiddelbart: 
          </p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background: #0ea5e9; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Logg inn på HSEQ Nova
            </a>
          </p>
          <p style="font-size: 13px; color: #475569; margin: 24px 0 0;">
            Hvis du ikke forventet denne e-posten, kontakt sikkerhetsteamet umiddelbart på support@hseqnova.com.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `Privilegert tilgang aktivert (${roleLabel})`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { success: true, messageId: data?.id };
}

/**
 * Send velkomstepost til ny bruker som har registrert seg selv
 */
export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: "Welcome to HSEQ Nova! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${BASE_URL}/logo-nova.png" alt="HSEQ Nova" style="width: 150px; height: auto;">
            </div>
            
            <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 20px;">Welcome to HSEQ Nova!</h1>
            
            <p>Hello ${userName},</p>
            
            <p>Thank you for registering with HSEQ Nova! We are delighted to have you on board.</p>
            
            <p>You can now sign in and start using HSEQ Nova to:</p>
            <ul style="margin: 20px 0; padding-left: 20px;">
              <li>Manage health and safety documents</li>
              <li>Conduct risk assessments</li>
              <li>Report incidents</li>
              <li>Track corrective actions</li>
              <li>And much more!</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/login" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Sign in now
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6;">
              Need help? Contact us at <a href="mailto:support@hseqnova.com" style="color: #16a34a;">support@hseqnova.com</a>
            </p>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              HSEQ Nova — health, safety, environment and quality software
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Welcome email sent to ${to}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Send welcome email error:", error);
    throw error;
  }
}

/**
 * Send passord-reset epost
 */
export async function sendPasswordResetEmail(to: string, resetToken: string, userName: string) {
  try {
    const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: "Reset your password — HSEQ Nova",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${BASE_URL}/logo-nova.png" alt="HSEQ Nova" style="width: 150px; height: auto;">
            </div>
            
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 20px;">Reset your password</h1>
            
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password.</p>
            
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Reset password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you did not request this, you may safely ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              This link is valid for 1 hour.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6;">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #16a34a; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              HSEQ Nova — health, safety, environment and quality software
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Password reset email sent to ${to}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Send password reset email error:", error);
    throw error;
  }
}

export async function sendEnterpriseConnectionEmail(input: {
  to: string;
  companyName: string;
  programmeName: string;
  token: string;
}): Promise<void> {
  try {
    const acceptUrl = `${BASE_URL}/dashboard/settings/connected-organisations?token=${input.token}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: `${input.programmeName} — connection request`,
      html: `
        <p>Hello,</p>
        <p><strong>${input.programmeName}</strong> has asked to connect with <strong>${input.companyName}</strong> on HSEQ Nova.</p>
        <p>A company administrator can accept or decline this in Settings → Connected organisations.</p>
        <p><a href="${acceptUrl}">Review the request</a></p>
        <p>HSEQ Nova only shares the status you approve. Incident details and personal data stay in your company account.</p>
      `,
    });
  } catch {
    // Invitation is stored even if email delivery fails.
  }
}


