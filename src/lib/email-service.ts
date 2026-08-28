/**
 * Email Service
 * Håndterer sending av e-poster via Resend
 */

import { Resend } from "resend";
import { getPrivilegedRoleLabel, PrivilegedRole } from "./privileged-users";

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
  try {
    const loginUrl = `${BASE_URL}/login`;
    const logoUrl = `${BASE_URL}/logo-nova.png`;

    const html = `
<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You have been invited to HSEQ Nova</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2d9c92 0%, #3db88a 100%); padding: 40px 40px 30px; text-align: center;">
              <img src="${logoUrl}" alt="HSEQ Nova" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">
                Welcome to HSEQ Nova
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>${invitedByName}</strong> at <strong>${companyName}</strong> has invited you to HSEQ Nova.
              </p>
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                This is the company’s health, safety, environment and quality system: accident book, health and safety policy, inspections, training and related records.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #3db88a; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 15px; font-weight: 600;">
                      Sign-in details
                    </h3>
                    <table cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #666; padding: 4px 0; width: 40%;">Email</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 600;">${userEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Temporary password</td>
                        <td style="color: #1a1a1a; padding: 4px 0;">
                          <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: 600;">${tempPassword}</code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background-color: #3db88a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Sign in
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">
                Or paste this link into your browser:<br/>
                <a href="${loginUrl}" style="color: #2d9c92; text-decoration: none;">${loginUrl}</a>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 10px; font-weight: 600;">
                      Change your password
                    </h3>
                    <p style="color: #666; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                      After you sign in, go to <strong>Settings → Profile</strong> and set a password of your own.
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
                      If you were not expecting this invitation, tell your company administrator.
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-top: 30px;">
                <tr>
                  <td>
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                      Need help?
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
                      <a href="mailto:hello@hseqnova.co.uk" style="color: #2d9c92; text-decoration: none;">hello@hseqnova.co.uk</a>
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">
                Kind regards,<br/>
                <strong>HSEQ Nova</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px; line-height: 1.5;">
                HSEQ Nova — health, safety, environment and quality software for the UK
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${BASE_URL}" style="color: #2d9c92; text-decoration: none;">hseqnova.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `You have been invited to HSEQ Nova — ${companyName}`,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Invitation email sent to ${to}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Send invitation email error:", error);
    throw error;
  }
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

