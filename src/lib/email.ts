/**
 * Sends mail through Resend. The API client is created per call so the
 * key is read at send time (Next.js can evaluate this module before .env loads).
 */

import { Resend } from "resend";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

function resendApiKey(): string {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw {
      code: "EMAIL_NOT_CONFIGURED",
      message: "RESEND_API_KEY is not set. No email was sent.",
    };
  }
  return key;
}

function fromAddress(): string {
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || process.env.RESEND_FROM?.trim();
  if (!from) {
    throw {
      code: "EMAIL_FROM_MISSING",
      message: "RESEND_FROM is not set. No email was sent.",
    };
  }
  return from;
}

export async function sendEmail({ to, subject, html, replyTo, attachments }: SendEmailParams) {
  const resend = new Resend(resendApiKey());
  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });

  if (error) {
    throw {
      code: "EMAIL_SEND_FAILED",
      message: error.message || "Resend rejected the email",
    };
  }

  if (!data?.id) {
    throw {
      code: "EMAIL_NO_ID",
      message:
        "Resend did not return an email id. The API key may belong to another Resend account, or the From address is not verified.",
    };
  }

  return { success: true as const, messageId: data.id };
}
