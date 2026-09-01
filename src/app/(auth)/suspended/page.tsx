import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { resolveTenantProductAccess } from "@/server/queries/billing.queries";
import { SuspendedView } from "./suspended-view";

export default async function SuspendedPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId ?? null;

  if (tenantId) {
    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("id, status, onboardingStatus, stripeSubscriptionId, stripeCustomerId")
      .eq("id", tenantId)
      .maybeSingle();
    const access = tenant ? await resolveTenantProductAccess(tenant) : "suspended";
    if (access === "ok") {
      redirect("/dashboard");
    }
    if (access === "pay") {
      redirect("/register?pay=1");
    }
  }

  return <SuspendedView />;
}
