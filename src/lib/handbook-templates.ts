/**
 * UK Health & Safety Policy templates (HSWA s.2(3), INDG324).
 * The policy is a living table of contents that links into live modules.
 */

export type HandbookTemplateSectionContent = {
  sectionKey: string;
  content: string;
  moduleLink?: string;
};

export type HandbookTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  industry: string;
  sections: HandbookTemplateSectionContent[];
};

export const TEMPLATE_VARIABLES = [
  "companyName",
  "companyNumber",
  "managingDirector",
  "competentPerson",
  "safetyRepresentative",
  "fireMarshal",
  "firstAider",
  "address",
  "industry",
  "bedriftsnavn",
  "orgNummer",
  "dagligLeder",
  "hmsAnsvarlig",
  "verneombud",
  "brannvernleder",
  "adresse",
  "bransje",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

const UNIVERSAL_CONTENT: Record<string, string> = {
  s1: `<h2>Statement of intent</h2>
<p>{{companyName}} (Companies House no. {{companyNumber}}) is committed to providing a safe and healthy workplace for employees, contractors and visitors, in accordance with the Health and Safety at Work etc. Act 1974 and the Management of Health and Safety at Work Regulations 1999.</p>
<p>This policy will be reviewed at least annually, and after any significant change or incident.</p>
<p><strong>Signed:</strong> {{managingDirector}}, Managing Director<br/>
<strong>Date:</strong> [date of signature]</p>
<p>This living policy is the table of contents for how we manage HSEQ. Detailed records live in the linked HSEQ Nova modules — they are not duplicated here.</p>`,

  s2: `<h2>Organisation</h2>
<p>The Managing Director, <strong>{{managingDirector}}</strong>, retains overall responsibility for health and safety.</p>
<ul>
  <li><strong>Competent person:</strong> {{competentPerson}}</li>
  <li><strong>Safety representative:</strong> {{safetyRepresentative}}</li>
  <li><strong>Fire marshal:</strong> {{fireMarshal}}</li>
  <li><strong>First aider:</strong> {{firstAider}}</li>
</ul>
<p>See the organisation chart in HSEQ Nova for the current structure. Safety representatives are appointed in line with the Safety Representatives and Safety Committees Regulations 1977.</p>`,

  s2b: `<h3>Consultation and employee involvement</h3>
<p>We consult employees on health and safety matters. Employees must cooperate with this policy, use equipment safely, and report hazards, accidents and near misses through the accident book.</p>`,

  s2c: `<h3>Legal framework</h3>
<p>The following are particularly relevant to {{companyName}} in {{industry}}:</p>
<ul>
  <li>Health and Safety at Work etc. Act 1974</li>
  <li>Management of Health and Safety at Work Regulations 1999</li>
  <li>RIDDOR 2013</li>
  <li>COSHH 2002</li>
  <li>Regulatory Reform (Fire Safety) Order 2005</li>
  <li>UK GDPR and the Data Protection Act 2018</li>
</ul>
<p>Industry-specific duties (CDM 2015, Food Safety, PUWER, LOLER) apply where the relevant add-on module is active.</p>`,

  s3: `<h3>Arrangements — risk assessment</h3>
<p>We carry out suitable and sufficient risk assessments (MHSWR). Live assessments, residual risk and reviews are kept in the <a href="/dashboard/risks">risk module</a>.</p>`,

  s4: `<h3>Arrangements — accident book and RIDDOR</h3>
<p>All accidents, near misses and dangerous occurrences are recorded in the digital accident book. RIDDOR reportable events are flagged with the correct deadline (immediate / 10 days / 15 days). Records are kept for at least three years. See the <a href="/dashboard/incidents">accident book</a>.</p>`,

  s5: `<h3>Arrangements — safe systems of work</h3>
<p>Procedures and safe systems of work are maintained as live documents. See <a href="/dashboard/rutiner">procedures</a>.</p>`,

  s6: `<h3>Arrangements — workplace inspections</h3>
<p>Workplace inspections and safety tours are planned and recorded in the <a href="/dashboard/inspections">inspections</a> module. Findings become actions.</p>`,

  s7: `<h3>Arrangements — information, instruction and training</h3>
<p>Competency, induction and refresher training (including first aid and fire) is tracked in <a href="/dashboard/training">training</a>.</p>`,

  s8: `<h3>Arrangements — fire and emergency</h3>
<p>The responsible person under the Fire Safety Order maintains the fire risk assessment, fire marshals, drills and evacuation. Drills are logged in <a href="/dashboard/fire-drills">fire drills</a>.</p>`,

  s9: `<h3>Arrangements — first aid</h3>
<p>Adequate first-aid provision is maintained. Named first aiders: {{firstAider}}. First-aid records that relate to workplace injury are also entered in the accident book.</p>`,

  s10: `<h3>Arrangements — hazardous substances (COSHH)</h3>
<p>Where we use hazardous substances, COSHH assessments and SDS are held in the chemicals module (add-on). Health records are retained for 40 years where required.</p>`,

  s11: `<h3>Arrangements — construction (CDM 2015)</h3>
<p>Where we act as client, principal designer or principal contractor, CDM duty holders, the construction phase plan, F10 and the health and safety file are managed in the construction add-on.</p>`,

  s12: `<h3>Arrangements — annual H&amp;S plan</h3>
<p>The annual health and safety plan, objectives and management review sit in <a href="/dashboard/annual-hms-plan">the annual plan</a>.</p>`,

  s13: `<h3>Arrangements — occupational health</h3>
<p>Health surveillance is provided where the risk assessment identifies a need (noise, vibration, COSHH, night work). Records are kept in line with the relevant regulations.</p>`,

  s14: `<h3>Arrangements — display screen equipment</h3>
<p>DSE assessments are available for office-based roles. Employees may request an assessment at any time.</p>`,

  s15: `<h3>Review</h3>
<p>This policy is a living document. It is reviewed at least annually by {{managingDirector}} and after any significant change, RIDDOR event or enforcement visit. Version history is kept in HSEQ Nova.</p>`,
};

const INDUSTRY_OVERRIDES: Record<string, Record<string, string>> = {
  construction: {
    s2c: `${UNIVERSAL_CONTENT.s2c}
<h4>Construction</h4>
<ul>
  <li>Construction (Design and Management) Regulations 2015 — duty holders, CPP, F10, health and safety file</li>
  <li>Work at Height Regulations 2005</li>
  <li>Lifting Operations and Lifting Equipment Regulations 1998 (LOLER)</li>
  <li>Provision and Use of Work Equipment Regulations 1998 (PUWER)</li>
</ul>`,
  },
  hospitality: {
    s2c: `${UNIVERSAL_CONTENT.s2c}
<h4>Hospitality</h4>
<ul>
  <li>Food Safety and Hygiene (England) Regulations 2013 / equivalent in Scotland, Wales and NI</li>
  <li>HACCP and allergen information (FIR 2014)</li>
</ul>`,
  },
  healthcare: {
    s2c: `${UNIVERSAL_CONTENT.s2c}
<h4>Healthcare</h4>
<ul>
  <li>COSHH — biological agents and sharps</li>
  <li>Manual Handling Operations Regulations 1992</li>
</ul>`,
  },
  transport: {
    s2c: `${UNIVERSAL_CONTENT.s2c}
<h4>Transport</h4>
<ul>
  <li>Workplace Transport — HSE HSG136</li>
  <li>Working Time (Road Transport) where applicable</li>
</ul>`,
  },
};

const MODULE_LINKS: Record<string, string> = {
  s3: "/dashboard/risks",
  s4: "/dashboard/incidents",
  s5: "/dashboard/rutiner",
  s6: "/dashboard/inspections",
  s7: "/dashboard/training",
  s8: "/dashboard/fire-drills",
  s12: "/dashboard/annual-hms-plan",
};

export function buildIndustryTemplate(
  industryKey: string,
  industryLabel: string,
): HandbookTemplateDefinition {
  const overrides = INDUSTRY_OVERRIDES[industryKey] ?? {};

  const sections: HandbookTemplateSectionContent[] = Object.entries(UNIVERSAL_CONTENT).map(
    ([key, content]) => ({
      sectionKey: key,
      content: overrides[key] ?? content,
      moduleLink: MODULE_LINKS[key],
    }),
  );

  return {
    id: `template-${industryKey}`,
    name: `Health & Safety Policy — ${industryLabel}`,
    description: `Living H&S policy for ${industryLabel.toLowerCase()}, structured as statement, organisation and arrangements (HSWA s.2(3)).`,
    industry: industryKey,
    sections,
  };
}

export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>,
): string {
  const aliases: Record<string, string> = {
    bedriftsnavn: variables.companyName ?? variables.bedriftsnavn ?? "",
    orgNummer: variables.companyNumber ?? variables.orgNummer ?? "",
    dagligLeder: variables.managingDirector ?? variables.dagligLeder ?? "",
    hmsAnsvarlig: variables.competentPerson ?? variables.hmsAnsvarlig ?? "",
    verneombud: variables.safetyRepresentative ?? variables.verneombud ?? "",
    brannvernleder: variables.fireMarshal ?? variables.brannvernleder ?? "",
    adresse: variables.address ?? variables.adresse ?? "",
    bransje: variables.industry ?? variables.bransje ?? "",
    companyName: variables.companyName ?? variables.bedriftsnavn ?? "",
    companyNumber: variables.companyNumber ?? variables.orgNummer ?? "",
    managingDirector: variables.managingDirector ?? variables.dagligLeder ?? "",
    competentPerson: variables.competentPerson ?? variables.hmsAnsvarlig ?? "",
    safetyRepresentative: variables.safetyRepresentative ?? variables.verneombud ?? "",
    fireMarshal: variables.fireMarshal ?? variables.brannvernleder ?? "",
    firstAider: variables.firstAider ?? "",
    address: variables.address ?? variables.adresse ?? "",
    industry: variables.industry ?? variables.bransje ?? "",
  };

  let result = content;
  for (const [key, value] of Object.entries({ ...aliases, ...variables })) {
    result = result.replaceAll(`{{${key}}}`, value || `[${key}]`);
  }
  return result;
}

export function getAvailableTemplates(): Array<{
  id: string;
  name: string;
  description: string;
  industry: string;
}> {
  const industries: Array<{ key: string; label: string }> = [
    { key: "construction", label: "Construction" },
    { key: "hospitality", label: "Hospitality" },
    { key: "healthcare", label: "Healthcare" },
    { key: "transport", label: "Transport and logistics" },
    { key: "technology", label: "Offices and technology" },
    { key: "agriculture", label: "Agriculture" },
    { key: "manufacturing", label: "Manufacturing" },
    { key: "retail", label: "Retail" },
    { key: "education", label: "Education" },
    { key: "other", label: "General" },
  ];

  return industries.map(({ key, label }) => {
    const tpl = buildIndustryTemplate(key, label);
    return {
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      industry: key,
    };
  });
}
