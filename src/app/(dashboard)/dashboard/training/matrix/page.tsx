import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  loadCourseTemplatesForTenant,
  loadTrainingPeople,
  loadTrainingsForTenant,
} from "@/server/queries/training.queries";
import { Button } from "@/components/ui/button";
import { CompetenceMatrix } from "@/features/training/components/competence-matrix";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CompetenceMatrixPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const [users, trainings, courseTemplates] = await Promise.all([
    loadTrainingPeople(tenantId),
    loadTrainingsForTenant(tenantId, { orderBy: "courseKey" }),
    loadCourseTemplatesForTenant(tenantId, { activeOnly: true }),
  ]);

  const matrix = users.map((user) => ({
    user,
    trainings: trainings.filter((row) => row.userId === user.id),
  }));

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="print:hidden">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/training">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to training
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Competence matrix</h1>
        <p className="text-muted-foreground">
          Overview of each employee&apos;s competence
        </p>
      </div>

      <div className="print:pt-0">
        <CompetenceMatrix matrix={matrix} courseTemplates={courseTemplates} tenantId={tenantId} />
      </div>
    </div>
  );
}
