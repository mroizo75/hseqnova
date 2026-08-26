"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  RiskCategory,
  RiskControlEffectiveness,
  RiskControlStatus,
  RiskResponseStrategy,
  RiskStatus,
  RiskTrend,
} from "@prisma/client";
import { getExposureBadge, getExposureLevel, summarizeControls } from "@/features/risks/utils/risk-register";
import {
  RISK_CATEGORY_LABELS,
  RISK_STATUS_LABELS,
  formatRiskDate,
} from "@/features/risks/utils/risk-labels";
import Link from "next/link";

const STRATEGY_LABELS: Record<RiskResponseStrategy, string> = {
  AVOID: "Avoid",
  REDUCE: "Reduce",
  TRANSFER: "Transfer",
  ACCEPT: "Accept",
};

const TREND_LABELS: Record<RiskTrend, string> = {
  INCREASING: "Increasing",
  STABLE: "Stable",
  DECREASING: "Decreasing",
};

interface RiskRegisterRow {
  id: string;
  title: string;
  category: RiskCategory;
  status: RiskStatus;
  score: number;
  residualScore?: number | null;
  owner?: { name: string | null; email: string | null } | null;
  responseStrategy: RiskResponseStrategy;
  trend: RiskTrend;
  nextReviewDate: Date | null;
  controls: Array<{ status: RiskControlStatus; effectiveness: RiskControlEffectiveness }>;
  documentCount: number;
  auditCount: number;
  measuresOpen: number;
}

interface RiskRegisterTableProps {
  rows: RiskRegisterRow[];
}

export function RiskRegisterTable({ rows }: RiskRegisterTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesCategory = categoryFilter === "ALL" || row.category === categoryFilter;
      const matchesSearch = row.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [rows, categoryFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              <SelectItem value="SAFETY">Safety (HSWA)</SelectItem>
              <SelectItem value="HEALTH">Health (HSWA)</SelectItem>
              <SelectItem value="PSYCHOSOCIAL">Psychosocial</SelectItem>
              <SelectItem value="ERGONOMIC">Ergonomic</SelectItem>
              <SelectItem value="PHYSICAL">Physical</SelectItem>
              <SelectItem value="ORGANISATIONAL">Organisational</SelectItem>
              <SelectItem value="ENVIRONMENTAL">Environmental (ISO 14001)</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="STRATEGIC">Strategic (ISO 31000)</SelectItem>
              <SelectItem value="INFORMATION_SECURITY">Information security</SelectItem>
              <SelectItem value="LEGAL">Legal / compliance</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search risks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-[220px]"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredRows.length} of {rows.length} risks
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk</TableHead>
              <TableHead>Initial risk</TableHead>
              <TableHead>Residual risk</TableHead>
              <TableHead>Controls</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Next review</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => {
              const exposureLevel = getExposureLevel(row.score, row.residualScore);
              const badge = getExposureBadge(exposureLevel);
              const controlSummary = summarizeControls(row.controls);

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link href={`/dashboard/risks/${row.id}`} className="font-semibold hover:underline">
                        {row.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {RISK_CATEGORY_LABELS[row.category]} • {row.owner?.name || row.owner?.email || "Not set"}
                      </p>
                      <Badge variant="outline">{RISK_STATUS_LABELS[row.status]}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${badge.className}`}>
                      {badge.label} ({row.score})
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.residualScore != null ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {row.score} → {row.residualScore}
                        </span>
                        <Badge variant="secondary">Residual: {row.residualScore}</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not assessed</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>
                      Effective: <span className="font-medium">{controlSummary.effective}</span>
                    </p>
                    <p>
                      Gaps: <span className="font-medium text-orange-600">{controlSummary.gaps}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Retired: {controlSummary.retired}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{STRATEGY_LABELS[row.responseStrategy]}</p>
                    <p className="text-xs text-muted-foreground">Trend: {TREND_LABELS[row.trend]}</p>
                    {row.measuresOpen > 0 && (
                      <p className="text-xs text-orange-600">{row.measuresOpen} open actions</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.nextReviewDate ? (
                      formatRiskDate(row.nextReviewDate)
                    ) : (
                      <span className="text-muted-foreground text-xs">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>Documents: {row.documentCount}</p>
                    <p>Audits: {row.auditCount}</p>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
