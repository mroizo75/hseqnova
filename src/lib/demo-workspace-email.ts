import { sendEmail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/seo-config";
import { appBaseUrl } from "@/lib/signup-checkout";

const BRAND = "#2d9c92";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendDemoWorkspaceWelcomeEmail(input: {
  to: string;
  contactName: string;
  companyName: string;
  password: string;
  demoDays: number;
  endsAt: Date;
  packNames: string[];
}): Promise<{ messageId: string }> {
  const loginUrl = `${appBaseUrl()}/login`;
  const endsLabel = input.endsAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const packs = input.packNames.map(escapeHtml).join(", ");
  const name = escapeHtml(input.contactName);
  const company = escapeHtml(input.companyName);
  const email = escapeHtml(input.to);
  const password = escapeHtml(input.password);

  const sent = await sendEmail({
    to: input.to,
    subject: `Your ${input.demoDays}-day HSEQ Nova demo — sign-in details`,
    replyTo: `${SITE_CONFIG.contactName} <${SITE_CONFIG.contactEmail}>`,
    html: `<!DOCTYPE html>
<html lang="en-GB">
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f4f4f2;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e2d9;">
          <tr>
            <td style="background:${BRAND};padding:28px 32px;">
              <p style="margin:0;color:#ecfdf5;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">HSEQ Nova</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:500;">Your demo workspace is ready</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1a1a1a;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Hello ${name},</p>
              <p style="margin:0 0 16px;">You have <strong>${input.demoDays} days</strong> of demo access to HSEQ Nova for <strong>${company}</strong>. Access ends on <strong>${endsLabel}</strong>.</p>
              <p style="margin:0 0 16px;">Included in this demo: ${packs}.</p>
              <p style="margin:0 0 8px;font-weight:600;">Sign in</p>
              <p style="margin:0 0 8px;">URL: <a href="${loginUrl}" style="color:${BRAND};">${loginUrl}</a></p>
              <p style="margin:0 0 8px;">Email: <strong>${email}</strong></p>
              <p style="margin:0 0 20px;">Temporary password: <code style="background:#f4f4f2;padding:4px 8px;font-size:15px;">${password}</code></p>
              <p style="margin:0 0 20px;">
                <a href="${loginUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:600;">Sign in</a>
              </p>
              <p style="margin:0 0 16px;">Change the password after your first sign-in (Settings → Profile). If you want to keep the workspace, subscribe before the demo ends. Stripe will then bill Core plus the add-ons you choose.</p>
              <p style="margin:0;">Questions: ${SITE_CONFIG.contactPhone} or <a href="mailto:${SITE_CONFIG.contactEmail}" style="color:${BRAND};">${SITE_CONFIG.contactEmail}</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
  return { messageId: sent.messageId };
}
