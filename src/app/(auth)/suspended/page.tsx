import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { ensureTenantPaidAccess } from "@/server/queries/billing.queries";
import { SuspendedView } from "./suspended-view";

export default async function SuspendedPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId ?? null;

  if (tenantId) {
    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("id, status, stripeSubscriptionId")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant && (await ensureTenantPaidAccess(tenant))) {
      redirect("/dashboard");
    }
  }

  return <SuspendedView />;
}
