/**
 * Living health and safety policy — HSWA 1974 s.2(3) / HSE INDG259.
 * Written policy = statement of intent + organisation + arrangements.
 */

import { tenantHasModule } from "@/lib/tenant-modules";

export const HEALTH_SAFETY_POLICY_PATH = "/dashboard/health-safety-policy";
export const HEALTH_SAFETY_POLICY_LEGACY_PATH = "/dashboard/hms-handbok";
export const HEALTH_SAFETY_POLICY_EMPLOYEE_PATH = "/ansatt/hms-handbok";

/** Roles that read the policy in the employee portal (HSWA s.2(3) notice). */
export const POLICY_NOTIFY_EMPLOYEE_ROLES = ["ANSATT", "VERNEOMBUD"] as const;
/** Roles that manage the written policy from the dashboard. */
export const POLICY_NOTIFY_MANAGER_ROLES = ["ADMIN", "HMS", "LEDER"] as const;

export type PolicyPart = "statement" | "organisation" | "arrangements";

export const POLICY_PART_LABELS: Record<PolicyPart, string> = {
  statement: "Part 1 — Statement of intent",
  organisation: "Part 2 — Organisation",
  arrangements: "Part 3 — Arrangements",
};

export const POLICY_PART_HINTS: Record<PolicyPart, string> = {
  statement:
    "HSWA s.2(3): the most senior person's commitment, and how it will be reviewed.",
  organisation:
    "Who does what. Competent person (MHSWR reg.7), safety representatives, consultation.",
  arrangements:
    "How you carry out the duties in practice. Only arrangements for modules this company has are listed.",
};

export type DefaultPolicySection = {
  sectionKey: string;
  sectionNumber: string;
  title: string;
  content: string;
  legalRef: string;
  sortOrder: number;
  moduleLink: string | null;
  policyPart: PolicyPart;
};

export const DEFAULT_POLICY_SECTIONS: readonly DefaultPolicySection[] = [
  {
    sectionKey: "s1",
    sectionNumber: "1",
    title: "Statement of intent",
    policyPart: "statement",
    legalRef: "HSWA 1974 s.2(3)",
    sortOrder: 1,
    moduleLink: null,
    content: `<p>This is the written health and safety policy required by section 2(3) of the Health and Safety at Work etc. Act 1974 (five or more employees).</p>
<p>The organisation will, so far as is reasonably practicable:</p>
<ul>
  <li>provide and maintain plant, systems of work and a workplace that are safe and without risks to health;</li>
  <li>make arrangements for the safe use, handling, storage and transport of articles and substances;</li>
  <li>provide information, instruction, training and supervision;</li>
  <li>maintain a safe means of access and egress;</li>
  <li>provide a working environment and welfare facilities that meet legal requirements.</li>
</ul>
<p>This policy will be reviewed at least annually, and after any significant change, RIDDOR event or enforcement visit. The Managing Director signs the statement of intent.</p>
<p>Detailed records are not duplicated here. They live in the linked HSEQ Nova modules.</p>`,
  },
  {
    sectionKey: "s2",
    sectionNumber: "2",
    title: "Organisation, roles and responsibilities",
    policyPart: "organisation",
    legalRef: "HSWA 1974 s.2(3); MHSWR 1999 reg.7",
    sortOrder: 2,
    moduleLink: "/dashboard/organisasjonskart",
    content: `<p>The Managing Director retains overall responsibility for health and safety.</p>
<ul>
  <li><strong>Competent person</strong> (MHSWR reg.7) — assists the employer to comply with health and safety law.</li>
  <li><strong>Line managers / supervisors</strong> — implement arrangements on their sites and close actions they own.</li>
  <li><strong>Safety representatives</strong> — appointed in line with SRSCWR 1977 where a recognised trade union exists; otherwise consult employees under HSCER 1996.</li>
  <li><strong>Fire marshal / responsible person</strong> — Fire Safety Order 2005.</li>
  <li><strong>Employees</strong> — cooperate, use equipment safely, and report hazards, accidents and near misses in the accident book.</li>
</ul>
<p>The organisation chart in HSEQ Nova is the live record of who holds which duty.</p>`,
  },
  {
    sectionKey: "s2b",
    sectionNumber: "3",
    title: "Consultation and safety representatives",
    policyPart: "organisation",
    legalRef: "SRSCWR 1977; HSCER 1996",
    sortOrder: 3,
    moduleLink: "/dashboard/health-safety-policy",
    content: `<p>We consult employees on health and safety in good time, including:</p>
<ul>
  <li>the introduction of measures that may affect health and safety;</li>
  <li>the appointment of competent persons;</li>
  <li>health and safety information and training;</li>
  <li>the health and safety consequences of new technology.</li>
</ul>
<p>Consultation meetings and minutes are the organisation's record of this duty. Safety representatives have the functions set out in SRSCWR 1977, including inspection and investigation of notifiable incidents.</p>`,
  },
  {
    sectionKey: "s2c",
    sectionNumber: "4",
    title: "Applicable law and regulations",
    policyPart: "organisation",
    legalRef: "HSWA 1974; MHSWR 1999",
    sortOrder: 4,
    moduleLink: "/dashboard/juridisk-register",
    content: `<p>The following are particularly relevant. The legal register is the live list for this company and industry:</p>
<ul>
  <li>Health and Safety at Work etc. Act 1974</li>
  <li>Management of Health and Safety at Work Regulations 1999</li>
  <li>RIDDOR 2013</li>
  <li>Social Security (Claims and Payments) Regulations 1979 (accident book)</li>
  <li>COSHH 2002</li>
  <li>Regulatory Reform (Fire Safety) Order 2005</li>
  <li>UK GDPR and the Data Protection Act 2018</li>
</ul>
<p>Industry add-ons bring in CDM 2015, PUWER, LOLER, Work at Height, food hygiene or other duties where they apply.</p>`,
  },
  {
    sectionKey: "s3",
    sectionNumber: "5",
    title: "Risk assessment",
    policyPart: "arrangements",
    legalRef: "MHSWR 1999 reg.3",
    sortOrder: 5,
    moduleLink: "/dashboard/risks",
    content: `<p>We make a suitable and sufficient assessment of the risks to employees and others who may be affected by our work, and of the risks arising from our undertaking to persons not in our employment (MHSWR reg.3).</p>
<p>Assessments are recorded, have an owner, and are reviewed when work changes or after an incident. Residual risk and actions are tracked in the risk module — they are not copied into this policy.</p>`,
  },
  {
    sectionKey: "s4",
    sectionNumber: "6",
    title: "Accident book and RIDDOR",
    policyPart: "arrangements",
    legalRef: "RIDDOR 2013; Social Security (Claims and Payments) Regulations 1979",
    sortOrder: 6,
    moduleLink: "/dashboard/incidents",
    content: `<p>All injuries, near misses and dangerous occurrences are recorded in the digital accident book. Digital records are lawful. Keep accident book entries for at least three years.</p>
<p>RIDDOR reporting to HSE:</p>
<ul>
  <li>death — without delay;</li>
  <li>specified injury — within 10 days;</li>
  <li>over-seven-day injury — within 15 days;</li>
  <li>occupational disease and listed dangerous occurrences — as prescribed.</li>
</ul>
<p>Near misses are not RIDDOR-reportable but are kept in the accident book so we can prevent recurrence. Official reports are submitted at <a href="https://www.hse.gov.uk/riddor/" target="_blank" rel="noreferrer">hse.gov.uk/riddor</a>.</p>`,
  },
  {
    sectionKey: "s5",
    sectionNumber: "7",
    title: "Training and competence",
    policyPart: "arrangements",
    legalRef: "HSWA 1974 s.2(2)(c); MHSWR 1999 reg.13",
    sortOrder: 7,
    moduleLink: "/dashboard/training",
    content: `<p>We provide information, instruction, training and supervision so that employees can work safely. This includes induction, job-specific competence, first aid and fire.</p>
<p>Capabilities are considered when allocating work (MHSWR reg.13). Training records and expiry dates live in the training module.</p>`,
  },
  {
    sectionKey: "s6",
    sectionNumber: "8",
    title: "Operational control and RAMS",
    policyPart: "arrangements",
    legalRef: "MHSWR 1999; CDM 2015",
    sortOrder: 8,
    moduleLink: "/dashboard/sja",
    content: `<p>Higher-risk work is controlled with a risk assessment and method statement (RAMS) before work starts. RAMS set out the sequence of work, hazards, controls and competence required.</p>
<p>On construction projects, CDM 2015 also requires a construction phase plan and, where notifiable, an F10. Live RAMS sit in the RAMS module.</p>`,
  },
  {
    sectionKey: "s7",
    sectionNumber: "9",
    title: "Fire safety and emergency",
    policyPart: "arrangements",
    legalRef: "Regulatory Reform (Fire Safety) Order 2005",
    sortOrder: 9,
    moduleLink: "/dashboard/fire-drills",
    content: `<p>The responsible person must take general fire precautions, make a fire risk assessment, and provide procedures for serious and imminent danger.</p>
<p>Fire marshals, extinguishers, escape routes, drills and evacuation are recorded in the fire drills module. Drills are held at intervals that keep the arrangements effective.</p>`,
  },
  {
    sectionKey: "s7a",
    sectionNumber: "10",
    title: "First aid",
    policyPart: "arrangements",
    legalRef: "Health and Safety (First-Aid) Regulations 1981",
    sortOrder: 9,
    moduleLink: null,
    content: `<p>We provide adequate and appropriate first-aid equipment, facilities and personnel so that employees can be given immediate help if they are injured or taken ill at work (Health and Safety (First-Aid) Regulations 1981).</p>
<p>What is adequate depends on the workplace, the hazards and the number of people. We assess this as part of our risk assessment.</p>
<ul>
  <li>first-aid kits are kept stocked and accessible;</li>
  <li>appointed persons and/or trained first aiders are named in the organisation chart;</li>
  <li>employees are told who the first aiders are and where equipment is kept;</li>
  <li>injuries treated at work are also entered in the accident book where they arise from work.</li>
</ul>
<p>There is no separate first-aid module. Names live in the organisation chart; injury records live in the accident book.</p>`,
  },
  {
    sectionKey: "s8",
    sectionNumber: "10",
    title: "Workplace inspections",
    policyPart: "arrangements",
    legalRef: "MHSWR 1999 reg.5",
    sortOrder: 10,
    moduleLink: "/dashboard/inspections",
    content: `<p>We monitor whether health and safety arrangements are implemented and effective (MHSWR reg.5). Workplace inspections and safety tours are planned, recorded and followed through to actions.</p>
<p>Safety representatives may also inspect the workplace in line with SRSCWR 1977. Findings live in the inspections module.</p>`,
  },
  {
    sectionKey: "s9",
    sectionNumber: "11",
    title: "Management review",
    policyPart: "arrangements",
    legalRef: "ISO 45001 cl. 9.3; MHSWR 1999 reg.5",
    sortOrder: 11,
    moduleLink: "/dashboard/management-reviews",
    content: `<p>Senior management reviews the health and safety management system at planned intervals: performance, incidents, audit results, legal changes and whether the policy remains suitable.</p>
<p>Minutes and decisions are kept in the management review module.</p>`,
  },
  {
    sectionKey: "s10",
    sectionNumber: "12",
    title: "Document control",
    policyPart: "arrangements",
    legalRef: "HSWA 1974 s.2(3); ISO 45001 cl. 7.5",
    sortOrder: 12,
    moduleLink: "/dashboard/documents",
    content: `<p>The written policy and supporting procedures are controlled documents: current version, owner, review date and access.</p>
<p>Employees must be able to see the current policy. Obsolete versions are archived, not left in circulation. Controlled files live in the documents module.</p>`,
  },
  {
    sectionKey: "s11",
    sectionNumber: "13",
    title: "Health and wellbeing",
    policyPart: "arrangements",
    legalRef: "HSWA 1974 s.2; MHSWR 1999",
    sortOrder: 13,
    moduleLink: null,
    content: `<p>The duty to ensure health includes physical and mental health. We assess work-related stress, violence, bullying and fatigue where they are foreseeable risks, and we provide occupational health input where the risk assessment requires it.</p>
<p>Stress, violence and fatigue are assessed as part of risk assessment. Work-related sickness may also belong in the accident book.</p>`,
  },
  {
    sectionKey: "s11b",
    sectionNumber: "14",
    title: "Whistleblowing",
    policyPart: "arrangements",
    legalRef: "PIDA 1998",
    sortOrder: 14,
    moduleLink: null,
    content: `<p>Workers who make a protected disclosure under the Public Interest Disclosure Act 1998 must not suffer detriment. This includes disclosures about health and safety dangers.</p>
<p>The internal channel, how we handle a disclosure, and who can be contacted are set out below and in the organisation chart. Employees may also contact HSE or another prescribed person.</p>`,
  },
  {
    sectionKey: "s12",
    sectionNumber: "15",
    title: "Environment, waste and COSHH",
    policyPart: "arrangements",
    legalRef: "COSHH 2002; Environmental Protection Act 1990",
    sortOrder: 15,
    moduleLink: "/dashboard/chemicals",
    content: `<p>Where we use hazardous substances, we prevent or adequately control exposure (COSHH). Assessments, safety data sheets and health surveillance records are held in the COSHH module. Health records required by COSHH are retained for 40 years.</p>
<p>Waste and environmental controls follow the Environmental Protection Act 1990 and any permit that applies to the site.</p>`,
  },
  {
    sectionKey: "s13",
    sectionNumber: "16",
    title: "Planning, monitoring and review",
    policyPart: "arrangements",
    legalRef: "MHSWR 1999 reg.5",
    sortOrder: 16,
    moduleLink: "/dashboard/inspections",
    content: `<p>We plan inspections, fire drills, training and management review so that health and safety arrangements are monitored and remain effective (MHSWR reg.5).</p>
<p>Live records sit in inspections, fire drills and training. There is no separate annual plan module.</p>`,
  },
  {
    sectionKey: "s14",
    sectionNumber: "17",
    title: "Internal audit",
    policyPart: "arrangements",
    legalRef: "ISO 45001 cl. 9.2",
    sortOrder: 17,
    moduleLink: "/dashboard/audits",
    content: `<p>Internal audits check whether the policy and arrangements are followed in practice. Findings become actions. Audit programmes and reports live in the audits module.</p>`,
  },
  {
    sectionKey: "s15",
    sectionNumber: "18",
    title: "Procedures and safe systems of work",
    policyPart: "arrangements",
    legalRef: "HSWA 1974 s.2(3) arrangements",
    sortOrder: 18,
    moduleLink: "/dashboard/documents",
    content: `<p>Arrangements in this policy are supported by controlled procedures and safe systems of work. The current version, owner and review date are held in Documents.</p>
<p>Employees must be able to see the current procedure. Obsolete versions are archived.</p>`,
  },
];

/** Addon modules a policy section needs. Missing key = always shown (HSWA core). */
export const POLICY_SECTION_REQUIRED_MODULES: Record<string, readonly string[]> = {
  s6: ["sja"],
  s9: ["audits"],
  s12: ["chemicals", "coshh", "environment"],
  s14: ["audits"],
};

const POLICY_MODULE_LINK_KEYS: Record<string, string> = {
  "/dashboard/sja": "sja",
  "/dashboard/chemicals": "chemicals",
  "/dashboard/audits": "audits",
  "/dashboard/management-reviews": "audits",
  "/dashboard/exposure-register": "chemicals",
  "/dashboard/construction-compliance": "constructionCompliance",
  "/dashboard/environment": "environment",
};

export function isPolicySectionEnabled(
  sectionKey: string,
  enabledModules: Iterable<string>,
): boolean {
  const required = POLICY_SECTION_REQUIRED_MODULES[sectionKey];
  if (!required || required.length === 0) return true;
  return required.some((key) => tenantHasModule(enabledModules, key));
}

export function policyModuleLinkIsActive(
  href: string | null | undefined,
  enabledModules: Iterable<string>,
): boolean {
  if (!href) return false;
  const key = POLICY_MODULE_LINK_KEYS[href];
  if (!key) return true;
  if (key === "chemicals") {
    return tenantHasModule(enabledModules, "chemicals") || tenantHasModule(enabledModules, "coshh");
  }
  return tenantHasModule(enabledModules, key);
}

export function simpleMenuIncludesHref(savedHrefs: string[], href: string): boolean {
  if (savedHrefs.includes(href)) return true;
  if (href === HEALTH_SAFETY_POLICY_PATH) {
    return savedHrefs.includes(HEALTH_SAFETY_POLICY_LEGACY_PATH);
  }
  return false;
}

export function policyPartForSectionKey(sectionKey: string): PolicyPart {
  const match = DEFAULT_POLICY_SECTIONS.find((s) => s.sectionKey === sectionKey);
  if (match) return match.policyPart;
  return "arrangements";
}

const NORWEGIAN_POLICY_MARKERS =
  /IK-HMS|AML\s*§|Arbeidsmiljø|Vernerunde|Avviksprosess|HMS-policy|HMS-håndbok|verneombud|Internkontroll|Årshjul|Varslerloven|Forurensningsloven|Medvirkning|HMS-organisering|Brannvern|yrkessykdom|Arbeidstilsynet/i;

function plainTextLength(html: string): number {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

export function findDefaultPolicySection(section: {
  sectionKey: string;
  sectionNumber?: string;
}): DefaultPolicySection | undefined {
  return (
    DEFAULT_POLICY_SECTIONS.find((d) => d.sectionKey === section.sectionKey) ??
    DEFAULT_POLICY_SECTIONS.find((d) => d.sectionNumber === section.sectionNumber)
  );
}

export function policySectionNeedsUkSync(stored: {
  sectionKey: string;
  sectionNumber?: string;
  title: string;
  content: string;
  legalRef: string | null;
}): boolean {
  const def = findDefaultPolicySection(stored);
  if (!def) {
    const blob = `${stored.title}\n${stored.content}\n${stored.legalRef ?? ""}`;
    return NORWEGIAN_POLICY_MARKERS.test(blob);
  }
  if (stored.title !== def.title) return true;
  if ((stored.legalRef ?? "") !== def.legalRef) return true;
  if (NORWEGIAN_POLICY_MARKERS.test(`${stored.title}\n${stored.content}\n${stored.legalRef ?? ""}`)) {
    return true;
  }
  if (plainTextLength(stored.content) < 280) return true;
  return false;
}

export function applyUkPolicyDefaults<T extends {
  sectionKey: string;
  sectionNumber: string;
  title: string;
  content: string;
  legalRef: string | null;
  moduleLink?: string | null;
}>(section: T): T {
  const def = findDefaultPolicySection(section);
  if (!def) return section;
  if (!policySectionNeedsUkSync(section)) return section;
  return {
    ...section,
    title: def.title,
    content: def.content,
    legalRef: def.legalRef,
    sectionNumber: def.sectionNumber,
    moduleLink: def.moduleLink,
  };
}
