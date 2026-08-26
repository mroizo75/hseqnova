import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantSettingsForm } from "@/features/settings/components/tenant-settings-form";
import { UserProfileForm } from "@/features/settings/components/user-profile-form";
import { SubscriptionInfo } from "@/features/settings/components/subscription-info";
import { AzureAdIntegration } from "@/features/settings/components/azure-ad-integration";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { ModuleVisibilitySettings } from "@/features/settings/components/module-visibility-settings";
import { TenantLogoUpload } from "@/features/settings/components/tenant-logo-upload";
import { parseModuleVisibilityConfig } from "@/lib/module-visibility";
import {
  buildMicrosoftAdminConsentUrl,
  type MicrosoftConsentResult,
} from "@/lib/microsoft-admin-consent";
import { Building2, User, CreditCard, Cloud, Bell, Lock, Monitor } from "lucide-react";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";
import { SetupGuideToggle } from "@/features/settings/components/setup-guide-toggle";
import { TavleSettingsPane } from "@/features/hms-tavle/components/tavle-settings-pane";
import { getAuthContext } from "@/lib/server-authorization";
import {
  isAdminRole,
  loadMembership,
  loadSettingsUser,
  loadTavleSettings,
  loadTenantWithSubscription,
} from "@/server/queries/settings.queries";
import { loadEnabledBillingModuleKeys } from "@/server/queries/billing.queries";

const CONSENT_RESULTS: MicrosoftConsentResult[] = ["granted", "denied", "failed"];

function buildAdminConsentUrl(): string | null {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;

  if (!clientId || !appUrl) {
    return null;
  }

  return buildMicrosoftAdminConsentUrl({ clientId, appUrl });
}

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ consent?: string; tab?: string }>;
}) {
  const auth = await getAuthContext();
  const t = await getTranslations("dashboardSettingsPage");

  if (!auth) {
    redirect("/login");
  }

  if (!auth.permissions.canReadSettings) {
    redirect("/dashboard");
  }

  const { tenantId, userId, role } = auth;
  const isAdmin = isAdminRole(role);
  const { consent, tab } = await searchParams;

  const [tenant, user, membership, tavle, enabledModuleKeys] = await Promise.all([
    loadTenantWithSubscription(tenantId),
    loadSettingsUser(userId),
    loadMembership(userId, tenantId),
    loadTavleSettings(tenantId),
    loadEnabledBillingModuleKeys(tenantId),
  ]);

  if (!tenant || !user || !membership) {
    return <div>{t("notLinkedTenant")}</div>;
  }
  const consentResult = CONSENT_RESULTS.find((result) => result === consent) ?? null;
  const allowedTabs = [
    "company",
    "visibility",
    "profile",
    "notifications",
    "sso",
    "subscription",
    "tavle",
  ] as const;
  const requestedTab = allowedTabs.find((value) => value === tab);
  const defaultTab = consentResult ? "sso" : requestedTab ?? "company";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("header.title")}</h1>
          <p className="text-muted-foreground">
            {t("header.description")}
          </p>
        </div>
        <PageHelpDialog content={helpContent.settings} />
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex h-auto w-full min-h-11 justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="company" className="flex shrink-0 items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{t("tabs.company")}</span>
          </TabsTrigger>
          <TabsTrigger value="visibility" className="flex shrink-0 items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>{t("tabs.access")}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex shrink-0 items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t("tabs.profile")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex shrink-0 items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{t("tabs.notifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex shrink-0 items-center gap-2">
            <Cloud className="h-4 w-4" />
            <span>{t("tabs.office365")}</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex shrink-0 items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{t("tabs.subscription")}</span>
          </TabsTrigger>
          <TabsTrigger value="tavle" className="flex shrink-0 items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>{t("tabs.safetyBoard")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <TenantLogoUpload currentLogoUrl={tenant.logoUrl} isAdmin={isAdmin} />
          <TenantSettingsForm tenant={tenant} isAdmin={isAdmin} />
          <SetupGuideToggle
            tenantId={tenantId}
            currentlyHidden={tenant.setupGuideHidden ?? false}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="visibility" className="space-y-6">
          <ModuleVisibilitySettings
            initialConfig={parseModuleVisibilityConfig(tenant.moduleVisibilityConfig)}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="profile">
          <UserProfileForm user={user} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            user={user}
            userTenant={membership}
            tenant={tenant}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="sso">
          <AzureAdIntegration
            tenant={tenant}
            isAdmin={isAdmin}
            adminConsentUrl={buildAdminConsentUrl()}
            consentResult={consentResult}
          />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionInfo
            tenant={tenant}
            isAdmin={isAdmin}
            enabledModuleKeys={enabledModuleKeys}
          />
        </TabsContent>

        <TabsContent value="tavle">
          <TavleSettingsPane
            subscription={tavle.subscription}
            tavleCount={tavle.tavleCount}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
