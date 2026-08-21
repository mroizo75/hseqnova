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
import { nb } from "date-fns/locale";

const statusColors: Record<RiskControlStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  NEEDS_IMPROVEMENT: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<RiskControlStatus, string> = {
  ACTIVE: "Aktiv",
  NEEDS_IMPROVEMENT: "Trenger forbedring",
  RETIRED: "Avviklet",
};

const effectivenessLabels: Record<RiskControlEffectiveness, string> = {
  EFFECTIVE: "Effektiv",
  PARTIAL: "Delvis",
  INEFFECTIVE: "Ikke effektiv",
  NOT_TESTED: "Ikke testet",
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
          title: "Feil",
          description: result.error || "Kunne ikke oppdatere kontroll",
        });
      } else {
        toast({
          title: "✅ Kontroll oppdatert",
          description: "Kontrollen er oppdatert i registeret",
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
          title: "Feil",
          description: result.error || "Kunne ikke slette kontroll",
        });
      } else {
        toast({
          title: "Kontroll fjernet",
          description: "Kontrollen er fjernet fra registeret",
        });
      }
    });
  };

  if (controls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Ingen kontroller er registrert for denne risikoen ennå.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kontroll</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Effekt</TableHead>
            <TableHead>Neste test</TableHead>
            <TableHead>Eier</TableHead>
            <TableHead className="text-right">Handling</TableHead>
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
                      Evidens: {control.evidenceDocument.title ?? "Dokument"}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {control.controlType === "PREVENTIVE" && "Forebyggende"}
                {control.controlType === "DETECTIVE" && "Detekterende"}
                {control.controlType === "CORRECTIVE" && "Korrigerende"}
                {control.controlType === "DIRECTIONAL" && "Styrende"}
                {control.controlType === "COMPENSATING" && "Kompenserende"}
                {control.frequency && (
                  <p className="text-xs text-muted-foreground">Frekvens: {control.frequency.toLowerCase()}</p>
                )}
                {control.monitoringMethod && (
                  <p className="text-xs text-muted-foreground">Metode: {control.monitoringMethod}</p>
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
                    {format(new Date(control.nextTestDate), "dd. MMM yyyy", { locale: nb })}
                    {control.lastTestedAt && (
                      <p className="text-xs text-muted-foreground">
                        Sist testet {format(new Date(control.lastTestedAt), "dd.MM.yyyy", { locale: nb })}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">Ikke planlagt</span>
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

