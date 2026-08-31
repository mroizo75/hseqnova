import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { getAuthContext } from "@/lib/server-authorization";
import { UserManagement } from "@/features/settings/components/user-management";
import { CompetentPersonLegalNote } from "@/features/settings/components/competent-person-legal-note";
import {
  isAdminRole,
  loadManagedUsers,
  loadTenantWithSubscription,
} from "@/server/queries/settings.queries";
import { loadOrgChartNodes } from "@/server/queries/org-chart.queries";
import { namedCompetentPersons } from "@/lib/competent-person-uk";
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

  const [tenant, users, orgNodes] = await Promise.all([
    loadTenantWithSubscription(auth.tenantId),
    loadManagedUsers(auth.tenantId),
    loadOrgChartNodes(auth.tenantId),
  ]);

  if (!tenant) {
    redirect("/dashboard");
  }

  const isAdmin = isAdminRole(auth.role);
  const competentNames = namedCompetentPersons(orgNodes);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Invite people and set roles. The named competent person is on the organisation
            chart (MHSWR 1999 reg.7) — not this role list.
          </p>
        </div>
        <PageHelpDialog content={helpContent.users} />
      </div>

      <CompetentPersonLegalNote />

      {competentNames.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Named competent person: <span className="font-medium text-foreground">{competentNames.join(", ")}</span>
          {" · "}
          <Link href="/dashboard/organisasjonskart" className="underline underline-offset-2">
            Organisation chart
          </Link>
        </p>
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">No named competent person</p>
          <p className="mt-1">
            Appoint someone on the{" "}
            <Link href="/dashboard/organisasjonskart" className="underline underline-offset-2">
              organisation chart
            </Link>{" "}
            (MHSWR 1999 reg.7). The HSE manager role here is only system access.
          </p>
        </div>
      )}

      <UserManagement
        users={users}
        currentUserId={auth.userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
