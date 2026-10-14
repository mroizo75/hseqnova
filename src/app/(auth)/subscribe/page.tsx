import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { isDemoAccessExpired, isDemoRegistration } from "@/lib/demo-access";
import { ADDON_PACKS, isAddonPackActive, type AddonPackId } from "@/lib/billing-catalog";
import { loadEnabledBillingModuleKeys } from "@/server/queries/billing.queries";
import { SubscribeForm } from "@/features/signup/components/subscribe-form";
import { SessionUser } from "@/types";

export const metadata = {
  title: "Subscribe | HSEQ Nova",
};

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const user = session.user as SessionUser;
  if (user.isSuperAdmin || user.isSupport || user.isSales || user.isSalesManager) {
    redirect("/admin");
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    redirect("/login");
  }

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("id, name, registrationType, trialEndsAt, status")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) {
    redirect("/login");
  }

  const demo = isDemoRegistration(tenant.registrationType as string | null);
  if (!demo && tenant.status === "ACTIVE") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const expired = isDemoAccessExpired(tenant);
  const enabled = await loadEnabledBillingModuleKeys(tenantId);
  const defaultAddonIds = ADDON_PACKS.filter((pack) => isAddonPackActive(enabled, pack)).map(
    (pack) => pack.id,
  ) as AddonPackId[];

  if (user.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-bold">Demo access has ended</h1>
        <p className="mt-3 text-muted-foreground">
          Ask your company administrator to subscribe to HSEQ Nova to restore access for {tenant.name as string}.
        </p>
        <Link href="/login" className="mt-6 inline-block underline">
          Sign out
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 py-10">
      <SubscribeForm
        companyName={String(tenant.name)}
        trialEndsAt={tenant.trialEndsAt ? String(tenant.trialEndsAt) : null}
        expired={expired}
        defaultAddonIds={defaultAddonIds}
        cancelled={params.cancelled === "1"}
      />
    </main>
  );
}
