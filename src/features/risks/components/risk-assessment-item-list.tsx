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

const LEVEL_LABELS: Record<string, string> = {
  LOW: "Lav",
  MEDIUM: "Moderat",
  HIGH: "Høy",
  CRITICAL: "Kritisk",
};

const CATEGORY_LABELS: Record<string, string> = {
  PSYCHOSOCIAL: "Psykososialt",
  ERGONOMIC: "Ergonomisk",
  ORGANISATIONAL: "Organisatorisk",
  PHYSICAL: "Fysisk",
  SAFETY: "Sikkerhet",
  HEALTH: "Helse",
  OPERATIONAL: "Operasjonell",
  ENVIRONMENTAL: "Miljø",
  STRATEGIC: "Strategisk",
  LEGAL: "Juridisk",
  INFORMATION_SECURITY: "Informasjonssikkerhet",
};

const formatDate = (value?: Date | string | null) => {
  if (!value) return "–";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString("no-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
};

interface RiskAssessmentItemListProps {
  risks: (Risk & { owner?: { id: string; name: string | null; email: string | null } | null })[];
}

export function RiskAssessmentItemList({ risks }: RiskAssessmentItemListProps) {
  if (risks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6">
        Ingen risikopunkter ennå. Bruk skjemaet over for å legge til punkter nedover i risikovurderingen.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Beskrivelse</TableHead>
          <TableHead className="w-[100px]">Nivå</TableHead>
          <TableHead className="w-[120px]">Kategori</TableHead>
          <TableHead className="w-[100px]">Vurderingsdato</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {risks.map((risk) => {
          const { level, bgColor } = calculateRiskScore(risk.likelihood, risk.consequence);
          return (
            <TableRow key={risk.id}>
              <TableCell className="font-medium">{risk.title}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={bgColor}>
                  {LEVEL_LABELS[level] ?? level}
                </Badge>
              </TableCell>
              <TableCell>{CATEGORY_LABELS[risk.category] ?? risk.category}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(risk.assessmentDate)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/risks/${risk.id}`} title="Rediger risiko">
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
