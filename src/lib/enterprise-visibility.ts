import type {
  EnterpriseDomainKey,
  EnterpriseRelationshipType,
  EnterpriseVisibilityLevel,
} from "@prisma/client";

export const ENTERPRISE_DOMAIN_KEYS: readonly EnterpriseDomainKey[] = [
  "RISKS",
  "RAMS",
  "COSHH",
  "INCIDENTS",
  "INCIDENT_STATS",
  "ACTIONS",
  "TRAINING",
  "INSPECTIONS",
  "AUDITS",
  "ISO_45001",
  "ISO_9001",
  "MANAGEMENT_REVIEW",
  "DOCUMENTS",
  "ACTIVITY",
] as const;

export const VISIBILITY_RANK: Record<EnterpriseVisibilityLevel, number> = {
  NONE: 0,
  STATUS: 1,
  AGGREGATED: 2,
  SHARED_EVIDENCE: 3,
  FULL: 4,
};

export type AccessMap = Record<EnterpriseDomainKey, EnterpriseVisibilityLevel>;

const STATUS_HSEQ: AccessMap = {
  RISKS: "STATUS",
  RAMS: "STATUS",
  COSHH: "STATUS",
  INCIDENTS: "NONE",
  INCIDENT_STATS: "NONE",
  ACTIONS: "STATUS",
  TRAINING: "STATUS",
  INSPECTIONS: "STATUS",
  AUDITS: "STATUS",
  ISO_45001: "STATUS",
  ISO_9001: "STATUS",
  MANAGEMENT_REVIEW: "STATUS",
  DOCUMENTS: "NONE",
  ACTIVITY: "STATUS",
};

const GROUP_HSEQ: AccessMap = {
  RISKS: "AGGREGATED",
  RAMS: "AGGREGATED",
  COSHH: "AGGREGATED",
  INCIDENTS: "NONE",
  INCIDENT_STATS: "AGGREGATED",
  ACTIONS: "AGGREGATED",
  TRAINING: "AGGREGATED",
  INSPECTIONS: "AGGREGATED",
  AUDITS: "AGGREGATED",
  ISO_45001: "AGGREGATED",
  ISO_9001: "AGGREGATED",
  MANAGEMENT_REVIEW: "AGGREGATED",
  DOCUMENTS: "STATUS",
  ACTIVITY: "AGGREGATED",
};

export function requiresCompanyConsent(type: EnterpriseRelationshipType): boolean {
  return type !== "GROUP_SUBSIDIARY";
}

export function defaultShareLossStatistics(type: EnterpriseRelationshipType): boolean {
  return type === "GROUP_SUBSIDIARY";
}

export function defaultAccessForRelationship(type: EnterpriseRelationshipType): AccessMap {
  if (type === "GROUP_SUBSIDIARY") {
    return { ...GROUP_HSEQ };
  }
  return { ...STATUS_HSEQ };
}

export function withAnalyticsAccess(
  access: AccessMap,
  analyticsEnabled: boolean,
  shareLossStatistics: boolean,
): AccessMap {
  if (!analyticsEnabled || !shareLossStatistics) {
    return { ...access, INCIDENT_STATS: "NONE" };
  }
  return {
    ...access,
    INCIDENT_STATS: access.INCIDENT_STATS === "NONE" ? "AGGREGATED" : access.INCIDENT_STATS,
  };
}

export function visibilityAtLeast(
  actual: EnterpriseVisibilityLevel,
  required: EnterpriseVisibilityLevel,
): boolean {
  return VISIBILITY_RANK[actual] >= VISIBILITY_RANK[required];
}

export function accessLevel(
  access: Iterable<{ domainKey: EnterpriseDomainKey; visibilityLevel: EnterpriseVisibilityLevel }>,
  domain: EnterpriseDomainKey,
): EnterpriseVisibilityLevel {
  for (const row of access) {
    if (row.domainKey === domain) return row.visibilityLevel;
  }
  return "NONE";
}

export function canSeeDomainStatus(
  access: Iterable<{ domainKey: EnterpriseDomainKey; visibilityLevel: EnterpriseVisibilityLevel }>,
  domain: EnterpriseDomainKey,
): boolean {
  return visibilityAtLeast(accessLevel(access, domain), "STATUS");
}

export function canSeeDomainAggregates(
  access: Iterable<{ domainKey: EnterpriseDomainKey; visibilityLevel: EnterpriseVisibilityLevel }>,
  domain: EnterpriseDomainKey,
): boolean {
  return visibilityAtLeast(accessLevel(access, domain), "AGGREGATED");
}

export function accessRowsFromMap(
  map: AccessMap,
): Array<{ domainKey: EnterpriseDomainKey; visibilityLevel: EnterpriseVisibilityLevel }> {
  return ENTERPRISE_DOMAIN_KEYS.map((domainKey) => ({
    domainKey,
    visibilityLevel: map[domainKey],
  }));
}
