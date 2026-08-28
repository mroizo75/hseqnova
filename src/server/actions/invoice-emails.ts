/**
 * Email templates for invoicing and trial period
 */

export function getTrialWelcomeEmail(data: {
  companyName: string;
  trialEndsAt: Date;
  amount: number;
  plan: string;
  billingInterval: string;
  dueDate: Date;
}) {
  const isMonthly = data.billingInterval === "MONTHLY";
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #2d9c92 0%, #42c6b8 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                      🎉 Welcome to HSEQ Nova!
                    </h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Dear ${data.companyName},
                    </p>
                    
                    <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                      Your account is now active! You have a <strong>14-day free trial</strong> to explore all features in HSEQ Nova.
                    </p>

                    <div style="background: linear-gradient(135deg, #e8f6f4 0%, #d4f1ec 100%); border-left: 4px solid #2d9c92; padding: 24px; margin: 30px 0; border-radius: 8px; text-align: center;">
                      <p style="margin: 0 0 8px; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                        Your trial expires
                      </p>
                      <p style="margin: 0; color: #2d9c92; font-size: 28px; font-weight: 700;">
                        ${new Date(data.trialEndsAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <h2 style="color: #1a1a1a; font-size: 20px; margin: 30px 0 16px;">
                      What happens after the trial?
                    </h2>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9f9f9; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 12px; color: #1a1a1a;">
                            <strong>✅ Betal fakturaen</strong> innen ${new Date(data.dueDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "long",
                            })}
                          </p>
                          <p style="margin: 0 0 20px; color: #666; font-size: 14px;">
                            Din konto fortsetter uten avbrudd. Du beholder alle data og innstillinger.
                          </p>

                          <p style="margin: 0 0 12px; color: #1a1a1a;">
                            <strong>❌ Betal ikke</strong>
                          </p>
                          <p style="margin: 0; color: #666; font-size: 14px;">
                            Kontoen suspenderes automatisk dag 15. Du kan reaktivere når som helst ved å betale.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <h2 style="color: #1a1a1a; font-size: 20px; margin: 30px 0 16px;">
                      Your subscription plan
                    </h2>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9f9f9; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #666;">Plan:</span>
                              </td>
                              <td style="padding: 8px 0; text-align: right;">
                                <strong style="color: #1a1a1a;">HSEQ Nova ${data.plan}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #666;">Billing:</span>
                              </td>
                              <td style="padding: 8px 0; text-align: right;">
                                <strong style="color: #1a1a1a;">${isMonthly ? "Monthly" : "Annual"}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #666;">${isMonthly ? "Månedsbeløp" : "Årsbeløp"}:</span>
                              </td>
                              <td style="padding: 8px 0; text-align: right;">
                                <strong style="color: #2d9c92; font-size: 18px;">${data.amount.toLocaleString("en-GB")} kr</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${isMonthly ? `
                      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #1a1a1a; font-weight: 600;">
                          📅 Monthly billing
                        </p>
                        <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
                          You will receive a new invoice each month. This is handled automatically by our billing system.
                        </p>
                      </div>
                    ` : ""}

                    <div style="background: #e8f6f4; border-left: 4px solid #2d9c92; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #1a1a1a; font-weight: 600;">
                        💡 Tips: Kom i gang raskt!
                      </p>
                      <ul style="margin: 12px 0 0; padding-left: 20px; color: #666; font-size: 14px;">
                        <li style="margin-bottom: 8px;">Legg til dine ansatte</li>
                        <li style="margin-bottom: 8px;">Last opp eksisterende HMS-dokumenter</li>
                        <li style="margin-bottom: 8px;">Gjennomfør din første risikovurdering</li>
                        <li style="margin-bottom: 8px;">Utforsk vår gratis HMS-håndbok</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 40px 0 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hseqnova.com"}/dashboard" 
                         style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2d9c92 0%, #42c6b8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Log in to HSEQ Nova
                      </a>
                    </div>

                    <p style="color: #666; font-size: 14px; margin: 30px 0 0; text-align: center;">
                      Have questions?<br/>
                      📧 <a href="mailto:support@hseqnova.com" style="color: #2d9c92; text-decoration: none;">support@hseqnova.com</a> | 
                      📞 <a href="tel:+4799112916" style="color: #2d9c92; text-decoration: none;">+47 99 11 29 16</a>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px 40px; background: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      © ${new Date().getFullYear()} HSEQ Nova. All rights reserved.
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

export function getTrialExpiringEmail(data: {
  companyName: string;
  trialEndsAt: Date;
  amount: number;
  dueDate: Date;
  invoiceNumber: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 700;">
                      ⏰ Din prøveperiode utløper snart!
                    </h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                      Hei ${data.companyName},
                    </p>
                    
                    <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                      Your 14-day free trial of HSEQ Nova expires in <strong>3 days</strong>.
                    </p>

                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 24px; margin: 30px 0; border-radius: 8px; text-align: center;">
                      <p style="margin: 0 0 8px; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                        Prøveperioden utløper
                      </p>
                      <p style="margin: 0; color: #856404; font-size: 28px; font-weight: 700;">
                        ${new Date(data.trialEndsAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <h2 style="color: #1a1a1a; font-size: 20px; margin: 30px 0 16px;">
                      Hva må du gjøre?
                    </h2>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9f9f9; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 16px;">
                            <strong>Betal fakturaen for å fortsette</strong>
                          </p>
                          <p style="margin: 0 0 20px; color: #666; font-size: 14px;">
                            To continue using HSEQ Nova after the trial period, the invoice must be paid by the due date.
                          </p>

                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0; border-top: 1px solid #e0e0e0;">
                                <span style="color: #666;">Fakturanummer:</span>
                              </td>
                              <td style="padding: 8px 0; border-top: 1px solid #e0e0e0; text-align: right;">
                                <strong style="color: #1a1a1a;">${data.invoiceNumber}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #666;">Beløp:</span>
                              </td>
                              <td style="padding: 8px 0; text-align: right;">
                                <strong style="color: #2d9c92; font-size: 18px;">${data.amount.toLocaleString("en-GB")} kr</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #666;">Forfallsdato:</span>
                              </td>
                              <td style="padding: 8px 0; text-align: right;">
                                <strong style="color: #d32f2f;">${new Date(data.dueDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #1a1a1a; font-weight: 600;">
                        ⚠️ Viktig informasjon
                      </p>
                      <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
                        If the invoice is not paid by the due date, access to HSEQ Nova will be suspended automatically. 
                        All data blir bevart, og du kan reaktivere kontoen når som helst ved å betale.
                      </p>
                    </div>

                    <h2 style="color: #1a1a1a; font-size: 20px; margin: 30px 0 16px;">
                      Enjoying HSEQ Nova?
                    </h2>

                    <p style="color: #666; font-size: 14px; margin: 0 0 20px;">
                      We hope you have had a great experience with HSEQ Nova so far! If you have any questions or 
                      tilbakemeldinger, er vi alltid her for å hjelpe.
                    </p>

                    <div style="text-align: center; margin: 40px 0 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hseqnova.com"}/dashboard" 
                         style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2d9c92 0%, #42c6b8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Log in to HSEQ Nova
                      </a>
                    </div>

                    <p style="color: #666; font-size: 14px; margin: 30px 0 0; text-align: center;">
                      Payment questions?<br/>
                      📧 <a href="mailto:support@hseqnova.com" style="color: #2d9c92; text-decoration: none;">support@hseqnova.com</a> | 
                      📞 <a href="tel:+4799112916" style="color: #2d9c92; text-decoration: none;">+47 99 11 29 16</a>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px 40px; background: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      © ${new Date().getFullYear()} HSEQ Nova. All rights reserved.
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

