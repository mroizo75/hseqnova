"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import type { Tenant } from "@prisma/client";
import { updateAzureAdSettings } from "@/server/actions/azure-ad.actions";
import type { MicrosoftConsentResult } from "@/lib/microsoft-admin-consent";
import { SITE_CONFIG } from "@/lib/seo-config";

const LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_CONFIG.url}/login`;

const CONSENT_FEEDBACK: Record<MicrosoftConsentResult, { className: string; message: string }> = {
  granted: {
    className: "border-green-200 bg-green-50 text-green-900",
    message:
      "HSEQ Nova is approved for this organisation. People can sign in with Microsoft without an extra consent prompt.",
  },
  denied: {
    className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    message:
      "Admin consent was cancelled. Staff may still be blocked by Microsoft. Try again while signed in as a Microsoft 365 global administrator.",
  },
  failed: {
    className: "border-red-200 bg-red-50 text-red-900",
    message: `Consent failed at Microsoft. Use a global administrator account, or email ${SITE_CONFIG.contactEmail}.`,
  },
};

interface AzureAdIntegrationProps {
  tenant: Tenant & {
    azureAdTenantId?: string | null;
    azureAdEnabled?: boolean;
    azureAdSyncEnabled?: boolean;
    azureAdLastSync?: Date | null;
    azureAdDomain?: string | null;
    azureAdAutoRole?: string | null;
  };
  isAdmin: boolean;
  adminConsentUrl: string | null;
  consentResult: MicrosoftConsentResult | null;
}

export function AzureAdIntegration({
  tenant,
  isAdmin,
  adminConsentUrl,
  consentResult,
}: AzureAdIntegrationProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(tenant.azureAdEnabled || false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "No access",
        description: "Only administrators can change Microsoft 365 sign-in",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      azureAdEnabled: enabled,
      azureAdDomain: (formData.get("azureAdDomain") as string) || undefined,
      azureAdAutoRole: (formData.get("azureAdAutoRole") as string) || undefined,
    };

    const result = await updateAzureAdSettings(data);

    if (result.success) {
      toast({
        title: enabled ? "Microsoft sign-in saved" : "Settings saved",
        description: enabled
          ? "Staff can sign in with their Microsoft 365 work accounts"
          : "Microsoft sign-in is off until you turn it on",
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not save Microsoft 365 settings",
      });
    }

    setLoading(false);
  };

  const isConfigured = Boolean(tenant.azureAdDomain && tenant.azureAdEnabled);
  const domainHint = tenant.azureAdDomain || "company.co.uk";

  return (
    <div className="space-y-6">
      {consentResult && (
        <div className={`rounded-lg border p-4 text-sm ${CONSENT_FEEDBACK[consentResult].className}`}>
          {CONSENT_FEEDBACK[consentResult].message}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Microsoft 365 sign-in</CardTitle>
                <CardDescription>
                  Let staff use their work Microsoft accounts (Azure AD / Entra ID). No extra licence.
                </CardDescription>
              </div>
            </div>
            {isConfigured ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                On
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Off
              </Badge>
            )}
          </div>
        </CardHeader>
        {tenant.azureAdLastSync ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last sync: {new Date(tenant.azureAdLastSync).toLocaleString("en-GB")}
            </p>
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-green-800">
            <li>Enter the email domain (for example company.co.uk).</li>
            <li>Choose the default role for first-time sign-in.</li>
            <li>Turn Microsoft sign-in on and save.</li>
            <li>A Microsoft 365 global administrator grants admin consent once (button below).</li>
          </ol>
          <p className="mt-3 text-xs text-green-700">
            The first Microsoft sign-in creates the HSEQ Nova user automatically. HSEQ Nova only
            reads name, email and profile of the person signing in.
          </p>
        </CardContent>
      </Card>

      {isAdmin && adminConsentUrl && (
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-base">Grant admin consent</CardTitle>
                <CardDescription>
                  Once, by a Microsoft 365 global administrator. Stops AADSTS65001 / “Need admin approval”.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Most organisations require IT to approve new apps. Without this step the first person
              to sign in with Microsoft is blocked.
            </p>
            <Button asChild variant="outline" className="bg-transparent text-foreground hover:bg-muted">
              <a href={adminConsentUrl} target="_blank" rel="noopener noreferrer">
                Approve HSEQ Nova in Microsoft 365
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              If you are not a global administrator, send this page to whoever is.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Domain and default role</CardTitle>
            <CardDescription>
              Only people whose email is on this domain can use Microsoft sign-in for this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="azureAdDomain">Work email domain *</Label>
              <Input
                id="azureAdDomain"
                name="azureAdDomain"
                placeholder="company.co.uk"
                defaultValue={tenant.azureAdDomain || ""}
                disabled={!isAdmin || loading}
                required
              />
              <p className="text-sm text-muted-foreground">
                If staff use jane@company.co.uk, enter company.co.uk (no @).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="azureAdAutoRole">Default role for first sign-in</Label>
              <Select
                name="azureAdAutoRole"
                defaultValue={tenant.azureAdAutoRole || "ANSATT"}
                disabled={!isAdmin || loading}
              >
                <SelectTrigger id="azureAdAutoRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANSATT">Employee</SelectItem>
                  <SelectItem value="LEDER">Line manager</SelectItem>
                  <SelectItem value="HMS">HSE manager</SelectItem>
                  <SelectItem value="VERNEOMBUD">Safety representative</SelectItem>
                  <SelectItem value="BHT">Occupational health</SelectItem>
                  <SelectItem value="REVISOR">Auditor</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Change roles later under Users. Do not default to Administrator.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="azureAdEnabled" className="text-base font-semibold">
                  Allow Microsoft sign-in
                </Label>
                <p className="text-sm text-muted-foreground">
                  Staff can use @{domainHint} accounts on the login page.
                </p>
              </div>
              <Switch
                id="azureAdEnabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!isAdmin || loading}
              />
            </div>

            {!isAdmin && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Only administrators can change Microsoft 365 sign-in.
              </p>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : enabled ? "Save and turn on Microsoft sign-in" : "Save settings"}
            </Button>

            {isConfigured && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Microsoft sign-in is on</p>
                    <p className="mt-1 text-green-700">
                      Staff go to{" "}
                      <a href={LOGIN_URL} className="font-semibold underline">
                        {LOGIN_URL}
                      </a>{" "}
                      and choose Sign in with Microsoft. Password sign-in still works.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="mb-1 font-medium">Do we need to register an app in Azure Portal?</p>
            <p className="text-muted-foreground">
              No. The only extra step, for most IT policies, is admin consent with the button above.
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium">Someone sees “Need admin approval” or AADSTS65001</p>
            <p className="text-muted-foreground">
              A global administrator must grant consent. After that, sign-in works for everyone on the domain.
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium">What happens on first sign-in?</p>
            <p className="text-muted-foreground">
              A HSEQ Nova user is created with the default role. You can change the role under Users.
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium">Can people still use a password?</p>
            <p className="text-muted-foreground">Yes. Microsoft sign-in is optional alongside email and password.</p>
          </div>
          <div>
            <p className="mb-1 font-medium">When someone leaves</p>
            <p className="text-muted-foreground">
              Disable them under Users. If their Microsoft 365 account is disabled, they cannot use SSO either.
            </p>
          </div>
          <p className="border-t pt-4 text-muted-foreground">
            Help: {SITE_CONFIG.contactEmail}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
