import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { getHandbookData, getHandbookSuggestions } from "@/server/actions/hms-handbok.actions";
import { HandbokViewer } from "@/features/hms-handbok/components/handbok-viewer";
import { BookOpen } from "lucide-react";

export const metadata = { title: "Health and safety policy" };

export default async function HealthSafetyPolicyPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }
  const { permissions, tenantId, userId } = auth;

  if (!permissions.canReadDocuments && !permissions.canReadRoutines) {
    redirect("/dashboard");
  }

  const [tenantRes, handbookResult, suggestions, modulesRes] = await Promise.all([
    getAdminDb()
      .from("Tenant")
      .select("name, orgNumber, companyNumber, industry, hmsContactName, hmsContactPhone")
      .eq("id", tenantId)
      .maybeSingle(),
    getHandbookData(tenantId),
    getHandbookSuggestions(tenantId),
    getAdminDb()
      .from("TenantModule")
      .select("moduleKey")
      .eq("tenantId", tenantId)
      .in("status", ["ACTIVE", "TRIAL"]),
  ]);
  const tenant = tenantRes.data;
  if (!tenant) {
    redirect("/dashboard");
  }

  if (!handbookResult.success) {
    redirect("/dashboard");
  }

  const enabledModules = (modulesRes.data ?? []).map((row) => row.moduleKey as string);

  const canManage =
    permissions.canUpdateSettings ||
    permissions.canApproveDocuments ||
    permissions.canApproveManagementReviews;

  const canApprove =
    permissions.canUpdateSettings ||
    permissions.canApproveDocuments;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Health and safety policy
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Written policy under HSWA 1974 s.2(3): statement of intent, organisation and
            arrangements. Required in writing where there are five or more employees.
            Live records stay in the linked modules. Arrangements below match the HSEQ modules
            this company has — add-ons such as RAMS, COSHH, CDM, audits and whistleblowing appear
            only when they are switched on.
          </p>
        </div>
      </div>

      <HandbokViewer
        tenantId={tenantId}
        tenantName={tenant.name}
        orgNumber={tenant.orgNumber ?? tenant.companyNumber}
        industry={tenant.industry}
        hmsContactName={tenant.hmsContactName}
        hmsContactPhone={tenant.hmsContactPhone}
        handbook={handbookResult.handbook}
        stats={handbookResult.stats}
        currentUserId={userId}
        canManage={canManage}
        canApprove={canApprove}
        enabledModules={enabledModules}
        suggestions={suggestions}
      />
    </div>
  );
}
