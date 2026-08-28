import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RiskAssessmentForm } from "@/features/risks/components/risk-assessment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { loadActiveProjects, loadRiskSession } from "@/server/queries/risks.queries";
import { IndustryRiskStarter } from "@/features/risks/components/industry-risk-starter";
import { getAdminDb } from "@/lib/supabase/admin";

export default async function NewRiskAssessmentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const context = await loadRiskSession(session.user.email, session.user.tenantId);
  if (!context) {
    return <div>No access to organisation</div>;
  }

  const currentYear = new Date().getFullYear();
  const [projects, tenant] = await Promise.all([
    loadActiveProjects(context.tenantId),
    getAdminDb()
      .from("Tenant")
      .select("industry")
      .eq("id", context.tenantId)
      .maybeSingle()
      .then((result) => result.data),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/risks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to risk assessments
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">New risk assessment</h1>
        <p className="text-muted-foreground">
          Start from typical hazards for your type of work, then review so the assessment is
          suitable and sufficient (MHSWR 1999).
        </p>
      </div>

      <IndustryRiskStarter initialIndustry={(tenant?.industry as string | null) ?? null} />

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t" />
        </div>
        <p className="relative mx-auto w-fit bg-background px-3 text-sm text-muted-foreground">
          Or start from a blank document
        </p>
      </div>

      <RiskAssessmentForm tenantId={context.tenantId} defaultYear={currentYear} projects={projects} />
    </div>
  );
}
