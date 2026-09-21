import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { loadConnectedOrganisations, loadTenantDocumentsForShare } from "@/server/queries/enterprise.queries";
import { ConnectedOrganisationsPanel } from "@/features/enterprise/components/connected-organisations-panel";
import { getAdminDb } from "@/lib/supabase/admin";

export const metadata = { title: "Connected organisations" };

export default async function ConnectedOrganisationsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!auth.permissions.canReadSettings) redirect("/dashboard");

  const [{ memberships, access, requests }, documents] = await Promise.all([
    loadConnectedOrganisations(auth.tenantId),
    loadTenantDocumentsForShare(auth.tenantId),
  ]);

  const advisorUserIds = new Set<string>();
  for (const row of memberships as Array<Record<string, unknown>>) {
    const portfolio = row.portfolio as { enterprise?: { id?: string } } | null;
    const enterpriseId = portfolio?.enterprise?.id;
    if (enterpriseId) {
      const { data } = await getAdminDb()
        .from("EnterpriseAdvisorAssignment")
        .select("userId")
        .eq("enterpriseId", enterpriseId);
      for (const assignment of data ?? []) advisorUserIds.add(assignment.userId as string);
    }
  }
  const { data: advisorUsers } =
    advisorUserIds.size > 0
      ? await getAdminDb()
          .from("User")
          .select("id, name, email")
          .in("id", [...advisorUserIds])
      : { data: [] };

  const mapped = (memberships as Array<Record<string, unknown>>).map((row) => {
    const portfolio = row.portfolio as {
      enterprise?: { name?: string; programmeName?: string | null };
    } | null;
    return {
      id: row.id as string,
      status: row.status as string,
      relationshipType: row.relationshipType as string,
      shareLossStatistics: Boolean(row.shareLossStatistics),
      programmeName: portfolio?.enterprise?.programmeName ?? "",
      organisationName: portfolio?.enterprise?.name ?? "Enterprise organisation",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connected organisations</h1>
        <p className="text-muted-foreground">
          Insurers, groups and networks you have agreed to share HSEQ status with. They cannot open your records unless you raise visibility.
        </p>
      </div>
      <ConnectedOrganisationsPanel
        isAdmin={auth.permissions.canUpdateSettings}
        memberships={mapped}
        access={access as Array<{ membershipId: string; domainKey: string; visibilityLevel: string }>}
        documents={(documents as Array<{ id: string; title: string }>).map((row) => ({
          id: row.id,
          title: row.title,
        }))}
        advisors={((advisorUsers ?? []) as Array<{ id: string; name: string | null; email: string }>).map((row) => ({
          id: row.id,
          name: row.name || row.email,
        }))}
        requests={(requests as Array<{
          id: string;
          membershipId: string;
          title: string;
          message: string;
          status: string;
        }>).map((row) => ({
          id: row.id,
          membershipId: row.membershipId,
          title: row.title,
          message: row.message,
          status: row.status,
        }))}
      />
    </div>
  );
}
