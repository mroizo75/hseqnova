import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";
import { RoleTrainingEditor } from "@/features/training/components/role-training-editor";
import { TrainingGapAnalysis } from "@/features/training/components/training-gap-analysis";
import {
  listRoleTrainingRequirements,
  getRoleGaps,
} from "@/server/actions/role-training.actions";
import { loadCourseTemplatesForTenant } from "@/server/queries/training.queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function RoleTrainingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const [courseTemplates, reqResult, gapResult] = await Promise.all([
    loadCourseTemplatesForTenant(tenantId, { activeOnly: true }),
    listRoleTrainingRequirements(),
    getRoleGaps(),
  ]);

  const courses = courseTemplates.map((t) => ({
    courseKey: t.courseKey,
    title: t.title,
  }));

  const requirements = reqResult.success ? reqResult.data : [];
  const gaps = gapResult.success ? gapResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/training">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Training
              </Button>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
            Role Training Requirements
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Map required courses to job roles. HSWA 1974 s.2(2)(c): duty to provide training.
          </p>
        </div>
      </div>

      <RoleTrainingEditor courses={courses} requirements={requirements} />

      <TrainingGapAnalysis gaps={gaps} />
    </div>
  );
}
