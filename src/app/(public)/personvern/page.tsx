import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, ExternalLink } from "lucide-react";
import {
  getCanonicalUrl,
  ROBOTS_CONFIG,
  getOpenGraphDefaults,
  getTwitterDefaults,
} from "@/lib/seo-config";

const title = "Privacy Policy | HSEQ Nova";
const description =
  "How HSEQ Nova collects, uses and protects personal data. UK GDPR and Data Protection Act 2018 compliant. Your rights, data retention, processors and how to contact us.";

export const metadata: Metadata = {
  title,
  description,
  robots: ROBOTS_CONFIG,
  alternates: {
    canonical: getCanonicalUrl("/personvern"),
  },
  openGraph: getOpenGraphDefaults(title, description, "/personvern"),
  twitter: getTwitterDefaults(title, description),
};

export default function PersonvernPage() {
  const lastUpdated = "28 August 2026";

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-6">
            <Shield className="h-3 w-3 mr-2" />
            Privacy
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            We take your privacy seriously. This policy explains how HSEQ Nova
            collects, uses and protects your personal data in accordance with
            the UK GDPR and the Data Protection Act 2018.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Data Controller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                <strong>HSEQ Nova</strong> is the data controller for the
                processing of personal data within the HSEQ Nova platform and on
                hseqnova.co.uk.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>HSEQ Nova</strong></p>
                <p>United Kingdom</p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:hello@hseqnova.co.uk" className="hover:text-primary">hello@hseqnova.co.uk</a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. What Personal Data We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">2.1 Data you provide directly</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Account information:</strong> Name, email address, job title, role</li>
                  <li><strong>Company information:</strong> Company name, registered address, Companies House number, billing address</li>
                  <li><strong>User account:</strong> Password (hashed), profile picture, assigned role</li>
                  <li><strong>Health and safety data:</strong> Risk assessments, incident reports, training records, COSHH assessments, inspection findings, documents</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.2 Data we collect automatically</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Log data:</strong> IP address, browser type, timestamps, pages visited</li>
                  <li><strong>Cookies:</strong> See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a></li>
                  <li><strong>Usage data:</strong> Features used, frequency of use, error reports</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.3 Data from third parties</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Payment provider:</strong> Payment status and billing information (via Stripe)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Legal Basis for Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We process personal data on the following legal bases under UK GDPR Article 6:
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Contract performance (Art. 6(1)(b))</h4>
                  <p className="text-sm text-muted-foreground">
                    Delivering HSEQ Nova services, managing your subscription,
                    providing access to the platform, generating documents and reports.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Legal obligation (Art. 6(1)(c))</h4>
                  <p className="text-sm text-muted-foreground">
                    Retaining invoices and financial records (Finance Act / HMRC requirements),
                    maintaining health and safety documentation as required by HSWA 1974
                    and MHSWR 1999, retaining COSHH health records (COSHH Regulations 2002).
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Consent (Art. 6(1)(a))</h4>
                  <p className="text-sm text-muted-foreground">
                    Marketing communications, newsletters, non-essential cookies
                    (analytics and marketing). You may withdraw consent at any time.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Legitimate interest (Art. 6(1)(f))</h4>
                  <p className="text-sm text-muted-foreground">
                    Improving the service, analysing usage patterns, preventing fraud
                    and misuse, providing customer support, generating anonymised
                    industry statistics and benchmarks (see section 3b below).
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-semibold">3b. Anonymised industry statistics</h4>
                  <p className="text-sm text-muted-foreground">
                    HSEQ Nova aggregates anonymised health and safety data across
                    customers to produce industry statistics, trend analyses and
                    benchmarks. Data is anonymised using k-anonymity (minimum 5
                    organisations per group) so that no individual company or person
                    can be identified. Once data is sufficiently anonymised it no
                    longer constitutes personal data (UK GDPR Recital 26).
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Purpose:</strong> Providing customers with valuable
                    insight into their performance relative to industry averages,
                    and enabling research to improve health and safety outcomes
                    across the UK.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Opt-out:</strong> You may opt your organisation out
                    at any time via Settings &gt; Statistics in the HSEQ Nova
                    dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start border-b pb-2">
                  <span className="font-semibold">User account (active)</span>
                  <span className="text-muted-foreground">While the account remains active</span>
                </div>
                <div className="flex justify-between items-start border-b pb-2">
                  <span className="font-semibold">H&S records</span>
                  <span className="text-muted-foreground">Per statutory requirements (typically 3-40 years)</span>
                </div>
                <div className="flex justify-between items-start border-b pb-2">
                  <span className="font-semibold">COSHH health records</span>
                  <span className="text-muted-foreground">40 years (COSHH Regulations 2002, reg. 11)</span>
                </div>
                <div className="flex justify-between items-start border-b pb-2">
                  <span className="font-semibold">Accident book entries</span>
                  <span className="text-muted-foreground">3 years (SS (Claims & Payments) Regs 1979)</span>
                </div>
                <div className="flex justify-between items-start border-b pb-2">
                  <span className="font-semibold">Invoices and financial data</span>
                  <span className="text-muted-foreground">6 years (HMRC requirements)</span>
                </div>
                <div className="flex justify-between items-start border-b pb-2">
                  <span className="font-semibold">Marketing consent</span>
                  <span className="text-muted-foreground">Until consent is withdrawn</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold">Analytics cookies</span>
                  <span className="text-muted-foreground">Maximum 26 months</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                After the relevant retention period, data is deleted or
                anonymised unless further retention is required by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Sharing of Personal Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We do <strong>not</strong> sell your personal data to third
                parties. We share data only with the following:
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Data processors (UK GDPR Art. 28)</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li><strong>Supabase:</strong> Database hosting (EU)</li>
                    <li><strong>Resend:</strong> Transactional email delivery</li>
                    <li><strong>Stripe:</strong> Payment processing</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    All processors operate under data processing agreements and
                    comply with UK GDPR. Where data is transferred outside the
                    UK, appropriate safeguards (UK adequacy decisions or UK
                    International Data Transfer Agreements) are in place.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Legal disclosure</h4>
                  <p className="text-sm text-muted-foreground">
                    We may disclose personal data where required by law, court
                    order or regulatory authority.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Your Rights Under the UK GDPR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You have the following rights in relation to your personal data:
              </p>

              <div className="space-y-3">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                    Right of access (Art. 15)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You may request a copy of all personal data we hold about you.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                    Right to rectification (Art. 16)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You may ask us to correct inaccurate or incomplete personal data.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                    Right to erasure (Art. 17)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You may request deletion of your personal data, subject to
                    statutory retention requirements (e.g. COSHH health records,
                    HMRC invoices).
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</span>
                    Right to restrict processing (Art. 18)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You may ask us to restrict the processing of your personal data
                    in certain circumstances.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">5</span>
                    Right to data portability (Art. 20)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You may receive your personal data in a structured,
                    commonly used, machine-readable format.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">6</span>
                    Right to object (Art. 21)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You may object to processing based on legitimate interest or
                    for direct marketing purposes.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">7</span>
                    Right to withdraw consent (Art. 7)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Where processing is based on consent, you may withdraw that
                    consent at any time without affecting the lawfulness of
                    processing carried out before withdrawal.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2">How to exercise your rights</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Send an email to{" "}
                  <a href="mailto:hello@hseqnova.co.uk" className="text-primary font-semibold hover:underline">
                    hello@hseqnova.co.uk
                  </a>{" "}
                  with the subject line &ldquo;Data Rights Request&rdquo;. We
                  will respond within one calendar month.
                </p>
                <p className="text-sm text-muted-foreground">
                  You also have the right to lodge a complaint with the{" "}
                  <strong>Information Commissioner&rsquo;s Office (ICO)</strong>{" "}
                  if you believe your data has been handled unlawfully.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <a
                    href="https://ico.org.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    ico.org.uk <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Security Measures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We implement appropriate technical and organisational measures
                to protect your personal data, including:
              </p>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Encryption:</strong> TLS for all data in transit; hashed passwords (bcrypt)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Access control:</strong> Role-based access control (RBAC) and multi-tenant data isolation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Audit logging:</strong> All critical actions are recorded with a full audit trail</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Backups:</strong> Daily backups of all data</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Patching:</strong> Regular security updates to all systems</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. Where we
                make material changes we will notify you by email or through a
                notification in the platform. We encourage you to review this
                page periodically.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last updated: <strong>{lastUpdated}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg mb-4">Contact Us</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions about how we process personal data, or
                wish to exercise your rights, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:hello@hseqnova.co.uk" className="text-primary font-semibold hover:underline">
                    hello@hseqnova.co.uk
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
