import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail } from "lucide-react";
import {
  getCanonicalUrl,
  ROBOTS_CONFIG,
  getOpenGraphDefaults,
  getTwitterDefaults,
} from "@/lib/seo-config";

const title = "Terms of Service | HSEQ Nova";
const description =
  "Terms of service for HSEQ Nova. Pricing, payment, cancellation, liability, intellectual property and governing law for the UK HSEQ software platform.";

export const metadata: Metadata = {
  title,
  description,
  robots: ROBOTS_CONFIG,
  alternates: {
    canonical: getCanonicalUrl("/vilkar"),
  },
  openGraph: getOpenGraphDefaults(title, description, "/vilkar"),
  twitter: getTwitterDefaults(title, description),
};

export default function VilkarPage() {
  const lastUpdated = "28 August 2026";

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-6">
            <FileText className="h-3 w-3 mr-2" />
            Terms
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground">
            Terms and conditions for the use of HSEQ Nova
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Parties and Acceptance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                These terms of service (&ldquo;Terms&rdquo;) are between{" "}
                <strong>HSEQ Nova</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
                &ldquo;our&rdquo;) and the subscribing company or individual
                (&ldquo;you&rdquo;, &ldquo;your&rdquo;, &ldquo;the
                Customer&rdquo;).
              </p>
              <p className="text-muted-foreground">
                By registering for an account or using HSEQ Nova, you accept
                these Terms in full. If you do not accept the Terms, you must
                not use the service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                HSEQ Nova is a cloud-based software-as-a-service (SaaS)
                platform for health, safety, environment and quality management,
                including risk assessments, incident reporting, training records,
                COSHH assessments, workplace inspections, document management
                and related functions.
              </p>

              <div>
                <h4 className="font-semibold mb-2">2.1 What is included</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Access to the HSEQ Nova platform via a web browser</li>
                  <li>Secure cloud storage of your data</li>
                  <li>Automatic updates and improvements</li>
                  <li>Customer support via email</li>
                  <li>Unlimited users per subscribing company</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.2 What is NOT included</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Legal advice or professional HSEQ consultancy — you must obtain these from suitably qualified advisers</li>
                  <li>A guarantee that the platform meets every sector-specific regulatory requirement</li>
                  <li>A guarantee of ISO certification or compliance with any particular standard</li>
                  <li>Bespoke development or custom features unless separately agreed in writing</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.3 Continuous development</h4>
                <p className="text-sm text-muted-foreground">
                  HSEQ Nova is under continuous development. We actively work to
                  support ISO 45001, ISO 14001, ISO 9001 and other relevant
                  standards. Features may be added, changed or improved over
                  time. Descriptions on the website and in marketing material
                  may differ from the current state of the service, particularly
                  for features under development.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Pricing and Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">3.1 Subscription pricing</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  HSEQ Nova is offered on the following pricing model:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Core plan:</strong> £29 per month per company, unlimited users</li>
                  <li><strong>Add-ons:</strong> Optional industry packs and extras at additional cost</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  All prices are exclusive of UK VAT at the prevailing rate
                  (currently 20%).
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3.2 Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Payment is processed via <strong>Stripe</strong>. We accept
                  payment by debit/credit card or Bacs Direct Debit. Invoicing
                  is available on request for qualifying customers.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3.3 Late payment</h4>
                <p className="text-sm text-muted-foreground">
                  If payment is not received by the due date, we may charge
                  interest at the rate prescribed by the Late Payment of
                  Commercial Debts (Interest) Act 1998. Access to HSEQ Nova
                  may be suspended until payment is received.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3.4 Price changes</h4>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to change prices with 30 days&rsquo;
                  written notice. Existing customers will not be affected by
                  price increases until their next renewal.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Subscription and Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">4.1 Subscription term</h4>
                <p className="text-sm text-muted-foreground">
                  Subscriptions run on a monthly rolling basis and renew
                  automatically. You may cancel at any time.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4.2 Cancellation by the Customer</h4>
                <p className="text-sm text-muted-foreground">
                  You may cancel your subscription at any time by emailing{" "}
                  <a href="mailto:hello@hseqnova.co.uk" className="text-primary hover:underline">
                    hello@hseqnova.co.uk
                  </a>{" "}
                  or through your account settings. Cancellation takes effect at
                  the end of the current billing period. No refunds are given
                  for the remainder of a paid period.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4.3 Cancellation by HSEQ Nova</h4>
                <p className="text-sm text-muted-foreground">
                  We may terminate the agreement with 30 days&rsquo; notice if
                  you breach these Terms, fail to pay invoices, or if we
                  discontinue the service. If we terminate, you will receive a
                  pro-rata refund of any prepaid subscription fees.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4.4 Data after cancellation</h4>
                <p className="text-sm text-muted-foreground">
                  After cancellation you have <strong>30 days</strong> to export
                  your data. After this period, all data is deleted in
                  accordance with our{" "}
                  <a href="/personvern" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  , except where statutory retention requirements apply (e.g.
                  invoices, COSHH health records).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Customer Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">As a user you agree to:</p>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Provide accurate information at registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Keep login credentials confidential and not share them with unauthorised persons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Not use the service for unlawful activity, spam, viruses or malicious code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Not attempt to gain unauthorised access to other users&rsquo; data or the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Not upload content that infringes copyright, intellectual property or any applicable law</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Maintain your own backups of critical data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">•</span>
                  <span>Use the service in compliance with all applicable laws and regulations</span>
                </li>
              </ul>

              <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-sm font-semibold text-destructive">
                  Breach of these obligations may result in immediate suspension
                  of your account without refund.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Our Obligations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">6.1 Availability</h4>
                <p className="text-sm text-muted-foreground">
                  We aim to maintain 99% uptime (calculated monthly), excluding
                  scheduled maintenance notified at least 24 hours in advance.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">6.2 Security</h4>
                <p className="text-sm text-muted-foreground">
                  We implement appropriate technical and organisational security
                  measures to protect your data, but cannot guarantee absolute
                  security against all threats.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">6.3 Backups</h4>
                <p className="text-sm text-muted-foreground">
                  We perform daily backups of all data. We nonetheless recommend
                  that you maintain your own copies of critical documents.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">6.4 Support</h4>
                <p className="text-sm text-muted-foreground">
                  We provide customer support in English via email during normal
                  business hours (09:00–17:00, Monday to Friday, UK time). We
                  aim to respond within 2 working days.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">7.1 &ldquo;As is&rdquo; basis</h4>
                <p className="text-sm text-muted-foreground">
                  HSEQ Nova is provided &ldquo;as is&rdquo; without warranties
                  of any kind, whether express or implied, to the fullest extent
                  permitted by law. We do not warrant that the service will be
                  error-free, uninterrupted or meet all your specific
                  requirements.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">7.2 Continuous development</h4>
                <p className="text-sm text-muted-foreground">
                  Because HSEQ Nova is continuously developed to align with UK
                  legislation and international standards:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                  <li>Features, text and interface may differ from website or marketing descriptions</li>
                  <li>Features may be added, changed or removed without notice to improve the service</li>
                  <li>Terminology and document templates may be updated to reflect current law and standards</li>
                  <li>ISO support is guidance-based and does not replace professional audit assistance</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">7.3 Cap on liability</h4>
                <p className="text-sm text-muted-foreground">
                  Our total aggregate liability to you is limited to the amounts
                  you have paid for the service in the 12 months preceding the
                  claim. We are not liable for indirect, incidental or
                  consequential losses, including loss of profit or loss of data,
                  to the fullest extent permitted by law.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">7.4 Nothing in these Terms excludes liability for:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Death or personal injury caused by negligence</li>
                  <li>Fraud or fraudulent misrepresentation</li>
                  <li>Any other liability that cannot be excluded or limited by law</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">7.5 Force majeure</h4>
                <p className="text-sm text-muted-foreground">
                  We are not liable for delays or failures caused by
                  circumstances beyond our reasonable control, including natural
                  disasters, acts of war, strikes, government orders or
                  third-party network outages.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">8.1 Our rights</h4>
                <p className="text-sm text-muted-foreground">
                  HSEQ Nova — including the software, design, text, graphics,
                  logo and all other content — is protected by copyright and
                  other intellectual property rights owned by HSEQ Nova. You
                  receive a limited, non-exclusive, non-transferable licence to
                  use the service for the duration of your subscription.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">8.2 Your rights</h4>
                <p className="text-sm text-muted-foreground">
                  You retain full ownership of all data, documents and content
                  you upload to HSEQ Nova. By using the service you grant us a
                  limited licence to store, process and display that content as
                  necessary to deliver the service.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">8.3 Anonymised industry statistics</h4>
                <p className="text-sm text-muted-foreground">
                  HSEQ Nova aggregates anonymised health and safety data across
                  customers to generate industry statistics, benchmarks and
                  trend analyses. These data are used to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                  <li>Provide you with benchmarking against industry averages</li>
                  <li>Improve the service and identify sector-specific risks</li>
                  <li>Publish anonymised industry reports</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Anonymisation:</strong> All data is aggregated with
                  k-anonymity (minimum 5 organisations per industry group). No
                  individual company, person or incident can be identified.
                  Company names and personal data are never included.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Opt-out:</strong> You may opt your organisation out at
                  any time via Settings &gt; Statistics in the HSEQ Nova
                  dashboard.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">8.4 Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  If you provide feedback, suggestions or ideas for improvement,
                  we may use them freely without obligation to you.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes to These Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may update these Terms from time to time. Where we make
                material changes we will notify you by email or through a
                notification in the platform at least 30 days before the changes
                take effect.
              </p>
              <p className="text-muted-foreground">
                By continuing to use HSEQ Nova after the changes take effect,
                you accept the revised Terms. If you do not accept the changes,
                you must cancel your subscription.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Governing Law and Disputes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">10.1 Governing law</h4>
                <p className="text-sm text-muted-foreground">
                  These Terms are governed by and construed in accordance with
                  the laws of England and Wales.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">10.2 Dispute resolution</h4>
                <p className="text-sm text-muted-foreground">
                  The parties shall attempt to resolve disputes amicably. If
                  that is not possible, the dispute shall be submitted to the
                  exclusive jurisdiction of the courts of England and Wales.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">10.3 Consumer rights</h4>
                <p className="text-sm text-muted-foreground">
                  If you are a consumer (i.e. you use the service for purposes
                  outside your trade, business, craft or profession), nothing in
                  these Terms affects your statutory rights under the Consumer
                  Rights Act 2015 or any other mandatory consumer protection
                  legislation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg mb-4">Contact Us</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:hello@hseqnova.co.uk" className="text-primary font-semibold hover:underline">
                    hello@hseqnova.co.uk
                  </a>
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>HSEQ Nova</strong><br />
                  United Kingdom
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
