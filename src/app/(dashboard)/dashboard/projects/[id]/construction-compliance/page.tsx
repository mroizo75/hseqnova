import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getAuthMembership } from "@/lib/auth-db";
import type { Role } from "@prisma/client";
import { getPermissions } from "@/lib/permissions";
import { ConstructionComplianceClient } from "@/features/projects/components/construction-compliance-client";
import { loadProjectSummary } from "@/server/queries/projects.queries";

export default async function ProjectConstructionCompliancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    redirect("/login");
  }

  const membership = await getAuthMembership(session.user.id, session.user.tenantId);
  if (!membership) {
    return <div>No access</div>;
  }
  const permissions = getPermissions(membership.role as Role);
  if (!permissions.canReadConstructionCompliance) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const project = await loadProjectSummary(id, session.user.tenantId);
  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CDM 2015 compliance</h1>
        <p className="text-sm text-muted-foreground">
          Project: {project.name}
        </p>
      </div>

      <ConstructionComplianceClient
        projectId={project.id}
        canManage={permissions.canManageConstructionCompliance}
      />
    </div>
  );
}
