import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { DashboardNav } from "@/components/dashboard-nav";
import { MobileNav } from "@/components/mobile-nav";
import { TavleNav, TavleMobileNav } from "@/components/tavle-nav";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { Toaster } from "@/components/ui/toaster";
import { SessionUser } from "@/types";
import { DashboardProviders } from "@/components/dashboard-providers";
import { OfflineSyncBannerWrapper } from "@/components/offline-sync-banner-wrapper";
import { needsPaymentGate } from "@/lib/signup-checkout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as SessionUser;
  const sessionUser = session.user;
  if (user.isSuperAdmin || user.isSupport) {
    redirect("/admin");
  }

  if (user.role === "ANSATT") {
    redirect("/ansatt");
  }

  const tenantId = user.tenantId ?? null;
  let isTavleOnly = false;

  if (tenantId) {
    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("isTavleOnly, onboardingStatus, stripeSubscriptionId")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant && needsPaymentGate(tenant)) {
      redirect("/register?pay=1");
    }
    isTavleOnly = Boolean(tenant?.isTavleOnly);
  }

  // isTavleOnly-kunder: minimal layout uten full HMS Nova-meny
  if (isTavleOnly) {
    return (
      <div className="flex min-h-dvh flex-col overflow-hidden bg-gray-50 lg:flex-row">
        <TavleMobileNav tenantName={sessionUser.tenantName ?? null} />
        <TavleNav tenantName={sessionUser.tenantName ?? null} />
        <main className="min-w-0 flex-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-8">
          <div className="min-w-0 w-full">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <DashboardProviders>
      <div className="flex min-h-dvh flex-col overflow-hidden lg:flex-row">
        <MobileNav />
        <DashboardNav />
        <main className="min-w-0 flex-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-8">
          <div className="min-w-0 w-full">
            <AppBreadcrumbs />
            <OfflineSyncBannerWrapper />
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </DashboardProviders>
  );
}
