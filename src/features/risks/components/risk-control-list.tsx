"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type {
  RiskControl,
  RiskControlEffectiveness,
  RiskControlStatus,
  ControlFrequency,
  RiskControlType,
} from "@prisma/client";
import { updateRiskControl, deleteRiskControl } from "@/server/actions/risk-register.actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

const statusColors: Record<RiskControlStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  NEEDS_IMPROVEMENT: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<RiskControlStatus, string> = {
  ACTIVE: "Active",
  NEEDS_IMPROVEMENT: "Needs improvement",
  RETIRED: "Retired",
};

const effectivenessLabels: Record<RiskControlEffectiveness, string> = {
  EFFECTIVE: "Effective",
  PARTIAL: "Partial",
  INEFFECTIVE: "Ineffective",
  NOT_TESTED: "Not tested",
};

const controlTypeLabels: Record<RiskControlType, string> = {
  ELIMINATION: "Elimination",
  SUBSTITUTION: "Substitution",
  ENGINEERING: "Engineering",
  ADMINISTRATIVE: "Administrative",
  PPE: "PPE",
  PREVENTIVE: "Preventive",
  DETECTIVE: "Detective",
  CORRECTIVE: "Corrective",
  DIRECTIONAL: "Directive",
  COMPENSATING: "Compensating",
};

type ControlUpdatePayload = Partial<{
  title: string;
  description: string | null;
  controlType: RiskControlType;
  ownerId: string | null;
  frequency: ControlFrequency | null;
  effectiveness: RiskControlEffectiveness;
  status: RiskControlStatus;
  monitoringMethod: string | null;
  evidenceDocumentId: string | null;
  nextTestDate: string | null;
  lastTestedAt: string | null;
}>;

interface RiskControlListProps {
  riskId: string;
  controls: Array<
    RiskControl & {
      owner?: { id: string; name: string | null; email: string | null } | null;
      evidenceDocument?: { id: string; title: string | null } | null;
    }
  >;
}

export function RiskControlList({ riskId, controls }: RiskControlListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (controlId: string, data: ControlUpdatePayload) => {
    startTransition(async () => {
      const result = await updateRiskControl({
        id: controlId,
        riskId,
        ...data,
      });

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Could not update",
          description: result.error || "The control could not be updated.",
        });
      } else {
        toast({
          title: "Control updated",
          description: "The control has been updated.",
        });
      }
    });
  };

  const handleDelete = (controlId: string) => {
    startTransition(async () => {
      const result = await deleteRiskControl(controlId);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Could not remove",
          description: result.error || "The control could not be removed.",
        });
      } else {
        toast({
          title: "Control removed",
          description: "The control has been removed from this risk.",
        });
      }
    });
  };

  if (controls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No controls are recorded for this risk yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Control</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Effect</TableHead>
            <TableHead>Next test</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {controls.map((control) => (
            <TableRow key={control.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{control.title}</p>
                  {control.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{control.description}</p>
                  )}
                  {control.evidenceDocument && (
                    <p className="text-xs text-blue-600">
                      Evidence: {control.evidenceDocument.title ?? "Document"}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {controlTypeLabels[control.controlType] ?? control.controlType}
                {control.frequency && (
                  <p className="text-xs text-muted-foreground">
                    Frequency: {control.frequency.toLowerCase().replace(/_/g, " ")}
                  </p>
                )}
                {control.monitoringMethod && (
                  <p className="text-xs text-muted-foreground">Method: {control.monitoringMethod}</p>
                )}
              </TableCell>
              <TableCell>
                <Select
                  value={control.status}
                  onValueChange={(value: RiskControlStatus) => handleUpdate(control.id, { status: value })}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusColors).map(([value, color]) => (
                      <SelectItem key={value} value={value}>
                        <span className={`inline-flex items-center gap-2 rounded px-2 py-0.5 text-xs ${color}`}>
                          {statusLabels[value as RiskControlStatus]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={control.effectiveness}
                  onValueChange={(value: RiskControlEffectiveness) =>
                    handleUpdate(control.id, { effectiveness: value })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(effectivenessLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm">
                {control.nextTestDate ? (
                  <>
                    {format(new Date(control.nextTestDate), "dd. MMM yyyy", { locale: enGB })}
                    {control.lastTestedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last tested {format(new Date(control.lastTestedAt), "dd MMM yyyy", { locale: enGB })}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">Not scheduled</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {control.owner ? control.owner.name || control.owner.email : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(control.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

