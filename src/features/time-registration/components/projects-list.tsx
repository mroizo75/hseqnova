"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectForm } from "./project-form";

interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  _count?: { timeEntries: number; mileageEntries: number };
}

interface ProjectsListProps {
  tenantId: string;
  projects: Project[];
}

export function ProjectsList({
  tenantId,
  projects,
}: ProjectsListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => (
          <Badge
            key={p.id}
            variant={p.status === "ACTIVE" ? "default" : "secondary"}
            className="text-sm py-1.5 cursor-pointer hover:opacity-80"
            onClick={() => {
              setEditingProject(p);
              setFormOpen(true);
            }}
          >
            {p.code ? `${p.code} – ` : ""}{p.name}
            {p._count && (p._count.timeEntries > 0 || p._count.mileageEntries > 0) && (
              <span className="ml-1 text-xs opacity-80">
                ({p._count.timeEntries + p._count.mileageEntries})
              </span>
            )}
          </Badge>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setEditingProject(undefined);
          setFormOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nytt prosjekt
      </Button>
      <ProjectForm
        tenantId={tenantId}
        project={editingProject}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProject(undefined);
        }}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
