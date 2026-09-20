import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadAdminCommandCentre } from "@/server/queries/admin.queries";
import { adminHomePath, isPlatformStaff } from "@/lib/platform-access";
import { AdminCommandCentre } from "@/features/admin/components/admin-command-centre";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!isPlatformStaff(session.user)) {
    redirect("/login");
  }
  if (!session.user.isSuperAdmin && !session.user.isSupport) {
    redirect(adminHomePath(session.user));
  }

  const includeCommercial = Boolean(session.user.isSuperAdmin);
  const data = await loadAdminCommandCentre({ includeCommercial });

  return (
    <AdminCommandCentre
      data={data}
      operatorName={session.user.name ?? null}
      includeCommercial={includeCommercial}
    />
  );
}
