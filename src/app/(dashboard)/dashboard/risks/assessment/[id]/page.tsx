import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RiskAssessmentItemForm } from "@/features/risks/components/risk-assessment-item-form";
import { RiskAssessmentItemList } from "@/features/risks/components/risk-assessment-item-list";
import { RiskAssessmentComplianceCard } from "@/features/risks/components/risk-assessment-compliance-card";
import { getPermissions } from "@/lib/permissions";
import { RiskAssessmentDeleteButton } from "@/features/risks/components/risk-assessment-delete-button";
import { RiskAssessmentTitleEditor } from "@/features/risks/components/risk-assessment-title-editor";
import {
  loadRiskAssessmentDetail,
  loadRiskSession,
  loadTenantPeople,
} from "@/server/queries/risks.queries";

export default async function RiskAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const context = await loadRiskSession(session.user.email, session.user.tenantId);
  if (!context) {
    return <div>No access to organisation</div>;
  }

  const permissions = getPermissions(context.role);
  const canDeleteRiskAssessments = permissions.canDeleteRisks;
  const canEditAssessmentTitle = permissions.canCreateRisks;

  const [assessment, people] = await Promise.all([
    loadRiskAssessmentDetail(context.tenantId, id),
    loadTenantPeople(context.tenantId),
  ]);

  if (!assessment) {
    notFound();
  }

  const userList = people
    .filter((person) => person.email)
    .map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email ?? "",
    }));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/risks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to risk assessments
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <RiskAssessmentTitleEditor
              assessmentId={assessment.id}
              initialTitle={assessment.title}
              canEdit={canEditAssessmentTitle}
            />
          </div>
          {canDeleteRiskAssessments && (
            <RiskAssessmentDeleteButton
              assessmentId={assessment.id}
              assessmentTitle={assessment.title}
            />
          )}
        </div>
        <p className="text-muted-foreground">
          Systematic risk assessment under MHSWR 1999 and HSWA 1974.
        </p>
        {assessment.project ? (
          <p className="text-sm text-blue-700 mt-2">
            Linked to project: <strong>{assessment.project.name}</strong>
          </p>
        ) : null}
      </div>

      <RiskAssessmentComplianceCard
        assessment={{
          id: assessment.id,
          participants: assessment.participants,
          approvedById: assessment.approvedById,
          approvedAt: assessment.approvedAt,
          reviewedById: assessment.reviewedById,
          reviewedAt: assessment.reviewedAt,
        }}
        users={userList}
      />

      <RiskAssessmentItemForm
        riskAssessmentId={assessment.id}
        tenantId={context.tenantId}
        ownerId={context.user.id}
      />

      <Card>
        <CardHeader>
          <CardTitle>Risk items in this assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <RiskAssessmentItemList risks={assessment.risks} />
        </CardContent>
      </Card>
    </div>
  );
}
