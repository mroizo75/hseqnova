import { notFound } from "next/navigation";
import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import {
  loadCompanyAssurance,
  loadImprovementRequests,
  visibleDomainBands,
} from "@/server/queries/enterprise.queries";
import { AssuranceBadge } from "@/features/enterprise/components/assurance-badge";
import { ImprovementRequestForm } from "@/features/enterprise/components/improvement-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EnterpriseCompanyPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const ctx = await requireEnterpriseAccess();
  const { tenantId } = await params;
  const company = await loadCompanyAssurance(ctx, tenantId);
  if (!company) notFound();
  const bands = visibleDomainBands(company);
  const requests = await loadImprovementRequests(ctx, company.membershipId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{company.tenantName}</h1>
        <p className="text-muted-foreground">
          {company.portfolioName} · {company.relationshipType.replaceAll("_", " ").toLowerCase()}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <AssuranceBadge band={company.overallBand} />
        <span className="text-2xl font-semibold">
          {company.overallPercent !== null ? `${company.overallPercent}%` : "Awaiting snapshot"}
        </span>
        <span className="capitalize text-muted-foreground">{company.trend?.toLowerCase() ?? ""}</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>HSEQ Assurance</CardTitle>
          <CardDescription>Traffic lights only. Record detail stays in the company workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {Object.entries(bands).map(([domain, band]) => (
            <div key={domain} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm">{domain.replaceAll("_", " ")}</span>
              <AssuranceBadge band={band} />
            </div>
          ))}
        </CardContent>
      </Card>
      {ctx.permissions.canRequestImprovement ? (
        <Card>
          <CardHeader>
            <CardTitle>Request improvement</CardTitle>
            <CardDescription>The company creates corrective actions in their own HSEQ account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImprovementRequestForm membershipId={company.membershipId} />
            {requests.map((request) => (
              <div key={String(request.id)} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{String(request.title)}</p>
                <p className="text-muted-foreground">
                  {Number(request.actionDone)} of {Number(request.actionTotal)} actions completed · {Number(request.actionOpen)} outstanding
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
