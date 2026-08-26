import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getAuthContext } from "@/lib/server-authorization";
import { UserManagement } from "@/features/settings/components/user-management";
import {
  isAdminRole,
  loadManagedUsers,
  loadTenantWithSubscription,
} from "@/server/queries/settings.queries";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }

  if (!auth.permissions.canReadSettings) {
    redirect("/dashboard");
  }

  const [tenant, users] = await Promise.all([
    loadTenantWithSubscription(auth.tenantId),
    loadManagedUsers(auth.tenantId),
  ]);

  if (!tenant) {
    redirect("/dashboard");
  }

  const isAdmin = isAdminRole(auth.role);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Invite people, set roles and line managers. Unlimited users per company.
            Access follows HSWA s.2 organisation: who is competent, who is informed.
          </p>
        </div>
        <PageHelpDialog content={helpContent.users} />
      </div>

      <UserManagement
        users={users}
        currentUserId={auth.userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
