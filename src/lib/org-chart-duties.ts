/**
 * Organisation of health and safety — HSWA 1974 s.2(3) Part 2.
 * HSE: list the names, positions and roles of people with specific H&S responsibility.
 * https://www.hse.gov.uk/simple-health-safety/policy/how-to-write-your-policy.htm
 */

export const ORG_HS_DUTY_KEYS = [
  "md",
  "competent_person",
  "safety_rep",
  "fire",
  "first_aid",
  "line_manager",
  "other",
] as const;

export type OrgHsDutyKey = (typeof ORG_HS_DUTY_KEYS)[number];

export type OrgHsDutyMeta = {
  key: OrgHsDutyKey;
  label: string;
  defaultTitle: string;
  defaultDuty: string;
  legalRef: string;
  /** HSE Part 2: people with specific H&S responsibility should be named. */
  requiresName: boolean;
  /** Shown on the coverage checklist. */
  coreCoverage: boolean;
};

export const ORG_HS_DUTIES: readonly OrgHsDutyMeta[] = [
  {
    key: "md",
    label: "Most senior person / Managing Director",
    defaultTitle: "Managing Director",
    defaultDuty:
      "Overall responsibility for health and safety. Signs the statement of intent and reviews the written policy (HSE).",
    legalRef: "HSWA 1974 s.2(3); HSE policy guidance",
    requiresName: true,
    coreCoverage: true,
  },
  {
    key: "competent_person",
    label: "Competent person",
    defaultTitle: "Competent person (HSE manager)",
    defaultDuty:
      "Assists the employer to comply with health and safety law. Prefer a person in employment where one is available.",
    legalRef: "MHSWR 1999 reg.7",
    requiresName: true,
    coreCoverage: true,
  },
  {
    key: "first_aid",
    label: "First aider / appointed person",
    defaultTitle: "First aider",
    defaultDuty:
      "Renders first aid. Employees must be told who this is and where equipment is kept.",
    legalRef: "Health and Safety (First-Aid) Regulations 1981 reg.4",
    requiresName: true,
    coreCoverage: true,
  },
  {
    key: "fire",
    label: "Fire marshal / responsible person",
    defaultTitle: "Fire marshal",
    defaultDuty:
      "Fire precautions, evacuation and drills for the premises.",
    legalRef: "Regulatory Reform (Fire Safety) Order 2005",
    requiresName: true,
    coreCoverage: true,
  },
  {
    key: "safety_rep",
    label: "Safety representative",
    defaultTitle: "Safety representative",
    defaultDuty:
      "Inspects, investigates and consults where a recognised trade union has appointed a representative.",
    legalRef: "SRSCWR 1977",
    requiresName: true,
    coreCoverage: false,
  },
  {
    key: "line_manager",
    label: "Line manager / supervisor",
    defaultTitle: "Line manager",
    defaultDuty:
      "Implements arrangements on site, supervises safe systems of work and closes actions they own.",
    legalRef: "HSWA 1974 s.2; MHSWR 1999",
    requiresName: false,
    coreCoverage: false,
  },
  {
    key: "other",
    label: "Other H&S role",
    defaultTitle: "Health and safety role",
    defaultDuty: "",
    legalRef: "HSWA 1974 s.2(3)",
    requiresName: false,
    coreCoverage: false,
  },
];

export const ORG_HS_DUTY_BY_KEY: Record<OrgHsDutyKey, OrgHsDutyMeta> = Object.fromEntries(
  ORG_HS_DUTIES.map((duty) => [duty.key, duty]),
) as Record<OrgHsDutyKey, OrgHsDutyMeta>;

export function isOrgHsDutyKey(value: string | null | undefined): value is OrgHsDutyKey {
  return ORG_HS_DUTY_KEYS.includes(value as OrgHsDutyKey);
}

export type OrgChartDutyNode = {
  hsDutyKey?: string | null;
  name?: string | null;
  title?: string | null;
  hsDuty?: string | null;
};

export type OrgChartCoverageItem = {
  key: OrgHsDutyKey;
  label: string;
  legalRef: string;
  present: boolean;
  named: boolean;
  ok: boolean;
};

export function assessOrgChartCoverage(nodes: OrgChartDutyNode[]): {
  items: OrgChartCoverageItem[];
  complete: boolean;
  missing: OrgHsDutyKey[];
  absent: OrgHsDutyKey[];
} {
  const items: OrgChartCoverageItem[] = ORG_HS_DUTIES.filter((duty) => duty.coreCoverage).map(
    (duty) => {
      const matches = nodes.filter((node) => node.hsDutyKey === duty.key);
      const present = matches.length > 0;
      const named = matches.some((node) => Boolean(node.name?.trim()));
      return {
        key: duty.key,
        label: duty.label,
        legalRef: duty.legalRef,
        present,
        named,
        ok: named,
      };
    },
  );

  return {
    items,
    complete: items.every((item) => item.ok),
    missing: items.filter((item) => !item.ok).map((item) => item.key),
    absent: items.filter((item) => !item.present).map((item) => item.key),
  };
}

export function dutyRequiresName(hsDutyKey: string | null | undefined): boolean {
  if (!isOrgHsDutyKey(hsDutyKey)) return false;
  return ORG_HS_DUTY_BY_KEY[hsDutyKey].requiresName;
}

export function dutyLabel(hsDutyKey: string | null | undefined): string | null {
  if (!isOrgHsDutyKey(hsDutyKey)) return null;
  return ORG_HS_DUTY_BY_KEY[hsDutyKey].label;
}
