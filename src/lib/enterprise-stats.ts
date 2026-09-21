import { K_ANONYMITY_THRESHOLD } from "@/features/intelligence/lib/metrics";

export type SizeBand = "1-9" | "10-49" | "50-249" | "250+" | "unknown";

export type IncidentCountInput = {
  type: string;
  status: string;
  isFatal: boolean;
  isLostTimeIncident: boolean;
  lostWorkdays: number | null;
  isFirstAidCase: boolean;
  specifiedInjury: boolean;
  overSevenDayInjury: boolean;
  riddorReportable: boolean;
  estimatedDamageCost: number | null;
  severity: number | null;
  createdAt: Date;
  closedAt: Date | null;
};

export type StatCounters = {
  incidentTotal: number;
  incidentOpen: number;
  nearMissCount: number;
  accidentCount: number;
  fatalCount: number;
  lostTimeCount: number;
  riddorCount: number;
  firstAidCount: number;
  specifiedInjuryCount: number;
  overSevenDayCount: number;
  lostWorkdays: number;
  estimatedDamageCost: number;
  trir: number | null;
  ltir: number | null;
  avgMttrDays: number | null;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
};

export type StatRollupRow = {
  dimension: string;
  dimensionValue: string;
  companyCount: number;
  incidentTotal: number;
  nearMissCount: number;
  accidentCount: number;
  fatalCount: number;
  lostTimeCount: number;
  riddorCount: number;
  avgTrir: number | null;
  avgLtir: number | null;
};

export function sizeBandFromEmployeeCount(count: number | null | undefined): SizeBand {
  if (count === null || count === undefined || count <= 0) return "unknown";
  if (count <= 9) return "1-9";
  if (count <= 49) return "10-49";
  if (count <= 249) return "50-249";
  return "250+";
}

export function injuryRates(recordable: number, lostTime: number, employeeCount: number): {
  trir: number | null;
  ltir: number | null;
} {
  const manHours = employeeCount * 2000;
  if (manHours <= 0) return { trir: null, ltir: null };
  return {
    trir: (recordable * 200000) / manHours,
    ltir: (lostTime * 200000) / manHours,
  };
}

export function countIncidents(
  incidents: IncidentCountInput[],
  employeeCount: number,
): StatCounters {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const mttrDays: number[] = [];
  let incidentOpen = 0;
  let nearMissCount = 0;
  let accidentCount = 0;
  let fatalCount = 0;
  let lostTimeCount = 0;
  let riddorCount = 0;
  let firstAidCount = 0;
  let specifiedInjuryCount = 0;
  let overSevenDayCount = 0;
  let lostWorkdays = 0;
  let estimatedDamageCost = 0;
  let recordable = 0;

  for (const incident of incidents) {
    byType[incident.type] = (byType[incident.type] ?? 0) + 1;
    const severityKey = String(incident.severity ?? 0);
    bySeverity[severityKey] = (bySeverity[severityKey] ?? 0) + 1;
    if (incident.status === "OPEN" || incident.status === "INVESTIGATING") incidentOpen += 1;
    if (incident.type === "NESTEN") nearMissCount += 1;
    if (incident.type === "ULYKKE" || incident.type === "SKADE") accidentCount += 1;
    if (incident.isFatal) fatalCount += 1;
    if (incident.isLostTimeIncident) lostTimeCount += 1;
    if (incident.riddorReportable) riddorCount += 1;
    if (incident.isFirstAidCase) firstAidCount += 1;
    if (incident.specifiedInjury) specifiedInjuryCount += 1;
    if (incident.overSevenDayInjury) overSevenDayCount += 1;
    lostWorkdays += incident.lostWorkdays ?? 0;
    estimatedDamageCost += incident.estimatedDamageCost ?? 0;
    if (
      incident.isFatal ||
      incident.isLostTimeIncident ||
      incident.isFirstAidCase ||
      incident.specifiedInjury
    ) {
      recordable += 1;
    }
    if (incident.closedAt) {
      const days =
        (incident.closedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      mttrDays.push(days);
    }
  }

  const rates = injuryRates(recordable, lostTimeCount, employeeCount);
  return {
    incidentTotal: incidents.length,
    incidentOpen,
    nearMissCount,
    accidentCount,
    fatalCount,
    lostTimeCount,
    riddorCount,
    firstAidCount,
    specifiedInjuryCount,
    overSevenDayCount,
    lostWorkdays,
    estimatedDamageCost,
    trir: rates.trir,
    ltir: rates.ltir,
    avgMttrDays:
      mttrDays.length > 0 ? mttrDays.reduce((sum, value) => sum + value, 0) / mttrDays.length : null,
    byType,
    bySeverity,
  };
}

export function periodKeys(now: Date): { monthly: string; quarterly: string } {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const quarter = Math.ceil((now.getUTCMonth() + 1) / 3);
  return { monthly: `${year}-${month}`, quarterly: `${year}-Q${quarter}` };
}

export function rollupStats(
  rows: Array<{
    dimensionValue: string;
    incidentTotal: number;
    nearMissCount: number;
    accidentCount: number;
    fatalCount: number;
    lostTimeCount: number;
    riddorCount: number;
    trir: number | null;
    ltir: number | null;
  }>,
  dimension: string,
): StatRollupRow[] {
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.dimensionValue || "unknown";
    const existing = grouped.get(key) ?? [];
    existing.push(row);
    grouped.set(key, existing);
  }

  return [...grouped.entries()].map(([dimensionValue, group]) => {
    const trirs = group.map((row) => row.trir).filter((value): value is number => value !== null);
    const ltirs = group.map((row) => row.ltir).filter((value): value is number => value !== null);
    return {
      dimension,
      dimensionValue,
      companyCount: group.length,
      incidentTotal: group.reduce((sum, row) => sum + row.incidentTotal, 0),
      nearMissCount: group.reduce((sum, row) => sum + row.nearMissCount, 0),
      accidentCount: group.reduce((sum, row) => sum + row.accidentCount, 0),
      fatalCount: group.reduce((sum, row) => sum + row.fatalCount, 0),
      lostTimeCount: group.reduce((sum, row) => sum + row.lostTimeCount, 0),
      riddorCount: group.reduce((sum, row) => sum + row.riddorCount, 0),
      avgTrir: trirs.length > 0 ? trirs.reduce((sum, value) => sum + value, 0) / trirs.length : null,
      avgLtir: ltirs.length > 0 ? ltirs.reduce((sum, value) => sum + value, 0) / ltirs.length : null,
    };
  });
}

export function filterAnonymousRollups<T extends { companyCount: number }>(
  rows: T[],
  threshold = K_ANONYMITY_THRESHOLD,
): T[] {
  return rows.filter((row) => row.companyCount >= threshold);
}

export function compareToAverage(
  value: number | null | undefined,
  average: number | null | undefined,
): "above" | "below" | "level" | null {
  if (value === null || value === undefined || average === null || average === undefined) return null;
  const delta = value - average;
  if (Math.abs(delta) < 0.05) return "level";
  return delta > 0 ? "above" : "below";
}

export function slugifyEnterpriseName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "enterprise";
}
