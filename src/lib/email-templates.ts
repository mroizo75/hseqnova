/**
 * Email Templates for HSEQ Nova
 * 
 * Professional HTML email templates with inline styles for maximum compatibility.
 * Uses HSEQ Nova brand colours: Primary (Teal) and Accent (Green)
 */

import fs from 'fs';
import path from 'path';

function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-nova.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    return `data:image/png;base64,${base64Logo}`;
  } catch (error) {
    console.error('Failed to load logo:', error);
    return '';
  }
}

interface DocumentDeliveryEmailProps {
  companyName: string;
  email: string;
  documentId: string;
  downloadLinks: {
    register?: string;   // HSEQ-00: Document register
    handbook?: string;   // HSEQ-01: Health & safety policy
    risk?: string;       // HSEQ-02: Risk assessment
    training?: string;   // HSEQ-03: Training plan
    vernerunde?: string; // HSEQ-04: Workplace inspection checklist
    amu?: string;        // HSEQ-05: H&S committee minutes
    zip?: string;        // Complete package (ZIP)
  };
}

export function getDocumentDeliveryEmail({
  companyName,
  email,
  documentId,
  downloadLinks,
}: DocumentDeliveryEmailProps): { subject: string; html: string } {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hseqnova.co.uk";
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@hseqnova.co.uk";
  const logoBase64 = getLogoBase64();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your HSEQ document pack is ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d9c92 0%, #3db88a 100%); padding: 40px 40px 30px; text-align: center;">
              <img src="${logoBase64}" alt="HSEQ Nova" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">
                Your HSEQ document pack is ready!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello!
              </p>
              
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Thank you for using the HSEQ Nova document generator. We have prepared a tailored HSEQ document pack for <strong>${companyName}</strong>.
              </p>
              
              <!-- Download Buttons -->
              <h3 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px; font-weight: 600;">
                Download your documents:
              </h3>
              
              ${downloadLinks.zip ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${downloadLinks.zip}" style="display: inline-block; background-color: #2d9c92; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 10px;">
                      Download complete pack (ZIP)
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              <p style="color: #666; font-size: 14px; margin: 0 0 20px; text-align: center;">
                Or download individual documents:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                ${downloadLinks.register ? `
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadLinks.register}" style="display: block; background-color: #f9fafb; color: #1a1a1a; text-decoration: none; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                      HSEQ-00: Document register (.docx)
                    </a>
                  </td>
                </tr>
                ` : ""}
                ${downloadLinks.handbook ? `
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadLinks.handbook}" style="display: block; background-color: #f9fafb; color: #1a1a1a; text-decoration: none; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                      HSEQ-01: Health &amp; safety policy (.docx)
                    </a>
                  </td>
                </tr>
                ` : ""}
                ${downloadLinks.risk ? `
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadLinks.risk}" style="display: block; background-color: #f9fafb; color: #1a1a1a; text-decoration: none; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                      HSEQ-02: Risk assessment (.docx)
                    </a>
                  </td>
                </tr>
                ` : ""}
                ${downloadLinks.training ? `
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadLinks.training}" style="display: block; background-color: #f9fafb; color: #1a1a1a; text-decoration: none; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                      HSEQ-03: Training plan (.docx)
                    </a>
                  </td>
                </tr>
                ` : ""}
                ${downloadLinks.vernerunde ? `
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadLinks.vernerunde}" style="display: block; background-color: #f9fafb; color: #1a1a1a; text-decoration: none; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                      HSEQ-04: Workplace inspection checklist (.docx)
                    </a>
                  </td>
                </tr>
                ` : ""}
                ${downloadLinks.amu ? `
                <tr>
                  <td style="padding: 8px;">
                    <a href="${downloadLinks.amu}" style="display: block; background-color: #f9fafb; color: #1a1a1a; text-decoration: none; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                      HSEQ-05: H&amp;S committee minutes (.docx)
                    </a>
                  </td>
                </tr>
                ` : ""}
              </table>
              
              <!-- DOCX Info -->
              <p style="color: #3db88a; font-size: 13px; margin: 0 0 20px; padding: 12px; background-color: #f0fdf4; border-radius: 4px; text-align: center; border: 1px solid #d1fae5;">
                <strong>All documents are editable Word files (.docx)</strong> — open in Microsoft Word, Google Docs, or LibreOffice and customise to your needs!
              </p>
              
              <!-- Expiration Warning -->
              <p style="color: #dc2626; font-size: 13px; margin: 0 0 30px; padding: 12px; background-color: #fef2f2; border-radius: 4px; text-align: center; border: 1px solid #fee2e2;">
                Important: Download links are valid for <strong>7 days</strong>. Please download your documents now!
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #3db88a; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 10px; font-weight: 600;">
                      Ready for more?
                    </h3>
                    <p style="color: #666; font-size: 14px; margin: 0 0 15px; line-height: 1.6;">
                      This is just the beginning! With HSEQ Nova you get a complete, living HSEQ system including:
                    </p>
                    <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Digital signatures</li>
                      <li>Automatic reminders</li>
                      <li>Incident reporting with 5-Whys analysis</li>
                      <li>Training module with competence matrix</li>
                      <li>Mobile app for workplace inspections</li>
                      <li>ISO 9001 compliance on autopilot</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}/registrer-bedrift" style="display: inline-block; background-color: #3db88a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Register your organisation — 14-day free trial
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 30px 0 0;">
                Have a question? Get in touch with us at<br/>
                <a href="mailto:${supportEmail}" style="color: #2d9c92; text-decoration: none;">${supportEmail}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px; line-height: 1.5;">
                HSEQ Nova — The UK's most intuitive HSEQ system<br/>
                ISO 9001 compliance on autopilot
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${dashboardUrl}" style="color: #2d9c92; text-decoration: none; margin: 0 8px;">hseqnova.co.uk</a> |
                <a href="${dashboardUrl}/priser" style="color: #2d9c92; text-decoration: none; margin: 0 8px;">Pricing</a> |
                <a href="${dashboardUrl}/hva-er-hms-nova" style="color: #2d9c92; text-decoration: none; margin: 0 8px;">About us</a>
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
  
  return {
    subject: `Your HSEQ document pack is ready!`,
    html,
  };
}

interface CustomerWelcomeEmailProps {
  contactPerson: string;
  companyName: string;
  orgNumber: string;
  employeeCount: string;
  pricingTier: string;
  yearlyPrice: number;
}

export function getCustomerWelcomeEmail({
  contactPerson,
  companyName,
  orgNumber,
  employeeCount,
  pricingTier,
  yearlyPrice,
}: CustomerWelcomeEmailProps): string {
  const logoBase64 = getLogoBase64();
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hseqnova.co.uk";
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@hseqnova.co.uk";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HSEQ Nova</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d9c92 0%, #3db88a 100%); padding: 40px 40px 30px; text-align: center;">
              <img src="${logoBase64}" alt="HSEQ Nova" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">
                Welcome to HSEQ Nova!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello <strong>${contactPerson}</strong>,
              </p>
              
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Thank you for choosing HSEQ Nova! We have received your registration and are setting up your account.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #3db88a; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 15px; font-weight: 600;">
                      Your registration
                    </h3>
                    <table cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #666; padding: 4px 0; width: 40%;">Organisation:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${companyName}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Company number:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${orgNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Number of employees:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${employeeCount}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Annual price:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">\u00A3${yearlyPrice.toLocaleString('en-GB')} (excl. VAT)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <h3 style="color: #1a1a1a; font-size: 18px; margin: 30px 0 15px; font-weight: 600;">
                What happens next?
              </h3>
              
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; padding-right: 15px; width: 30px;">
                    <div style="background-color: #2d9c92; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</div>
                  </td>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">We set up your account</strong>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                      We configure the system with a ready-made health &amp; safety policy and all the modules you need.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding-right: 15px;">
                    <div style="background-color: #2d9c92; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</div>
                  </td>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">You receive your login details</strong>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                      Within 24 hours we will send you a link to set your password and sign in.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding-right: 15px;">
                    <div style="background-color: #2d9c92; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">3</div>
                  </td>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1a1a1a; font-size: 15px;">Personal onboarding call</strong>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                      We will get in touch for a brief walkthrough of the system (15–30 min).
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding-right: 15px;">
                    <div style="background-color: #3db88a; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">&#10003;</div>
                  </td>
                  <td>
                    <strong style="color: #1a1a1a; font-size: 15px;">You're all set!</strong>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                      Your 14-day free trial begins when you first sign in.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}/registrer-bedrift" style="display: inline-block; background-color: #2d9c92; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Register your organisation while you wait
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Contact Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-top: 30px;">
                <tr>
                  <td>
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                      Have a question in the meantime?
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
                      <a href="mailto:${supportEmail}" style="color: #2d9c92; text-decoration: none;">${supportEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">
                Kind regards,<br/>
                <strong>The HSEQ Nova Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px; line-height: 1.5;">
                HSEQ Nova — The UK's most intuitive HSEQ system<br/>
                ISO 9001 compliance on autopilot
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${dashboardUrl}" style="color: #2d9c92; text-decoration: none; margin: 0 8px;">Visit hseqnova.co.uk</a> |
                <a href="${dashboardUrl}/priser" style="color: #2d9c92; text-decoration: none; margin: 0 8px;">Pricing</a> |
                <a href="${dashboardUrl}/hva-er-hms-nova" style="color: #2d9c92; text-decoration: none; margin: 0 8px;">About us</a>
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

interface AdminNotificationEmailProps {
  companyName: string;
  orgNumber: string;
  employeeCount: string;
  industry: string;
  pricingTier: string;
  yearlyPrice: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  useEHF: boolean;
  invoiceEmail?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  notes?: string;
  tenantId: string;
}

export function getAdminNotificationEmail({
  companyName,
  orgNumber,
  employeeCount,
  industry,
  pricingTier,
  yearlyPrice,
  contactPerson,
  contactEmail,
  contactPhone,
  useEHF,
  invoiceEmail,
  address,
  postalCode,
  city,
  notes,
  tenantId,
}: AdminNotificationEmailProps): string {
  const logoBase64 = getLogoBase64();
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hseqnova.co.uk"}/admin/tenants`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New registration — ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px 40px; text-align: center;">
              <img src="${logoBase64}" alt="HSEQ Nova" style="max-width: 150px; height: auto; margin-bottom: 15px;" />
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">
                New organisation registration
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Organisation details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #3db88a; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 15px; font-weight: 600;">
                      Organisation details
                    </h3>
                    <table cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #666; padding: 4px 0; width: 40%;">Organisation name:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 600;">${companyName}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Company number:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${orgNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Number of employees:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${employeeCount}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Industry:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${industry}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Pricing tier:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 600;">${pricingTier} (\u00A3${yearlyPrice.toLocaleString('en-GB')}/yr)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Contact person -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #2d9c92; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 15px; font-weight: 600;">
                      Contact person
                    </h3>
                    <table cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #666; padding: 4px 0; width: 40%;">Name:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 600;">${contactPerson}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Email:</td>
                        <td style="color: #1a1a1a; padding: 4px 0;"><a href="mailto:${contactEmail}" style="color: #2d9c92; text-decoration: none;">${contactEmail}</a></td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Phone:</td>
                        <td style="color: #1a1a1a; padding: 4px 0;"><a href="tel:${contactPhone}" style="color: #2d9c92; text-decoration: none;">${contactPhone}</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Billing details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 15px; font-weight: 600;">
                      Billing details
                    </h3>
                    <table cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #666; padding: 4px 0; width: 40%;">E-invoicing:</td>
                        <td style="color: #1a1a1a; padding: 4px 0; font-weight: 500;">${useEHF ? "Yes" : "No"}</td>
                      </tr>
                      ${invoiceEmail ? `
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Invoice email:</td>
                        <td style="color: #1a1a1a; padding: 4px 0;"><a href="mailto:${invoiceEmail}" style="color: #2d9c92; text-decoration: none;">${invoiceEmail}</a></td>
                      </tr>
                      ` : ""}
                      ${!useEHF && address ? `
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Address:</td>
                        <td style="color: #1a1a1a; padding: 4px 0;">${address}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">Postcode:</td>
                        <td style="color: #1a1a1a; padding: 4px 0;">${postalCode}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; padding: 4px 0;">City:</td>
                        <td style="color: #1a1a1a; padding: 4px 0;">${city}</td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              
              ${notes ? `
              <!-- Customer note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 10px; font-weight: 600;">
                      Customer note
                    </h3>
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic;">
                      "${notes}"
                    </p>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display: inline-block; background-color: #2d9c92; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Go to Admin panel
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666; font-size: 12px; text-align: center; margin: 20px 0 0;">
                Tenant ID: <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${tenantId}</code>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                HSEQ Nova Admin Notification
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
