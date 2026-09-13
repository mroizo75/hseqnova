import { SITE_CONFIG } from "@/lib/seo-config";
import { formatDemoRange, getDemoHost } from "@/lib/demo-booking";

const BRAND = "#2d9c92";
const INK = "#1a1a1a";
const MUTED = "#5b5b5b";

function layout(title: string, body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_CONFIG.url;
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e2d9;">
          <tr>
            <td style="background:${BRAND};padding:28px 32px;">
              <p style="margin:0;color:#ecfdf5;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-family:Arial,sans-serif;">HSEQ Nova</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:500;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:${INK};font-size:16px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;font-family:Arial,sans-serif;font-size:13px;color:${MUTED};line-height:1.5;">
              <p style="margin:0;">${SITE_CONFIG.name} · ${SITE_CONFIG.contactPhone} · <a href="mailto:${SITE_CONFIG.contactEmail}" style="color:${BRAND};">${SITE_CONFIG.contactEmail}</a></p>
              <p style="margin:8px 0 0;"><a href="${appUrl}" style="color:${BRAND};">${appUrl.replace(/^https?:\/\//, "")}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 20px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;margin:4px 8px 4px 0;">${label}</a>`;
}

export function demoGuestConfirmationHtml(input: {
  name: string;
  startAt: Date;
  endAt: Date;
  manageUrl: string;
  googleUrl: string;
  outlookUrl: string;
}): string {
  const host = getDemoHost();
  const when = formatDemoRange(input.startAt, input.endAt);
  return layout(
    "Your demo is booked",
    `
      <p style="margin:0 0 16px;">Hello ${escapeHtml(input.name)},</p>
      <p style="margin:0 0 16px;">Your 30-minute HSEQ Nova demo with ${escapeHtml(host.name)} is confirmed.</p>
      <p style="margin:0 0 20px;padding:16px;background:#f4f4f2;border-left:3px solid ${BRAND};font-family:Arial,sans-serif;"><strong>${escapeHtml(when)}</strong></p>
      <p style="margin:0 0 16px;">Add it to your own calendar so the time is held:</p>
      <p style="margin:0 0 20px;">${button(input.googleUrl, "Google Calendar")}${button(input.outlookUrl, "Outlook")}</p>
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:${MUTED};">An ICS file is attached. Open it to add the meeting to Apple Calendar or any other calendar app.</p>
      ${host.meetingUrl ? `<p style="margin:0 0 16px;">Join the call: <a href="${escapeHtml(host.meetingUrl)}" style="color:${BRAND};">${escapeHtml(host.meetingUrl)}</a></p>` : `<p style="margin:0 0 16px;">This is a video call. ${escapeHtml(host.name)} will send a Teams or Meet link before the meeting if it is not already in the invite.</p>`}
      <p style="margin:0 0 16px;">Need to change the time? ${button(input.manageUrl, "Reschedule or cancel")}</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:${MUTED};">Questions: ${SITE_CONFIG.contactPhone} or ${SITE_CONFIG.contactEmail}.</p>
    `,
  );
}

export function demoHostNotificationHtml(input: {
  name: string;
  email: string;
  phone: string | null;
  company: string;
  jobTitle: string | null;
  notes: string | null;
  startAt: Date;
  endAt: Date;
  crmUrl?: string;
}): string {
  const when = formatDemoRange(input.startAt, input.endAt);
  return layout(
    "New demo booked",
    `
      <p style="margin:0 0 16px;">A demo is in the calendar.</p>
      <p style="margin:0 0 20px;padding:16px;background:#f4f4f2;border-left:3px solid ${BRAND};font-family:Arial,sans-serif;"><strong>${escapeHtml(when)}</strong></p>
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;"><strong>${escapeHtml(input.name)}</strong> · ${escapeHtml(input.company)}</p>
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(input.email)}${input.phone ? ` · ${escapeHtml(input.phone)}` : ""}</p>
      ${input.jobTitle ? `<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;">Role: ${escapeHtml(input.jobTitle)}</p>` : ""}
      ${input.notes ? `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:14px;">Notes: ${escapeHtml(input.notes)}</p>` : ""}
      ${input.crmUrl ? `<p style="margin:20px 0 0;">${button(input.crmUrl, "Open in CRM")}</p>` : ""}
    `,
  );
}

export function demoCancelledHtml(input: {
  name: string;
  startAt: Date;
  endAt: Date;
  forHost: boolean;
}): string {
  const when = formatDemoRange(input.startAt, input.endAt);
  if (input.forHost) {
    return layout(
      "Demo cancelled",
      `<p style="margin:0 0 16px;">${escapeHtml(input.name)} cancelled the demo booked for <strong>${escapeHtml(when)}</strong>.</p>`,
    );
  }
  return layout(
    "Demo cancelled",
    `
      <p style="margin:0 0 16px;">Hello ${escapeHtml(input.name)},</p>
      <p style="margin:0 0 16px;">Your HSEQ Nova demo on <strong>${escapeHtml(when)}</strong> has been cancelled.</p>
      <p style="margin:0;">Book again any time at <a href="${SITE_CONFIG.url}/book-a-demo" style="color:${BRAND};">${SITE_CONFIG.url.replace(/^https?:\/\//, "")}/book-a-demo</a>, or call ${SITE_CONFIG.contactPhone}.</p>
    `,
  );
}

export function demoRescheduledHtml(input: {
  name: string;
  startAt: Date;
  endAt: Date;
  manageUrl: string;
  googleUrl: string;
  outlookUrl: string;
}): string {
  const host = getDemoHost();
  const when = formatDemoRange(input.startAt, input.endAt);
  return layout(
    "Demo time updated",
    `
      <p style="margin:0 0 16px;">Hello ${escapeHtml(input.name)},</p>
      <p style="margin:0 0 16px;">Your demo with ${escapeHtml(host.name)} is now:</p>
      <p style="margin:0 0 20px;padding:16px;background:#f4f4f2;border-left:3px solid ${BRAND};font-family:Arial,sans-serif;"><strong>${escapeHtml(when)}</strong></p>
      <p style="margin:0 0 16px;">Update your calendar:</p>
      <p style="margin:0 0 20px;">${button(input.googleUrl, "Google Calendar")}${button(input.outlookUrl, "Outlook")}</p>
      <p style="margin:0;">${button(input.manageUrl, "Manage booking")}</p>
    `,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
