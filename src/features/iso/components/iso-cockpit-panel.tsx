import Link from "next/link";
import { getAuthContext } from "@/lib/server-authorization";
import { getEnabledModuleKeys } from "@/lib/require-tenant-module";
import { tenantHasIsoPack } from "@/lib/tenant-modules";
import { loadIsoReadiness } from "@/server/queries/iso.queries";
import { buildIsoJourney } from "@/features/iso/lib/evidence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IsoPackBanner } from "@/features/iso/components/iso-evidence-note";
import { IsoReadinessPanel } from "@/features/iso/components/iso-readiness-panel";

export async function IsoCockpitPanel() {
  const auth = await getAuthContext();
  if (!auth) return null;
  const enabledModules = await getEnabledModuleKeys(auth.tenantId);
  if (!tenantHasIsoPack(enabledModules)) return null;

  const { readiness, statuses } = await loadIsoReadiness(auth.tenantId, enabledModules);
  const journey = buildIsoJourney(statuses);
  const next = journey.nextStep;

  return (
    <div className="space-y-4">
      <IsoPackBanner />
      <IsoReadinessPanel readiness={readiness} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">IMS coverage</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="text-3xl font-semibold">{readiness.label}</p>
          <p className="text-sm text-muted-foreground">
            {journey.coveredCount} of {journey.totalCount} clauses have live evidence
          </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ISO next step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {next ? (
              <>
                <p className="font-medium">
                  {next.clause.standard === "ISO_45001" ? "ISO 45001" : "ISO 9001"} {next.clause.clause}{" "}
                  — {next.clause.title}
                </p>
                <p className="text-sm text-muted-foreground">{next.clause.doThis}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={next.clause.href}>Open this work</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/iso">Work guide</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/iso/auditor">Auditor pack</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Mapped clauses currently have evidence. Keep audits, reviews and actions on time.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
