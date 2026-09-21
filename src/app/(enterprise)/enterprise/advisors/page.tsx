import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseAdvisors } from "@/server/queries/enterprise.queries";
import { AssignAdvisorForm } from "@/features/enterprise/components/assign-advisor-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdvisorsPage() {
  const ctx = await requireEnterpriseAccess();
  const advisors = await loadEnterpriseAdvisors(ctx);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advisors</h1>
        <p className="text-muted-foreground">
          Oversight assignments. Working inside a company still requires that company to invite the advisor.
        </p>
      </div>
      {ctx.permissions.canAssignAdvisors ? (
        <Card>
          <CardHeader>
            <CardTitle>Assign advisor</CardTitle>
            <CardDescription>The person must already have an HSEQ Nova login.</CardDescription>
          </CardHeader>
          <CardContent>
            <AssignAdvisorForm enterpriseId={ctx.enterpriseId} />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {advisors.length === 0 ? (
            <p className="text-muted-foreground">No advisors assigned.</p>
          ) : (
            advisors.map((row) => (
              <div key={String(row.id)} className="rounded-lg border px-3 py-2">
                <p className="font-medium">{(row.user as { name?: string; email?: string } | null)?.name ?? (row.user as { email?: string } | null)?.email}</p>
                <p className="text-muted-foreground">
                  {String(row.scopeType)} · {row.canAssistInWorkspace ? "May assist in workspace" : "Oversight only"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
