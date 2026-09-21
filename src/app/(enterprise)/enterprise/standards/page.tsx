import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseStandards } from "@/server/queries/enterprise.queries";
import { CreateStandardForm } from "@/features/enterprise/components/create-standard-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StandardsPage() {
  const ctx = await requireEnterpriseAccess();
  const { standards, requirements } = await loadEnterpriseStandards(ctx);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Standards</h1>
        <p className="text-muted-foreground">Configurable HSEQ requirements for this enterprise. Not a statutory checklist.</p>
      </div>
      {ctx.permissions.canManageStandards ? (
        <Card>
          <CardHeader>
            <CardTitle>New standard</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateStandardForm />
          </CardContent>
        </Card>
      ) : null}
      {(standards as Array<{ id: string; name: string; description: string | null }>).map((standard) => (
        <Card key={standard.id}>
          <CardHeader>
            <CardTitle>{standard.name}</CardTitle>
            <CardDescription>{standard.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(requirements as Array<{ id: string; standardId: string; label: string; ruleKey: string }>)
              .filter((row) => row.standardId === standard.id)
              .map((row) => (
                <p key={row.id}>
                  {row.label} <span className="text-muted-foreground">({row.ruleKey})</span>
                </p>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
