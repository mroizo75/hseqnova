import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProjectForm } from "@/features/projects/components/project-form";
import { loadDutyHoldersForProject, loadProjectById, loadProjectPeopleForTenant } from "@/server/queries/projects.queries";
import { mergeDutyHoldersForForm } from "@/features/projects/lib/cdm-duty-holders";
import type { CdmDutyHolderRoleKey } from "@/features/projects/lib/cdm-duty-holders";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;
  const { id } = await params;

  const [project, users, dutyHolders] = await Promise.all([
    loadProjectById(id, tenantId),
    loadProjectPeopleForTenant(tenantId),
    loadDutyHoldersForProject(id, tenantId),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit project</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <ProjectForm
        mode="edit"
        users={users}
        defaultValues={{
          id: project.id,
          name: project.name,
          code: project.code ?? undefined,
          orderNumber: project.orderNumber ?? undefined,
          clientName: project.clientName ?? undefined,
          location: project.location ?? undefined,
          description: project.description ?? undefined,
          status: project.status,
          startDate: project.startDate?.toISOString().split("T")[0],
          endDate: project.endDate?.toISOString().split("T")[0],
          projectManagerId: project.projectManagerId ?? undefined,
          dutyHolders: mergeDutyHoldersForForm(
            dutyHolders.map((holder) => ({
              ...holder,
              role: holder.role as CdmDutyHolderRoleKey,
            })),
            project.clientName,
          ),
        }}
      />
    </div>
  );
}
