import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireEnterpriseAccess, type EnterpriseContext } from "@/lib/enterprise-context";
import { EnterpriseNav } from "@/components/enterprise-nav";
import { loadEnterpriseAlerts } from "@/server/queries/enterprise.queries";

export default async function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  let ctx: EnterpriseContext;
  try {
    ctx = await requireEnterpriseAccess();
  } catch {
    redirect(session.user.tenantId ? "/dashboard" : "/login");
  }

  const alerts = await loadEnterpriseAlerts(ctx);
  const openAlertCount = alerts.filter((row) => !row.acknowledgedAt).length;

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden lg:flex-row">
      <EnterpriseNav
        organisationName={ctx.organisationName}
        programmeName={ctx.programmeName}
        role={ctx.role}
        analyticsEnabled={ctx.analyticsEnabled}
        benchmarkEnabled={ctx.benchmarkEnabled}
        showPoweredBy={ctx.showPoweredBy}
        logoUrl={ctx.logoUrl}
        hasCompanyDashboard={Boolean(session.user.tenantId)}
        openAlertCount={openAlertCount}
      />
      <main
        className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-8"
        style={ctx.primaryColour ? { borderTop: `4px solid ${ctx.primaryColour}` } : undefined}
      >
        {ctx.welcomeText ? (
          <p className="mb-4 text-sm text-muted-foreground">{ctx.welcomeText}</p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
