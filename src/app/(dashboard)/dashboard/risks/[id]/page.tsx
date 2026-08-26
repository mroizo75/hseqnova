import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RiskForm } from "@/features/risks/components/risk-form";
import { MeasureForm } from "@/features/measures/components/measure-form";
import { MeasureList } from "@/features/measures/components/measure-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RiskDocumentLinks } from "@/features/risks/components/risk-document-links";
import { getTranslations } from "next-intl/server";
import {
  loadRiskDetail,
  loadRiskFormOptions,
  loadRiskSession,
} from "@/server/queries/risks.queries";

export default async function EditRiskPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("dashboardRiskDetailPage");
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const context = await loadRiskSession(session.user.email, session.user.tenantId);
  if (!context) {
    return <div>{t("noTenantAccess")}</div>;
  }

  const [risk, options] = await Promise.all([
    loadRiskDetail(context.tenantId, id),
    loadRiskFormOptions(context.tenantId),
  ]);

  if (!risk) {
    return <div>{t("notFound")}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/risks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("actions.back")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{risk.title}</p>
      </div>

      <RiskForm
        tenantId={context.tenantId}
        userId={context.user.id}
        risk={risk}
        mode="edit"
        owners={options.people}
        slotBetweenRisikonivaAndResidual={
          <Card id="tiltak">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("measures.title")}</CardTitle>
                  <CardDescription>{t("measures.description")}</CardDescription>
                </div>
                <MeasureForm tenantId={context.tenantId} riskId={risk.id} users={options.people} />
              </div>
            </CardHeader>
            <CardContent>
              <MeasureList measures={risk.measures} />
            </CardContent>
          </Card>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.title")}</CardTitle>
          <CardDescription>{t("documents.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskDocumentLinks riskId={risk.id} documents={options.documents} links={risk.documentLinks} />
        </CardContent>
      </Card>
    </div>
  );
}
