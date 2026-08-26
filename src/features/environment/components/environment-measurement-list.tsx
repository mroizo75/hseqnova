"use client";

import { EnvironmentalMeasurement } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

type MeasurementWithRelations = EnvironmentalMeasurement & {
  responsible?: { id: string; name: string | null; email: string | null } | null;
};

interface EnvironmentMeasurementListProps {
  measurements: MeasurementWithRelations[];
}

const statusColors: Record<EnvironmentalMeasurement["status"], string> = {
  COMPLIANT: "bg-emerald-100 text-emerald-900 border-emerald-300",
  WARNING: "bg-yellow-100 text-yellow-900 border-yellow-300",
  NON_COMPLIANT: "bg-red-100 text-red-900 border-red-300",
};

const formatDate = (value: Date) => format(new Date(value), "d MMM yyyy", { locale: enGB });

export function EnvironmentMeasurementList({ measurements }: EnvironmentMeasurementListProps) {
  if (measurements.length === 0) {
    return <p className="text-sm text-muted-foreground">No measurements recorded yet.</p>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parameter</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Limit / target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Recorded by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((measurement) => (
            <TableRow key={measurement.id}>
              <TableCell>
                <div className="font-medium">{measurement.parameter}</div>
                {measurement.method && (
                  <p className="text-xs text-muted-foreground">Method: {measurement.method}</p>
                )}
                {measurement.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {measurement.notes}
                  </p>
                )}
              </TableCell>
              <TableCell className="font-semibold">
                {measurement.measuredValue}
                {measurement.unit ? ` ${measurement.unit}` : ""}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="text-muted-foreground">Limit:</span>{" "}
                  {typeof measurement.limitValue === "number" ? measurement.limitValue : "-"}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Target:</span>{" "}
                  {typeof measurement.targetValue === "number" ? measurement.targetValue : "-"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[measurement.status]}>
                  {measurement.status === "COMPLIANT"
                    ? "Compliant"
                    : measurement.status === "WARNING"
                      ? "Warning"
                      : "Non-compliant"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(measurement.measurementDate)}</TableCell>
              <TableCell>
                {measurement.responsible?.name ||
                  measurement.responsible?.email ||
                  "Not set"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

