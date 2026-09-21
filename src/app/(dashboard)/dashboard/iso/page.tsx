import Link from "next/link";
import { requireIsoPage } from "@/features/iso/lib/require-iso-page";
import { loadIsoReadiness } from "@/server/queries/iso.queries";
import { buildIsoJourney } from "@/features/iso/lib/evidence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IsoPackBanner } from "@/features/iso/components/iso-evidence-note";
import { IsoReadinessPanel } from "@/features/iso/components/iso-readiness-panel";

export const dynamic = "force-dynamic";

export default async function IsoHubPage() {
  const { auth, enabledModules } = await requireIsoPage();
  const { statuses, readiness } = await loadIsoReadiness(auth.tenantId, enabledModules);
  const journey = buildIsoJourney(statuses);
  const next = journey.nextStep;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">ISO 45001:2018 and ISO 9001:2015</p>
        <h1 className="text-3xl font-bold">ISO work guide</h1>
        <p className="text-muted-foreground">
          One next task at a time. The same health and safety records are the evidence. Certification is granted by a
          UKAS-accredited body, not by this software.
        </p>
      </div>
      <IsoPackBanner />
      <IsoReadinessPanel readiness={readiness} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{journey.percent}%</p>
            <p className="text-sm text-muted-foreground">
              {journey.coveredCount} of {journey.totalCount} clauses covered automatically
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold capitalize">{journey.mode}</p>
            <p className="text-sm text-muted-foreground">
              {journey.mode === "wizard"
                ? "Finish context first — that is what the auditor asks for on day one."
                : "The foundation is in place. Keep reviews, audits and actions on time."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Auditor pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Show clause-by-clause evidence without teaching the whole app.</p>
            <Button asChild>
              <Link href="/dashboard/iso/auditor">Open auditor pack</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {next ? (
        <Card className="border-teal-200">
          <CardHeader>
            <CardTitle>Do this next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">
              {next.clause.standard === "ISO_45001" ? "ISO 45001" : "ISO 9001"} {next.clause.clause} — {next.clause.title}
            </p>
            <p>{next.clause.doThis}</p>
            <p className="text-sm text-muted-foreground">Why: {next.clause.shall}</p>
            <p className="text-sm text-muted-foreground">Done when: {next.detail}</p>
            <Button asChild>
              <Link href={`/dashboard/iso/clauses/${next.clause.id}`}>Work this clause</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            All mapped clauses currently have evidence. Keep reviews current.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {journey.phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                <span>{phase.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {phase.completeCount}/{phase.totalCount}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{phase.gain}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{phase.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/iso/context">Context interview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/iso/clauses">Gap matrix</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/iso/processes">Processes and customers</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/iso/consultation">Worker consultation</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/legal-register">Legal register</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/changes">Management of change</Link>
        </Button>
      </div>
    </div>
  );
}
