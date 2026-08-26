import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";
import { ProjectForm } from "@/features/projects/components/project-form";
import { loadProjectPeopleForTenant } from "@/server/queries/projects.queries";

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const users = await loadProjectPeopleForTenant(session.user.tenantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            New project / site
          </h1>
          <p className="text-muted-foreground">
            CDM 2015 site register — attach duty holders, F10, Construction Phase Plan and HSEQ records to this project
          </p>
        </div>
      </div>

      <ProjectForm
        mode="create"
        users={users}
      />
    </div>
  );
}
