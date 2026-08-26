import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeasureEditForm } from "@/features/measures/components/measure-edit-form";
import { getMeasureStatusLabel, getMeasureStatusColor } from "@/features/measures/schemas/measure.schema";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { loadMeasureById, loadMeasurePeople } from "@/server/queries/measures.queries";

export default async function MeasureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const [measure, tenantUsers] = await Promise.all([
    loadMeasureById(id, tenantId),
    loadMeasurePeople(tenantId),
  ]);

  if (!measure) {
    notFound();
  }

  const backUrl = measure.riskId
    ? `/dashboard/risks/${measure.riskId}#tiltak`
    : measure.fireDrillId
      ? `/dashboard/fire-drills/${measure.fireDrillId}`
      : "/dashboard/actions";

  const relatedLabel = measure.risk
    ? `Linked to risk: ${measure.risk.title}`
    : measure.incident
      ? `Linked to incident: ${measure.incident.title}`
      : measure.fireDrill
        ? `Linked to fire drill: ${measure.fireDrill.title}`
        : null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {measure.riskId ? "Back to risk assessments" : measure.fireDrillId ? "Back to fire drill" : "Back to actions"}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{measure.title}</h1>
          <Badge className={getMeasureStatusColor(measure.status)}>
            {getMeasureStatusLabel(measure.status)}
          </Badge>
        </div>
        {relatedLabel ? <p className="text-muted-foreground mt-1">{relatedLabel}</p> : null}
      </div>

      <MeasureEditForm measure={measure} users={tenantUsers} />
    </div>
  );
}
