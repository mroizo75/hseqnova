"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  Clock,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
  UserCheck,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  resource: string | null;
  parsedMetadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivityTimelineProps {
  resourceId?: string;
  tenantWide?: boolean;
  limit?: number;
  className?: string;
}

const ACTION_ICON_MAP: Record<string, LucideIcon> = {
  CREATED: Plus,
  UPDATED: Pencil,
  DELETED: Trash2,
  APPROVED: UserCheck,
  COMPLETED: CheckCircle2,
  CLOSED: CheckCircle2,
  EVALUATED: Shield,
  SUBMITTED: FileText,
  STATUS_CHANGED: AlertTriangle,
};

const ACTION_COLOUR_MAP: Record<string, string> = {
  CREATED: "text-emerald-600 bg-emerald-50",
  UPDATED: "text-blue-600 bg-blue-50",
  DELETED: "text-red-600 bg-red-50",
  APPROVED: "text-green-700 bg-green-50",
  COMPLETED: "text-green-600 bg-green-50",
  CLOSED: "text-slate-600 bg-slate-100",
  EVALUATED: "text-purple-600 bg-purple-50",
};

function getActionVerb(action: string): string {
  const suffix = action.split("_").pop() ?? action;
  const verbs: Record<string, string> = {
    CREATED: "created",
    UPDATED: "updated",
    DELETED: "deleted",
    APPROVED: "approved",
    COMPLETED: "completed",
    CLOSED: "closed",
    EVALUATED: "evaluated",
    SUBMITTED: "submitted",
    REOPENED: "reopened",
    SIGNED: "signed",
    ASSIGNED: "assigned",
  };
  return verbs[suffix] ?? suffix.toLowerCase();
}

function getResourceLabel(action: string): string {
  const parts = action.split("_");
  if (parts.length < 2) return action;
  const resourcePart = parts.slice(0, -1).join(" ").toLowerCase();
  const labels: Record<string, string> = {
    incident: "incident",
    measure: "action",
    firedrill: "fire drill",
    inspection: "inspection",
    audit: "audit",
    risk: "risk",
    training: "training",
    document: "document",
    meeting: "meeting",
    routine: "procedure",
    chemical: "COSHH substance",
    sjaanalysis: "RAMS",
    ruhreport: "near miss report",
    whistleblowing: "whistleblowing case",
    managementreview: "management review",
    goal: "objective",
    environment: "environmental aspect",
  };
  return labels[resourcePart.replace(/\s/g, "")] ?? resourcePart;
}

export function ActivityTimeline({
  resourceId,
  tenantWide = false,
  limit = 20,
  className,
}: ActivityTimelineProps) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (resourceId) params.set("resourceId", resourceId);
    params.set("limit", String(limit));

    fetch(`/api/audit-log?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setItems(json.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [resourceId, tenantWide, limit]);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground py-4 text-center", className)}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <ul className="space-y-4">
        {items.map((item) => {
          const suffix = item.action.split("_").pop() ?? "";
          const Icon = ACTION_ICON_MAP[suffix] ?? Clock;
          const colour = ACTION_COLOUR_MAP[suffix] ?? "text-muted-foreground bg-muted";
          const verb = getActionVerb(item.action);
          const resourceLabel = getResourceLabel(item.action);
          const title =
            (item.parsedMetadata as Record<string, string> | null)?.title ?? null;

          return (
            <li key={item.id} className="relative pl-10">
              <span
                className={cn(
                  "absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full",
                  colour,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm">
                  <span className="font-medium">{item.userName ?? "System"}</span>{" "}
                  {verb}{" "}
                  <span className="text-muted-foreground">{resourceLabel}</span>
                  {title ? (
                    <span className="text-muted-foreground"> — {title}</span>
                  ) : null}
                </p>
                <time className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
