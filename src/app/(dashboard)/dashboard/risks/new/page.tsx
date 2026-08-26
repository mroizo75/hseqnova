import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RiskAssessmentForm } from "@/features/risks/components/risk-assessment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { loadActiveProjects, loadRiskSession } from "@/server/queries/risks.queries";

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
  const projects = await loadActiveProjects(context.tenantId);

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
          Create a suitable and sufficient risk assessment (MHSWR 1999). Then add the individual
          risk items.
        </p>
      </div>

      <RiskAssessmentForm tenantId={context.tenantId} defaultYear={currentYear} projects={projects} />
    </div>
  );
}
