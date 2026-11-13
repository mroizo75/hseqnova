import { SITE_CONFIG } from "@/lib/seo-config";
import {
  BOOK_DEMO_URL,
  SAFETY_CHECK_DISCLAIMER,
  type SafetyCheckResult,
} from "@/lib/safety-check";

const BRAND = "#2d9c92";
const INK = "#1a1a1a";
const MUTED = "#5b5b5b";

export type SafetyCheckLead = {
  name: string;
  company: string;
  email: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function safetyCheckSubject(lead: SafetyCheckLead, result: SafetyCheckResult): string {
  return `Workplace safety check (${result.score}/100) — ${lead.company}`;
}

export function safetyCheckEmailHtml(lead: SafetyCheckLead, result: SafetyCheckResult): string {
  const rows = result.answers
    .map(
      (answer, index) => `
        <tr>
          <td style="padding:12px 0;border-top:1px solid #e6e2d9;vertical-align:top;font-family:Arial,sans-serif;font-size:14px;color:${MUTED};width:28px;">${index + 1}</td>
          <td style="padding:12px 0;border-top:1px solid #e6e2d9;">
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:${INK};">${escapeHtml(answer.prompt)}</p>
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;"><strong>${escapeHtml(answer.label)}</strong></p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:${MUTED};">${escapeHtml(answer.legalHook)} · ${answer.points} / 3</p>
          </td>
        </tr>`,
    )
    .join("");

  const recommendations = result.recommendations
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;color:${INK};">${escapeHtml(item)}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workplace safety check</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e2d9;">
          <tr>
            <td style="background:${BRAND};padding:28px 32px;">
              <p style="margin:0;color:#ecfdf5;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-family:Arial,sans-serif;">HSEQ Nova</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:500;">Workplace safety check</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:${INK};font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">${escapeHtml(lead.name)} at ${escapeHtml(lead.company)} completed the free safety check.</p>
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;">Reply to <a href="mailto:${escapeHtml(lead.email)}" style="color:${BRAND};">${escapeHtml(lead.email)}</a></p>
              <p style="margin:0 0 20px;padding:16px;background:#f4f4f2;border-left:3px solid ${BRAND};font-family:Arial,sans-serif;">
                <strong>${result.score} / 100</strong> · ${escapeHtml(result.bandTitle)}<br />
                ${escapeHtml(result.industryTitle)}
              </p>
              <p style="margin:0 0 20px;">${escapeHtml(result.message)}</p>
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Suggested next steps</p>
              <ul style="margin:0 0 20px;padding-left:18px;">${recommendations}</ul>
              <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
              <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:${MUTED};">${escapeHtml(SAFETY_CHECK_DISCLAIMER)}</p>
              <p style="margin:16px 0 0;"><a href="${BOOK_DEMO_URL}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 20px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">Book a demo</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;font-family:Arial,sans-serif;font-size:13px;color:${MUTED};line-height:1.5;">
              <p style="margin:0;">${SITE_CONFIG.name} · ${SITE_CONFIG.contactPhone}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
