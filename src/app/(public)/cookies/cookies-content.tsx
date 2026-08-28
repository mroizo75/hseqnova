"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cookie, Shield, BarChart, Target, Settings } from "lucide-react";

export function CookiesContent() {
  const lastUpdated = "28 August 2026";

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-6">
            <Cookie className="h-3 w-3 mr-2" />
            Cookies
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Cookie Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            How HSEQ Nova uses cookies to deliver and improve our service
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cookies are small text files placed on your device when you
                visit a website. They are used to remember your preferences,
                keep you signed in, and help us understand how you use the site.
              </p>
              <p className="text-muted-foreground">
                Cookies may be set by us (first-party cookies) or by third
                parties such as analytics providers (third-party cookies). This
                policy complies with the Privacy and Electronic Communications
                Regulations 2003 (PECR) and the UK GDPR.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies Used by HSEQ Nova</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Essential */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-lg">Essential Cookies</h4>
                  <Badge variant="outline" className="ml-auto">Always on</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  These cookies are strictly necessary for the website to
                  function and cannot be switched off. They are set only in
                  response to actions you take.
                </p>

                <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                  <div className="border-b pb-2">
                    <p className="font-semibold">sb-access-token / sb-refresh-token</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Authentication</div>
                      <div><strong>Duration:</strong> Session / 7 days</div>
                      <div className="col-span-2"><strong>Description:</strong> Keeps you signed in to HSEQ Nova (Supabase Auth)</div>
                    </div>
                  </div>

                  <div className="border-b pb-2">
                    <p className="font-semibold">csrf-token</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Security</div>
                      <div><strong>Duration:</strong> Session</div>
                      <div className="col-span-2"><strong>Description:</strong> Protects against cross-site request forgery attacks</div>
                    </div>
                  </div>

                  <div className="border-b pb-2">
                    <p className="font-semibold">hseq-nova-tenant</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Multi-tenancy</div>
                      <div><strong>Duration:</strong> 30 days</div>
                      <div className="col-span-2"><strong>Description:</strong> Remembers which organisation you belong to</div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold">cookie-consent</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Consent record</div>
                      <div><strong>Duration:</strong> 12 months</div>
                      <div className="col-span-2"><strong>Description:</strong> Stores your cookie preferences</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-lg">Functional Cookies</h4>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  These cookies remember choices you make (such as theme or
                  layout) to provide a more personalised experience.
                </p>

                <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                  <div className="border-b pb-2">
                    <p className="font-semibold">user-preferences</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> User experience</div>
                      <div><strong>Duration:</strong> 12 months</div>
                      <div className="col-span-2"><strong>Description:</strong> Stores theme (dark/light) and dashboard layout</div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold">notification-settings</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Notifications</div>
                      <div><strong>Duration:</strong> 6 months</div>
                      <div className="col-span-2"><strong>Description:</strong> Remembers which notifications you wish to receive</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-lg">Analytics Cookies</h4>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  These cookies help us understand how visitors use the website
                  so that we can improve the user experience. They are only set
                  with your consent.
                </p>

                <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                  <div className="border-b pb-2">
                    <p className="font-semibold">_ga (Google Analytics)</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Analytics</div>
                      <div><strong>Duration:</strong> 2 years</div>
                      <div className="col-span-2"><strong>Description:</strong> Distinguishes unique visitors</div>
                    </div>
                  </div>

                  <div className="border-b pb-2">
                    <p className="font-semibold">_gid (Google Analytics)</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Analytics</div>
                      <div><strong>Duration:</strong> 24 hours</div>
                      <div className="col-span-2"><strong>Description:</strong> Distinguishes unique visitors</div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold">_gat (Google Analytics)</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      <div><strong>Purpose:</strong> Analytics</div>
                      <div><strong>Duration:</strong> 1 minute</div>
                      <div className="col-span-2"><strong>Description:</strong> Throttles request rate</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Note:</strong> We use Google Analytics with IP
                  anonymisation enabled. See{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google&rsquo;s privacy policy
                  </a>
                  .
                </p>
              </div>

              {/* Marketing */}
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-lg">Marketing Cookies</h4>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  These cookies are used to show you relevant adverts and
                  measure the effectiveness of marketing campaigns.
                </p>

                <div className="bg-muted/30 rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground">
                    <strong>We do not currently use marketing cookies.</strong>{" "}
                    If this changes, we will update this page and request fresh
                    consent.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Manage Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Via our consent tool</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You can change your cookie preferences at any time by clicking
                  the button below:
                </p>
                <Button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("cookie-consent");
                      window.location.reload();
                    }
                  }}
                  className="w-full md:w-auto"
                >
                  <Cookie className="mr-2 h-4 w-4" />
                  Change cookie settings
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Via your browser</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  You can also manage or delete cookies through your browser
                  settings:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold min-w-[100px]">Chrome:</span>
                    <span>Settings → Privacy and security → Cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold min-w-[100px]">Firefox:</span>
                    <span>Settings → Privacy & Security → Cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold min-w-[100px]">Safari:</span>
                    <span>Preferences → Privacy → Cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold min-w-[100px]">Edge:</span>
                    <span>Settings → Cookies and site permissions</span>
                  </li>
                </ul>

                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Note:</strong> Blocking all cookies may cause some
                  features of HSEQ Nova to stop working.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Do Not Track (DNT)</h4>
                <p className="text-sm text-muted-foreground">
                  We respect &ldquo;Do Not Track&rdquo; signals from your
                  browser. When DNT is enabled, we will not set analytics or
                  marketing cookies.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Happens If You Decline Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold">Essential cookies</p>
                    <p className="text-muted-foreground">
                      Cannot be declined. If you block these via your browser,
                      HSEQ Nova will not function.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    ⚠
                  </div>
                  <div>
                    <p className="font-semibold">Functional cookies</p>
                    <p className="text-muted-foreground">
                      If declined, the system will not remember your preferences
                      (theme, layout).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    ℹ
                  </div>
                  <div>
                    <p className="font-semibold">Analytics cookies</p>
                    <p className="text-muted-foreground">
                      If declined, we cannot improve the user experience based
                      on usage patterns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                    ℹ
                  </div>
                  <div>
                    <p className="font-semibold">Marketing cookies</p>
                    <p className="text-muted-foreground">
                      If declined, you will not see personalised adverts (we do
                      not currently use these).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                HSEQ Nova may include content from third parties that set their
                own cookies:
              </p>

              <div className="space-y-2 text-sm">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="font-semibold">Google Analytics</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Used for usage analytics.{" "}
                    <a
                      href="https://policies.google.com/technologies/cookies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Learn more →
                    </a>
                  </p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="font-semibold">Stripe</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Payment processing and fraud prevention.{" "}
                    <a
                      href="https://stripe.com/gb/cookie-settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Learn more →
                    </a>
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                We are not responsible for cookies set by third parties. Please
                refer to their privacy policies for further information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this cookie policy from time to time to reflect
                changes in technology or legislation. We encourage you to review
                this page periodically.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last updated: <strong>{lastUpdated}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For details on how we handle your personal data, see our{" "}
                <a href="/personvern" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg mb-4">Questions about cookies?</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions about how we use cookies, please
                contact us:
              </p>
              <p className="text-sm">
                <a
                  href="mailto:hello@hseqnova.co.uk"
                  className="text-primary font-semibold hover:underline"
                >
                  hello@hseqnova.co.uk
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
