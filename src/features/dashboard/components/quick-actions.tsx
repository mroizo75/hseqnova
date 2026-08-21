"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { Role } from "@prisma/client";
import type { RolePermissions } from "@/lib/permissions";

interface QuickActionsProps {
  permissions: RolePermissions;
  userRole: Role;
}

const PRIORITY_ACTIONS = [
  {
    label: "Rapporter hendelse",
    icon: AlertCircle,
    href: "/dashboard/incidents/new",
    canPerform: (p: RolePermissions) => p.canCreateIncidents,
  },
  {
    label: "Nytt tiltak",
    icon: ListTodo,
    href: "/dashboard/actions",
    canPerform: (p: RolePermissions) => p.canCreateActions,
  },
  {
    label: "Ny risikovurdering",
    icon: AlertTriangle,
    href: "/dashboard/risks/new",
    canPerform: (p: RolePermissions) => p.canCreateRisks,
  },
  {
    label: "Nytt dokument",
    icon: FileText,
    href: "/dashboard/documents/new",
    canPerform: (p: RolePermissions) => p.canCreateDocuments,
  },
];

export function QuickActions({ permissions, userRole }: QuickActionsProps) {
  const available = PRIORITY_ACTIONS.filter((a) => a.canPerform(permissions));

  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Hurtighandlinger:</span>
      {available.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href}>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
