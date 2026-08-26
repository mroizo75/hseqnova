import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { loadActiveCourseTemplatesSplit } from "@/server/queries/training.queries";
import { Button } from "@/components/ui/button";
import { CourseTemplatesManager } from "@/features/training/components/course-templates-manager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CourseTemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const { globalCourses, tenantCourses } = await loadActiveCourseTemplatesSplit(tenantId);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/training">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to training
          </Link>
        </Button>
        
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course templates</h1>
            <p className="text-muted-foreground">
              Manage which courses are available for the organisation
            </p>
          </div>
        </div>
      </div>

      <CourseTemplatesManager
        tenantId={tenantId}
        globalCourses={globalCourses}
        tenantCourses={tenantCourses}
      />
    </div>
  );
}
