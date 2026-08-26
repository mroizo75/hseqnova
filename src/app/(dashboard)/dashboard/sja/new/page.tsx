import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, BookTemplate, FolderOpen } from "lucide-react";
import { SjaForm } from "@/components/sja/sja-form";
import { loadActiveProjects, loadSjaProject, loadSjaTemplateById } from "@/server/queries/sja.queries";

interface PageProps {
  searchParams: Promise<{ mal?: string; projectId?: string }>;
}

export default async function NewSjaPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const { mal: templateId, projectId } = await searchParams;

  const [project, projects, template] = await Promise.all([
    projectId ? loadSjaProject(projectId, tenantId) : Promise.resolve(null),
    loadActiveProjects(tenantId),
    templateId ? loadSjaTemplateById(templateId, tenantId) : Promise.resolve(null),
  ]);

  const safeProjectId = project?.id;
  const templateData = template
    ? {
        title: template.name,
        description: template.description || "",
        workLocation: project?.location || template.workLocation || "",
        participants: "",
        templateId: template.id,
        templateName: template.name,
        hazards: template.hazards.map((hazard) => ({
          activity: hazard.activity,
          hazard: hazard.hazard,
          consequence: hazard.consequence || "",
          probability: hazard.probability,
          severity: hazard.severity,
          measures: hazard.measures,
          responsibleName: hazard.responsibleName || "",
        })),
      }
    : {
        title: "",
        description: "",
        workLocation: project?.location || "",
        participants: "",
        hazards: [
          {
            activity: "",
            hazard: "",
            consequence: "",
            probability: 1,
            severity: 1,
            measures: "",
            responsibleName: "",
          },
        ],
      };

  const successRedirectPath = safeProjectId ? `/dashboard/projects/${safeProjectId}` : "/dashboard/sja";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <HardHat className="h-7 w-7 text-orange-600" />
          New RAMS
        </h1>
        <p className="text-muted-foreground">
          Risk assessment and method statement for the task (MHSWR 1999; CDM 2015).
        </p>
      </div>

      {safeProjectId ? (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Recorded against project: <strong>{project?.name}</strong>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {template ? (
        <Card className="border-l-4 border-l-purple-500 bg-purple-50">
          <CardContent className="p-4">
            <p className="text-sm text-purple-900 flex items-center gap-2">
              <BookTemplate className="h-4 w-4" />
              Using template: <strong>{template.name}</strong>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>RAMS form</CardTitle>
        </CardHeader>
        <CardContent>
          <SjaForm
            tenantId={tenantId}
            userName={session.user.name || session.user.email || "User"}
            projectId={safeProjectId}
            projects={projects}
            successRedirectPath={successRedirectPath}
            initialData={templateData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
