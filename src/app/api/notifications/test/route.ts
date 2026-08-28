import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { format, addDays } from "date-fns";
import { enGB } from "date-fns/locale";

const testEmailSchema = z.object({
  type: z.enum([
    "meeting",
    "inspection",
    "audit",
    "measure",
    "incident",
    "training",
    "document",
    "management-review",
  ]),
  userId: z.string(),
  tenantId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json();
    const { type, userId, tenantId } = testEmailSchema.parse(body);

    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const recipientMembership = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      select: {
        user: {
          select: {
            email: true,
            name: true,
            notifyByEmail: true,
          },
        },
      },
    });
    const recipient = recipientMembership?.user;

    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!recipient.notifyByEmail) {
      return NextResponse.json(
        { error: "This user has disabled email notifications" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    const emailData = generateTestEmail(type, recipient.name || "User", tenant.name);

    await sendEmail({
      to: recipient.email,
      subject: emailData.subject,
      html: emailData.html,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipient.email}`,
    });
  } catch (error) {
    console.error("Test email error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not send test email" },
      { status: 500 }
    );
  }
}

function generateTestEmail(
  type: string,
  userName: string,
  tenantName: string
): { subject: string; html: string } {
  const baseUrl = process.env.NEXTAUTH_URL || "https://www.hseqnova.com";
  const tomorrow = format(addDays(new Date(), 1), "EEEE d MMMM yyyy 'at' HH:mm", {
    locale: enGB,
  });

  switch (type) {
    case "meeting":
      return {
        subject: `Reminder: Meeting tomorrow — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Meeting tomorrow",
          icon: "📅",
          message: `You have a meeting scheduled for ${tomorrow}.`,
          details: [
            "Title: Workplace inspection Q1 2025",
            "Location: Meeting room 1",
            "Duration: 1 hour",
            "Attendees: 5 people",
          ],
          actionText: "View meeting details",
          actionUrl: `${baseUrl}/dashboard/meetings`,
          footerText: "Please prepare by reviewing the agenda.",
        }),
      };

    case "inspection":
      return {
        subject: `Reminder: Workplace inspection planned — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Workplace inspection planned",
          icon: "🔍",
          message: `A workplace inspection is scheduled for ${tomorrow}.`,
          details: [
            "Type: Safety inspection",
            "Area: Production hall A",
            "Responsible: HSE coordinator",
            "Status: Planned",
          ],
          actionText: "View inspection details",
          actionUrl: `${baseUrl}/dashboard/inspections`,
          footerText: "Please ensure the area is ready for inspection.",
        }),
      };

    case "audit":
      return {
        subject: `Reminder: Audit planned — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Audit planned",
          icon: "📋",
          message: "An audit is scheduled for next week.",
          details: [
            "Type: Internal audit",
            "Standard: ISO 45001",
            "Date: " + format(addDays(new Date(), 7), "d MMMM yyyy", { locale: enGB }),
            "Auditor: External auditor",
          ],
          actionText: "View audit details",
          actionUrl: `${baseUrl}/dashboard/audits`,
          footerText: "Ensure all documentation is up to date and available.",
        }),
      };

    case "measure":
      return {
        subject: `Reminder: Actions due soon — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Actions due soon",
          icon: "⚠️",
          message: "You have actions due within the next 7 days.",
          details: [
            "Number of actions: 3",
            "Due: Within 7 days",
            "Category: Preventive",
            "Priority: High",
          ],
          actionText: "View action list",
          actionUrl: `${baseUrl}/dashboard/actions`,
          footerText: "Please complete the actions before the due date.",
        }),
      };

    case "incident":
      return {
        subject: `New incident reported — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "New incident reported",
          icon: "🚨",
          message: "A new incident has been reported and requires your follow-up.",
          details: [
            "Type: Near miss",
            "Severity: Medium",
            "Area: Warehouse",
            "Status: Awaiting review",
          ],
          actionText: "View incident details",
          actionUrl: `${baseUrl}/dashboard/incidents`,
          footerText: "Please review and close the incident as soon as possible.",
        }),
      };

    case "training":
      return {
        subject: `Reminder: Training expiring soon — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Training expiring soon",
          icon: "🎓",
          message: "One or more of your training records expire soon.",
          details: [
            "Course: First aid",
            "Expires in: 30 days",
            "Last completed: " +
              format(addDays(new Date(), -335), "d MMMM yyyy", { locale: enGB }),
            "Type: Mandatory",
          ],
          actionText: "View training overview",
          actionUrl: `${baseUrl}/dashboard/training`,
          footerText: "Please renew the certificate before it expires.",
        }),
      };

    case "document":
      return {
        subject: `Document awaiting approval — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Document awaiting approval",
          icon: "📄",
          message: "One or more documents are awaiting your approval.",
          details: [
            "Number of documents: 2",
            "Type: Procedures",
            "Due date: 7 days",
            "Status: Awaiting approval",
          ],
          actionText: "Go to documents",
          actionUrl: `${baseUrl}/dashboard/documents`,
          footerText: "Please review and approve the documents.",
        }),
      };

    case "management-review":
      return {
        subject: `Reminder: Management review planned — ${tenantName}`,
        html: getEmailTemplate({
          userName,
          tenantName,
          title: "Management review planned",
          icon: "📊",
          message: "A management review is coming up soon.",
          details: [
            "Period: Q1 2025",
            "Date: " + format(addDays(new Date(), 7), "d MMMM yyyy", { locale: enGB }),
            "Attendees: Leadership team",
            "Status: Preparation",
          ],
          actionText: "Go to management review",
          actionUrl: `${baseUrl}/dashboard/management-reviews`,
          footerText: "Please prepare the report and data before the meeting.",
        }),
      };

    default:
      return {
        subject: `Notification from ${tenantName}`,
        html: `<p>You have a new notification from ${tenantName}.</p>`,
      };
  }
}

function getEmailTemplate({
  userName,
  tenantName,
  title,
  icon,
  message,
  details,
  actionText,
  actionUrl,
  footerText,
}: {
  userName: string;
  tenantName: string;
  title: string;
  icon: string;
  message: string;
  details: string[];
  actionText: string;
  actionUrl: string;
  footerText: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; font-size: 16px; color: #4b5563;">Hi ${userName},</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">${message}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px;">
                ${details.map((detail) => `<p style="margin: 4px 0; font-size: 14px; color: #6b7280;"><strong style="color: #374151;">•</strong> ${detail}</p>`).join("")}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                ${actionText}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">${footerText}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                This email was sent from <strong>${tenantName}</strong> via HSEQ Nova.
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                This is a test email to verify that the notification system works correctly.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                To change notification settings, sign in and go to <a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="color: #3b82f6; text-decoration: none;">Settings</a>.
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
}
