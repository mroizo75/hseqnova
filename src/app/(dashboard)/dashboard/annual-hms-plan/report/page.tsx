import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";
import { getAnnualPlanChecklist } from "@/server/actions/annual-hms-plan.actions";

interface AnnualHmsPlanReportPageProps {
  searchParams: {
    year?: string;
  };
}

export default async function AnnualHmsPlanReportPage({ searchParams }: AnnualHmsPlanReportPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId || !session.user.role) {
    redirect("/login");
  }

  const permissions = getPermissions(session.user.role);

  if (!permissions.canReadManagementReviews && !permissions.canReadDocuments) {
    redirect("/dashboard");
  }

  const now = new Date();
  const yearParam = Number.parseInt(searchParams.year ?? "", 10);
  const year = Number.isFinite(yearParam) && yearParam >= 2020 && yearParam <= now.getFullYear() + 1 ? yearParam : now.getFullYear();

  const result = await getAnnualPlanChecklist(session.user.tenantId, year);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Årlig HMS-plan – rapport</h1>
        <p className="text-sm text-muted-foreground">Kunne ikke hente sjekkliste for valgt år.</p>
      </div>
    );
  }

  const { steps, completedCount, totalCount } = result.data;
  const generatedAt = now.toLocaleString("nb-NO");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 bg-background text-foreground">
      <header className="border-b pb-4 print:border-none">
        <h1 className="text-3xl font-bold">Årlig HMS-plan – rapport {year}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oversikt over alle steg i den årlige HMS-planen for valgt år, med status og dato for gjennomføring.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Generert: {generatedAt}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tenant: {session.user.tenantName ?? ""}
        </p>
      </header>

      <section className="space-y-2">
        <p className="text-sm">
          Fullført: <span className="font-semibold">{completedCount}</span> av{" "}
          <span className="font-semibold">{totalCount}</span> steg.
        </p>
      </section>

      <section className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className="rounded-lg border p-3 text-sm break-inside-avoid print:border print:p-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-semibold">{step.title}</h2>
                <p className="text-xs uppercase text-muted-foreground">{step.category}</p>
              </div>
              <div className="text-right text-xs">
                <p
                  className={step.completedAt ? "font-semibold text-green-700 dark:text-green-300" : "font-semibold text-red-700 dark:text-red-300"}
                >
                  {step.completedAt ? "Fullført" : "Ikke fullført"}
                </p>
                {step.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Dato: {new Date(step.completedAt).toLocaleDateString("nb-NO")}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            {step.legalRef && (
              <p className="mt-1 text-xs text-muted-foreground">Krav: {step.legalRef}</p>
            )}
          </div>
        ))}
      </section>

      <p className="mt-4 text-xs text-muted-foreground print:text-[10px]">
        Denne rapporten dokumenterer gjennomføringen av årlig HMS-plan i henhold til definerte steg i HMS-systemet.
        Bruk rapporten som vedlegg til ledelsens gjennomgang, styremøter eller eksterne revisjoner.
      </p>
    </div>
  );
}
