import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SearchMetrics } from "@/lib/google/search-console-core";
import { formatCount, formatCtr, formatPosition } from "@/features/seo/components/seo-format";

export type MetricsTableRow = SearchMetrics & {
  key: string;
  label: ReactNode;
};

type MetricsTableProps = {
  labelHeading: string;
  rows: MetricsTableRow[];
  emptyMessage: string;
};

export function MetricsTable({ labelHeading, rows, emptyMessage }: MetricsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labelHeading}</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">Impressions</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">Position</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="max-w-[28rem] break-words">{row.label}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCount(row.clicks)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCount(row.impressions)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCtr(row.ctr)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPosition(row.position)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
