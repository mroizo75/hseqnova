import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { SuperAdminNav } from "@/components/superadmin-nav";
import { isPlatformStaff } from "@/lib/platform-access";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const db = getAdminDb();
  const { data: user } = await db
    .from("User")
    .select("isSuperAdmin, isSupport, isSales, isSalesManager")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user || !isPlatformStaff(user)) {
    redirect("/dashboard");
  }

  const staff = {
    isSuperAdmin: Boolean(user.isSuperAdmin),
    isSupport: Boolean(user.isSupport),
    isSales: Boolean(user.isSales),
    isSalesManager: Boolean(user.isSalesManager),
  };

  const { count: openSupportCount } = await db
    .from("SupportTicket")
    .select("id", { count: "exact", head: true })
    .in("status", ["OPEN", "IN_PROGRESS"]);

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden lg:flex-row">
      <SuperAdminNav
        isSuperAdmin={staff.isSuperAdmin}
        isSupport={staff.isSupport}
        isSales={staff.isSales}
        isSalesManager={staff.isSalesManager}
        hasTenant={Boolean(session.user.tenantId)}
        openSupportCount={openSupportCount ?? 0}
      />
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
