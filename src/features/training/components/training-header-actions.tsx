"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkTrainingForm } from "@/features/training/components/bulk-training-form";
import { PerEmployeeTrainingForm } from "@/features/training/components/per-employee-training-form";
import {
  Plus,
  ChevronDown,
  Users,
  BookOpen,
  LayoutGrid,
  MoreHorizontal,
} from "lucide-react";
import type { CourseTemplate } from "@prisma/client";

type ActiveDialog = "per-employee" | "bulk" | null;

interface TrainingHeaderActionsProps {
  tenantId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  courseTemplates: CourseTemplate[];
}

export function TrainingHeaderActions({
  tenantId,
  users,
  courseTemplates,
}: TrainingHeaderActionsProps) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-transparent">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Tools
            <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Catalogue
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/training/courses" className="flex cursor-pointer items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course templates
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/training/matrix" className="flex cursor-pointer items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Competence matrix
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" className="bg-transparent" onClick={() => setActiveDialog("bulk")}>
        <Users className="mr-2 h-4 w-4" />
        Add for a group
      </Button>
      <Button onClick={() => setActiveDialog("per-employee")}>
        <Plus className="mr-2 h-4 w-4" />
        Add for employee
      </Button>

      <PerEmployeeTrainingForm
        tenantId={tenantId}
        users={users}
        courseTemplates={courseTemplates}
        open={activeDialog === "per-employee"}
        onOpenChange={(open) => setActiveDialog(open ? "per-employee" : null)}
      />
      <BulkTrainingForm
        tenantId={tenantId}
        users={users}
        courseTemplates={courseTemplates}
        open={activeDialog === "bulk"}
        onOpenChange={(open) => setActiveDialog(open ? "bulk" : null)}
      />
    </div>
  );
}
