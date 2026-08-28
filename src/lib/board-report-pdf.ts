/**
 * Board Report PDF Generator
 *
 * One-click generation of a quarterly HSEQ board report.
 * Uses the branded PDF pipeline from pdf-brand.ts.
 */

import { getAdminDb } from "@/lib/supabase/admin";
import { calculateComplianceScore, type ComplianceScore } from "@/lib/compliance-score";
import { generateBrandedPdf, type PdfSection, type PdfContent } from "@/lib/pdf-brand";

export interface BoardReportOptions {
  tenantId: string;
  quarter: number;
  year: number;
  generatedBy?: string;
}

export async function generateBoardReportPdf(
  options: BoardReportOptions,
): Promise<Buffer> {
  const { tenantId, quarter, year, generatedBy } = options;
  const db = getAdminDb();
  const now = new Date();

  const quarterStart = new Date(year, (quarter - 1) * 3, 1);
  const quarterEnd = new Date(year, quarter * 3, 0, 23, 59, 59);
  const periodStart = quarterStart.toISOString();
  const periodEnd = quarterEnd.toISOString();

  const [tenantResult, complianceScore, incidentStats, openActions, trainingStats, upcomingActivities, topRisks] =
    await Promise.all([
      db.from("Tenant").select("name, orgNumber, address, logoUrl").eq("id", tenantId).single(),
      calculateComplianceScore(tenantId),
      fetchIncidentStats(db, tenantId, periodStart, periodEnd),
      fetchOpenActions(db, tenantId),
      fetchTrainingStats(db, tenantId),
      fetchUpcomingActivities(db, tenantId),
      fetchTopRisks(db, tenantId),
    ]);

  const tenant = tenantResult.data ?? { name: "Unknown", orgNumber: null, address: null, logoUrl: null };
  const periodLabel = `Q${quarter} ${year}`;

  const sections: PdfSection[] = [
    buildComplianceSection(complianceScore),
    buildIncidentSection(incidentStats, periodLabel),
    buildActionsSection(openActions),
    buildTrainingSection(trainingStats),
    buildUpcomingSection(upcomingActivities),
    buildRisksSection(topRisks),
  ];

  return generateBrandedPdf({
    type: "formal",
    title: `HSEQ Board Report — ${periodLabel}`,
    subtitle: `Quarterly health, safety, environment and quality report for the board of directors`,
    reportLabel: "BOARD REPORT",
    tenant: {
      name: tenant.name,
      orgNumber: tenant.orgNumber,
      address: tenant.address,
      logoUrl: tenant.logoUrl,
    },
    generatedBy,
    generatedAt: now,
    legalReference: "HSWA 1974; MHSWR 1999; RIDDOR 2013",
    sections,
  });
}

// ── Data fetchers ──────────────────────────────────────────────────────────────

interface IncidentStats {
  total: number;
  byType: Record<string, number>;
  riddorReported: number;
  nearMisses: number;
}

async function fetchIncidentStats(
  db: ReturnType<typeof getAdminDb>,
  tenantId: string,
  periodStart: string,
  periodEnd: string,
): Promise<IncidentStats> {
  const { data } = await db
    .from("Incident")
    .select("id, type, riddorReportable, riddorReportedAt")
    .eq("tenantId", tenantId)
    .gte("occurredAt", periodStart)
    .lte("occurredAt", periodEnd);

  const incidents = data ?? [];
  const byType: Record<string, number> = {};
  let riddorReported = 0;
  let nearMisses = 0;

  for (const inc of incidents) {
    const type = (inc.type as string) || "OTHER";
    byType[type] = (byType[type] ?? 0) + 1;
    if (inc.riddorReportable && inc.riddorReportedAt) riddorReported++;
    if (type === "NEAR_MISS") nearMisses++;
  }

  return { total: incidents.length, byType, riddorReported, nearMisses };
}

interface OpenActionsData {
  total: number;
  overdue: number;
  dueThisMonth: number;
}

async function fetchOpenActions(
  db: ReturnType<typeof getAdminDb>,
  tenantId: string,
): Promise<OpenActionsData> {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data } = await db
    .from("Measure")
    .select("id, dueAt, status")
    .eq("tenantId", tenantId)
    .neq("status", "DONE");

  const measures = data ?? [];
  const overdue = measures.filter((m: any) => m.dueAt && new Date(m.dueAt) < now).length;
  const dueThisMonth = measures.filter(
    (m: any) => m.dueAt && new Date(m.dueAt) >= now && new Date(m.dueAt) <= endOfMonth,
  ).length;

  return { total: measures.length, overdue, dueThisMonth };
}

interface TrainingStats {
  totalRecords: number;
  expired: number;
  expiringWithin30Days: number;
}

async function fetchTrainingStats(
  db: ReturnType<typeof getAdminDb>,
  tenantId: string,
): Promise<TrainingStats> {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 86_400_000).toISOString();

  const { data } = await db
    .from("Training")
    .select("id, validUntil")
    .eq("tenantId", tenantId)
    .not("validUntil", "is", null);

  const records = data ?? [];
  const expired = records.filter((t: any) => new Date(t.validUntil) < now).length;
  const expiringWithin30Days = records.filter(
    (t: any) => new Date(t.validUntil) >= now && t.validUntil <= thirtyDays,
  ).length;

  return { totalRecords: records.length, expired, expiringWithin30Days };
}

interface UpcomingActivity {
  type: "inspection" | "audit";
  title: string;
  scheduledDate: string;
}

async function fetchUpcomingActivities(
  db: ReturnType<typeof getAdminDb>,
  tenantId: string,
): Promise<UpcomingActivity[]> {
  const now = new Date().toISOString();
  const activities: UpcomingActivity[] = [];

  const { data: inspections } = await db
    .from("Inspection")
    .select("title, scheduledDate")
    .eq("tenantId", tenantId)
    .in("status", ["PLANNED", "IN_PROGRESS"])
    .gte("scheduledDate", now)
    .order("scheduledDate", { ascending: true })
    .limit(5);

  for (const i of inspections ?? []) {
    activities.push({ type: "inspection", title: i.title, scheduledDate: i.scheduledDate });
  }

  const { data: audits } = await db
    .from("Audit")
    .select("title, scheduledDate")
    .eq("tenantId", tenantId)
    .in("status", ["PLANNED", "IN_PROGRESS"])
    .gte("scheduledDate", now)
    .order("scheduledDate", { ascending: true })
    .limit(5);

  for (const a of audits ?? []) {
    activities.push({ type: "audit", title: a.title, scheduledDate: a.scheduledDate });
  }

  return activities.sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
  );
}

interface TopRisk {
  title: string;
  riskScore: number;
  status: string;
}

async function fetchTopRisks(
  db: ReturnType<typeof getAdminDb>,
  tenantId: string,
): Promise<TopRisk[]> {
  const { data } = await db
    .from("Risk")
    .select("title, riskScore, status")
    .eq("tenantId", tenantId)
    .in("status", ["OPEN", "MITIGATING"])
    .order("riskScore", { ascending: false })
    .limit(5);

  return (data ?? []).map((r: any) => ({
    title: r.title,
    riskScore: r.riskScore ?? 0,
    status: r.status,
  }));
}

// ── Section builders ───────────────────────────────────────────────────────────

function buildComplianceSection(score: ComplianceScore): PdfSection {
  const content: PdfContent[] = [
    {
      type: "keyvalue",
      pairs: [
        ["Overall score", `${score.percentage}% (${score.totalScore} / ${score.maxScore} points)`],
        ["Checks passing", `${score.checks.filter((c) => c.status === "pass").length} of ${score.checks.length}`],
        ["Calculated", score.calculatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
      ],
    },
    {
      type: "table",
      headers: ["Check", "Legal basis", "Points", "Status"],
      rows: score.checks.map((c) => [
        c.label,
        c.legalRef,
        `${c.earnedPoints} / ${c.maxPoints}`,
        c.status === "pass" ? "Pass" : c.status === "attention" ? "Attention" : "Fail",
      ]),
    },
  ];

  if (score.checks.some((c) => c.status === "fail")) {
    content.push({
      type: "alert",
      text: `${score.checks.filter((c) => c.status === "fail").length} compliance check(s) are currently failing. Immediate action is recommended.`,
      severity: "danger",
    });
  }

  return {
    title: "Compliance Score",
    legalRef: "HSWA 1974; MHSWR 1999",
    content,
  };
}

function buildIncidentSection(stats: IncidentStats, period: string): PdfSection {
  const typeRows = Object.entries(stats.byType).map(([type, count]) => [
    formatIncidentType(type),
    String(count),
  ]);

  const content: PdfContent[] = [
    {
      type: "keyvalue",
      pairs: [
        ["Total incidents in period", String(stats.total)],
        ["RIDDOR reports submitted", String(stats.riddorReported)],
        ["Near misses reported", String(stats.nearMisses)],
      ],
    },
  ];

  if (typeRows.length > 0) {
    content.push({
      type: "table",
      headers: ["Incident type", "Count"],
      rows: typeRows,
    });
  }

  return {
    title: `Incident Statistics — ${period}`,
    legalRef: "RIDDOR 2013; SS(C&P)R 1979",
    content,
  };
}

function buildActionsSection(actions: OpenActionsData): PdfSection {
  const content: PdfContent[] = [
    {
      type: "keyvalue",
      pairs: [
        ["Open actions", String(actions.total)],
        ["Overdue", String(actions.overdue)],
        ["Due this month", String(actions.dueThisMonth)],
      ],
    },
  ];

  if (actions.overdue > 0) {
    content.push({
      type: "alert",
      text: `${actions.overdue} action(s) are overdue. Review and close or re-date as a priority.`,
      severity: "warning",
    });
  }

  return { title: "Open Actions Summary", legalRef: "MHSWR 1999", content };
}

function buildTrainingSection(stats: TrainingStats): PdfSection {
  return {
    title: "Training Compliance",
    legalRef: "HSWA 1974 s.2(2)(c)",
    content: [
      {
        type: "keyvalue",
        pairs: [
          ["Total training records", String(stats.totalRecords)],
          ["Currently expired", String(stats.expired)],
          ["Expiring within 30 days", String(stats.expiringWithin30Days)],
        ],
      },
      ...(stats.expired > 0
        ? ([
            {
              type: "alert",
              text: `${stats.expired} mandatory training record(s) have expired. Competence must be maintained for all safety-critical work.`,
              severity: "danger",
            },
          ] as PdfContent[])
        : []),
    ],
  };
}

function buildUpcomingSection(activities: UpcomingActivity[]): PdfSection {
  if (activities.length === 0) {
    return {
      title: "Upcoming Inspections and Audits",
      content: [{ type: "paragraph", text: "No inspections or audits currently scheduled." }],
    };
  }

  return {
    title: "Upcoming Inspections and Audits",
    legalRef: "MHSWR 1999; ISO 45001 cl.9.2",
    content: [
      {
        type: "table",
        headers: ["Activity", "Type", "Scheduled date"],
        rows: activities.map((a) => [
          a.title,
          a.type === "inspection" ? "Workplace inspection" : "Audit",
          new Date(a.scheduledDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        ]),
      },
    ],
  };
}

function buildRisksSection(risks: TopRisk[]): PdfSection {
  if (risks.length === 0) {
    return {
      title: "Key Risks",
      content: [{ type: "paragraph", text: "No open risks currently recorded." }],
    };
  }

  return {
    title: "Key Risks (Top 5 by Score)",
    legalRef: "MHSWR 1999 reg.3",
    content: [
      {
        type: "table",
        headers: ["Risk", "Score", "Status"],
        rows: risks.map((r) => [
          r.title,
          String(r.riskScore),
          r.status === "OPEN" ? "Open" : "Mitigating",
        ]),
      },
    ],
  };
}

function formatIncidentType(type: string): string {
  const map: Record<string, string> = {
    DEATH: "Death",
    SPECIFIED_INJURY: "Specified injury",
    OVER_7_DAY: "Over-7-day injury",
    OCCUPATIONAL_DISEASE: "Occupational disease",
    DANGEROUS_OCCURRENCE: "Dangerous occurrence",
    NEAR_MISS: "Near miss",
    MINOR_INJURY: "Minor injury",
    OTHER: "Other",
  };
  return map[type] ?? type;
}
