"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit } from "lucide-react";
import Link from "next/link";
import { calculateRiskScore } from "@/features/risks/schemas/risk.schema";
import type { Risk } from "@prisma/client";
import { RISK_CATEGORY_LABELS, RISK_LEVEL_LABELS, formatRiskDate } from "@/features/risks/utils/risk-labels";
import { formatGroupsAtRiskLabels } from "@/lib/risk-mhswr";

interface RiskAssessmentItemListProps {
  risks: (Risk & { owner?: { id: string; name: string | null; email: string | null } | null })[];
}

export function RiskAssessmentItemList({ risks }: RiskAssessmentItemListProps) {
  if (risks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6">
        No risk items yet. Use the form above to add items to this assessment.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Risk</TableHead>
          <TableHead className="w-[100px]">Level</TableHead>
          <TableHead className="w-[120px]">Category</TableHead>
          <TableHead className="w-[120px]">Assessment date</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {risks.map((risk) => {
          const { level, bgColor } = calculateRiskScore(risk.likelihood, risk.consequence);
          const whoLabels = formatGroupsAtRiskLabels(risk.groupsAtRisk);
          return (
            <TableRow key={risk.id}>
              <TableCell>
                <p className="font-medium">{risk.title}</p>
                {risk.context ? (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{risk.context}</p>
                ) : null}
                {whoLabels.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Who: {whoLabels.join(", ")}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={bgColor}>
                  {RISK_LEVEL_LABELS[level]}
                </Badge>
              </TableCell>
              <TableCell>{RISK_CATEGORY_LABELS[risk.category] ?? risk.category}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatRiskDate(risk.assessmentDate) || "–"}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/risks/${risk.id}`} title="Edit risk">
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
