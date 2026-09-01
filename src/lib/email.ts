/**
 * Email utility - wrapper for email service
 * Re-exports sendEmail from email-service for compatibility
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ??
  process.env.RESEND_FROM ??
  "HSEQ Nova <hello@hseqnova.co.uk>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Generic email sender.
 * From is always the verified Resend domain. replyTo routes customer replies
 * to the salesperson's mailbox (Namecheap) without sending as that address.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Email sent to ${to}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Send email error:", error);
    throw error;
  }
}

