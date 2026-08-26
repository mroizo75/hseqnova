const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hseqnova.co.uk";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<tr><td style="padding:32px 40px 24px;text-align:center;background-color:#0d1f18;">
  <img src="${APP_URL}/logo-white.png" alt="HSEQ Nova" width="140" style="display:block;margin:0 auto;">
</td></tr>
<tr><td style="padding:32px 40px;">
${content}
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #e4e4e7;text-align:center;">
  <p style="margin:0;font-size:12px;color:#71717a;">HSEQ Nova Ltd &middot; hello@hseqnova.co.uk</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function suspensionWarning14Days(input: {
  companyName: string;
  deletionDate: string;
}): { subject: string; html: string } {
  return {
    subject: `Action required: your HSEQ Nova subscription is paused — data deletion in 14 days`,
    html: baseTemplate(`
      <h1 style="margin:0 0 16px;font-size:22px;color:#0d1f18;">Your subscription is paused</h1>
      <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Hi,
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">
        The HSEQ Nova subscription for <strong>${input.companyName}</strong> has been inactive for over 76 days.
        If no action is taken, all company data will be <strong>permanently deleted on ${input.deletionDate}</strong>.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">
        This includes all documents, incident records, training records, risk assessments, and uploaded files.
        Once deleted, this data cannot be recovered.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        To keep your data, sign in and reactivate your subscription:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr><td style="background-color:#1d7a4a;border-radius:6px;padding:12px 28px;">
          <a href="${APP_URL}/suspended" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Reactivate subscription</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#71717a;">
        If you need to export data or have questions, reply to this email or contact hello@hseqnova.co.uk.
      </p>
    `),
  };
}

export function suspensionWarning7Days(input: {
  companyName: string;
  deletionDate: string;
}): { subject: string; html: string } {
  return {
    subject: `Final warning: HSEQ Nova data for ${input.companyName} will be deleted in 7 days`,
    html: baseTemplate(`
      <h1 style="margin:0 0 16px;font-size:22px;color:#dc2626;">Final warning — 7 days until deletion</h1>
      <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">
        Hi,
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">
        This is a final reminder that all data for <strong>${input.companyName}</strong> will be
        <strong style="color:#dc2626;">permanently deleted on ${input.deletionDate}</strong>.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">
        After this date, documents, incident records, training history, risk assessments,
        and all uploaded files will be irrecoverably removed from our systems.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
        To prevent deletion, reactivate your subscription now:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr><td style="background-color:#dc2626;border-radius:6px;padding:12px 28px;">
          <a href="${APP_URL}/suspended" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Reactivate now</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#71717a;">
        Need help? Contact hello@hseqnova.co.uk immediately.
      </p>
    `),
  };
}
