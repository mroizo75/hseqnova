/**
 * ISO 45001:2018 and ISO 9001:2015 clause library for the IMS pack.
 * Evidence is live HSEQ Nova records — not a parallel ISO form.
 */

export type IsoStandard = "ISO_45001" | "ISO_9001";
export type IsoPhaseId =
  | "context"
  | "leadership"
  | "planning"
  | "support"
  | "operation"
  | "performance"
  | "improvement";
export type IsoEvidenceKey =
  | "context"
  | "interestedParties"
  | "scope"
  | "policy"
  | "qualityPolicy"
  | "roles"
  | "consultation"
  | "risks"
  | "opportunities"
  | "legalRegister"
  | "complianceEvaluation"
  | "objectives"
  | "competence"
  | "awareness"
  | "communication"
  | "documents"
  | "operationalControl"
  | "hierarchy"
  | "moc"
  | "procurement"
  | "emergency"
  | "monitoring"
  | "customer"
  | "internalAudit"
  | "managementReview"
  | "incidents"
  | "correctiveAction"
  | "continualImprovement";

export type IsoClause = {
  id: string;
  standard: IsoStandard;
  clause: string;
  title: string;
  shall: string;
  href: string;
  evidenceKey: IsoEvidenceKey;
  doThis: string;
  auditorHint: string;
  phase: IsoPhaseId;
};

export const ISO_PHASES: readonly { id: IsoPhaseId; title: string; gain: string }[] = [
  { id: "context", title: "Context", gain: "The organisation, interested parties and scope are written down." },
  { id: "leadership", title: "Leadership", gain: "Policy, roles and worker consultation are on record." },
  { id: "planning", title: "Planning", gain: "Risks, legal duties and objectives drive the work." },
  { id: "support", title: "Support", gain: "Competence, documents and communication are controlled." },
  { id: "operation", title: "Operation", gain: "Day-to-day controls, change and emergency arrangements run." },
  { id: "performance", title: "Performance", gain: "The system is monitored, audited and reviewed by management." },
  { id: "improvement", title: "Improvement", gain: "Incidents and nonconformities become verified actions." },
];

export const ISO_45001_CLAUSES: readonly IsoClause[] = [
  {
    id: "45001-4.1",
    standard: "ISO_45001",
    clause: "4.1",
    title: "Context of the organisation",
    shall: "Determine internal and external issues relevant to the OH&S management system.",
    href: "/dashboard/iso/context",
    evidenceKey: "context",
    doThis: "Record the internal and external issues that affect health and safety.",
    auditorHint: "Open Context — internal and external issues with a review date.",
    phase: "context",
  },
  {
    id: "45001-4.2",
    standard: "ISO_45001",
    clause: "4.2",
    title: "Needs and expectations of workers and other interested parties",
    shall: "Determine interested parties and their relevant needs and expectations.",
    href: "/dashboard/iso/context",
    evidenceKey: "interestedParties",
    doThis: "List workers, contractors, customers and regulators, and what they need from OH&S.",
    auditorHint: "Interested-party register with needs, expectations and how you consult them.",
    phase: "context",
  },
  {
    id: "45001-4.3",
    standard: "ISO_45001",
    clause: "4.3",
    title: "Scope of the OH&S management system",
    shall: "Determine and document the boundaries and applicability of the OH&S system.",
    href: "/dashboard/iso/context",
    evidenceKey: "scope",
    doThis: "Write and approve the OH&S scope, including sites and any exclusions.",
    auditorHint: "Approved scope statement with inclusions and exclusions.",
    phase: "context",
  },
  {
    id: "45001-4.4",
    standard: "ISO_45001",
    clause: "4.4",
    title: "OH&S management system",
    shall: "Establish, implement, maintain and continually improve the OH&S management system.",
    href: "/dashboard/iso",
    evidenceKey: "continualImprovement",
    doThis: "Keep using HSEQ Nova as the live OH&S and quality management system.",
    auditorHint: "Clause map, work guide and live records across the modules.",
    phase: "improvement",
  },
  {
    id: "45001-5.1",
    standard: "ISO_45001",
    clause: "5.1",
    title: "Leadership and commitment",
    shall: "Top management shall demonstrate leadership and commitment to the OH&S system.",
    href: "/dashboard/health-safety-policy",
    evidenceKey: "policy",
    doThis: "Publish and sign the statement of intent. Review it after significant change.",
    auditorHint: "Signed health and safety policy, statement of intent, last review date.",
    phase: "leadership",
  },
  {
    id: "45001-5.2",
    standard: "ISO_45001",
    clause: "5.2",
    title: "OH&S policy",
    shall: "Establish, implement and maintain an OH&S policy that is available and communicated.",
    href: "/dashboard/health-safety-policy",
    evidenceKey: "policy",
    doThis: "Keep the living policy current and visible to employees.",
    auditorHint: "Published policy with organisation and arrangements linked to modules.",
    phase: "leadership",
  },
  {
    id: "45001-5.3",
    standard: "ISO_45001",
    clause: "5.3",
    title: "Organisational roles, responsibilities and authorities",
    shall: "Assign and communicate OH&S roles, responsibilities and authorities.",
    href: "/dashboard/organisasjonskart",
    evidenceKey: "roles",
    doThis: "Keep the organisation chart as the live record of who holds which duty.",
    auditorHint: "Organisation chart with competent person and safety representatives.",
    phase: "leadership",
  },
  {
    id: "45001-5.4",
    standard: "ISO_45001",
    clause: "5.4",
    title: "Consultation and participation of workers",
    shall: "Establish processes for consultation and participation of workers at all levels.",
    href: "/dashboard/meetings",
    evidenceKey: "consultation",
    doThis: "Record consultation meetings, who attended, and the decisions taken.",
    auditorHint: "Consultation minutes with attendance and decisions.",
    phase: "leadership",
  },
  {
    id: "45001-6.1.2",
    standard: "ISO_45001",
    clause: "6.1.2",
    title: "Hazard identification and assessment of risks and opportunities",
    shall: "Establish processes for ongoing hazard identification and assessment of OH&S risks.",
    href: "/dashboard/risks",
    evidenceKey: "risks",
    doThis: "Keep risk assessments current. Record who took part (consultation).",
    auditorHint: "Risk assessments with participants, hierarchy of controls, review dates.",
    phase: "planning",
  },
  {
    id: "45001-6.1.1",
    standard: "ISO_45001",
    clause: "6.1.1",
    title: "Actions to address risks and opportunities",
    shall: "Determine risks and opportunities that need to be addressed to achieve intended outcomes.",
    href: "/dashboard/risks",
    evidenceKey: "opportunities",
    doThis: "Record OH&S opportunities as well as hazards, and plan actions.",
    auditorHint: "Risks plus opportunities, with actions owned and dated.",
    phase: "planning",
  },
  {
    id: "45001-6.1.3",
    standard: "ISO_45001",
    clause: "6.1.3",
    title: "Determination of legal requirements and other requirements",
    shall: "Determine and have access to up-to-date legal requirements and other requirements.",
    href: "/dashboard/legal-register",
    evidenceKey: "legalRegister",
    doThis: "Maintain the legal register for the work this company actually does.",
    auditorHint: "Tenant legal register with owner and next evaluation date.",
    phase: "planning",
  },
  {
    id: "45001-6.2",
    standard: "ISO_45001",
    clause: "6.2",
    title: "OH&S objectives and planning to achieve them",
    shall: "Establish OH&S objectives that are measurable, monitored, communicated and updated.",
    href: "/dashboard/goals",
    evidenceKey: "objectives",
    doThis: "Set measurable OH&S objectives with an owner, target and deadline.",
    auditorHint: "Active OH&S objectives with measurements.",
    phase: "planning",
  },
  {
    id: "45001-7.2",
    standard: "ISO_45001",
    clause: "7.2",
    title: "Competence",
    shall: "Determine necessary competence, ensure workers are competent, and retain evidence.",
    href: "/dashboard/training",
    evidenceKey: "competence",
    doThis: "Close expired training and keep the competence matrix current.",
    auditorHint: "Competence matrix with no overdue required training.",
    phase: "support",
  },
  {
    id: "45001-7.3",
    standard: "ISO_45001",
    clause: "7.3",
    title: "Awareness",
    shall: "Workers shall be aware of the OH&S policy, their contribution, and implications of not conforming.",
    href: "/dashboard/health-safety-policy",
    evidenceKey: "awareness",
    doThis: "Notify employees of the current policy and keep acknowledgement records.",
    auditorHint: "Policy notifications / employee acknowledgements.",
    phase: "support",
  },
  {
    id: "45001-7.4",
    standard: "ISO_45001",
    clause: "7.4",
    title: "Communication",
    shall: "Establish processes for internal and external OH&S communication.",
    href: "/dashboard/iso/context",
    evidenceKey: "communication",
    doThis: "Record how OH&S information is communicated to workers and other parties.",
    auditorHint: "Interested-party consultation method plus safety board / policy notice.",
    phase: "support",
  },
  {
    id: "45001-7.5",
    standard: "ISO_45001",
    clause: "7.5",
    title: "Documented information",
    shall: "Control documented information so it is available, suitable, and protected from unintended use.",
    href: "/dashboard/documents",
    evidenceKey: "documents",
    doThis: "Keep controlled documents versioned, approved and reviewed.",
    auditorHint: "Approved documents with version, owner and next review.",
    phase: "support",
  },
  {
    id: "45001-8.1.1",
    standard: "ISO_45001",
    clause: "8.1.1",
    title: "Operational planning and control",
    shall: "Plan, implement, control and maintain processes needed to meet OH&S requirements.",
    href: "/dashboard/inspections",
    evidenceKey: "operationalControl",
    doThis: "Run inspections, RAMS, COSHH and permits for the work you actually do.",
    auditorHint: "Inspections and operational add-ons (RAMS, COSHH, CDM) in use.",
    phase: "operation",
  },
  {
    id: "45001-8.1.2",
    standard: "ISO_45001",
    clause: "8.1.2",
    title: "Eliminating hazards and reducing OH&S risks",
    shall: "Apply the hierarchy of controls: eliminate, substitute, engineer, administer, PPE.",
    href: "/dashboard/risks",
    evidenceKey: "hierarchy",
    doThis: "Record controls against the hierarchy on each significant risk.",
    auditorHint: "Risk controls typed as elimination through PPE.",
    phase: "operation",
  },
  {
    id: "45001-8.1.3",
    standard: "ISO_45001",
    clause: "8.1.3",
    title: "Management of change",
    shall: "Control planned temporary and permanent changes that affect OH&S performance.",
    href: "/dashboard/changes",
    evidenceKey: "moc",
    doThis: "Assess each significant change before it is implemented.",
    auditorHint: "Change records with risk, training and document impact, then approval.",
    phase: "operation",
  },
  {
    id: "45001-8.1.4",
    standard: "ISO_45001",
    clause: "8.1.4",
    title: "Procurement",
    shall: "Control the procurement of products and services, contractors and outsourcing.",
    href: "/dashboard/contractors",
    evidenceKey: "procurement",
    doThis: "Prequalify contractors and control their OH&S information before they start.",
    auditorHint: "Contractor prequalification and host information.",
    phase: "operation",
  },
  {
    id: "45001-8.2",
    standard: "ISO_45001",
    clause: "8.2",
    title: "Emergency preparedness and response",
    shall: "Establish, implement and maintain processes needed to prepare for and respond to emergencies.",
    href: "/dashboard/fire-drills",
    evidenceKey: "emergency",
    doThis: "Keep the fire risk assessment current and record drills.",
    auditorHint: "Fire risk assessment plus a drill in the last 12 months.",
    phase: "operation",
  },
  {
    id: "45001-9.1.1",
    standard: "ISO_45001",
    clause: "9.1.1",
    title: "Monitoring, measurement, analysis and evaluation",
    shall: "Determine what to monitor and measure, and evaluate OH&S performance.",
    href: "/dashboard/hseq-cockpit",
    evidenceKey: "monitoring",
    doThis: "Use the HSEQ overview and objectives to watch performance.",
    auditorHint: "Cockpit, inspections and objective measurements.",
    phase: "performance",
  },
  {
    id: "45001-9.1.2",
    standard: "ISO_45001",
    clause: "9.1.2",
    title: "Evaluation of compliance",
    shall: "Establish processes to evaluate fulfilment of legal requirements and other requirements.",
    href: "/dashboard/legal-register",
    evidenceKey: "complianceEvaluation",
    doThis: "Evaluate each legal requirement at planned intervals and keep the result.",
    auditorHint: "Compliance evaluations with result and next date — not only a list of laws.",
    phase: "performance",
  },
  {
    id: "45001-9.2",
    standard: "ISO_45001",
    clause: "9.2",
    title: "Internal audit",
    shall: "Conduct internal audits at planned intervals to provide information on whether the system conforms.",
    href: "/dashboard/audits",
    evidenceKey: "internalAudit",
    doThis: "Plan and complete an internal audit against ISO 45001 clauses.",
    auditorHint: "Completed internal audit with findings linked to 45001 clauses.",
    phase: "performance",
  },
  {
    id: "45001-9.3",
    standard: "ISO_45001",
    clause: "9.3",
    title: "Management review",
    shall: "Top management shall review the OH&S management system at planned intervals.",
    href: "/dashboard/management-reviews",
    evidenceKey: "managementReview",
    doThis: "Hold a management review using the inputs this system prefills.",
    auditorHint: "Completed management review minutes with decisions and next date.",
    phase: "performance",
  },
  {
    id: "45001-10.2",
    standard: "ISO_45001",
    clause: "10.2",
    title: "Incident, nonconformity and corrective action",
    shall: "React to incidents, evaluate, take action, review effectiveness and make changes if needed.",
    href: "/dashboard/incidents",
    evidenceKey: "incidents",
    doThis: "Close accident-book entries with root cause, action and effectiveness.",
    auditorHint: "Incidents with actions; effectiveness evaluated before close.",
    phase: "improvement",
  },
  {
    id: "45001-10.3",
    standard: "ISO_45001",
    clause: "10.3",
    title: "Continual improvement",
    shall: "Continually improve the suitability, adequacy and effectiveness of the OH&S system.",
    href: "/dashboard/actions",
    evidenceKey: "continualImprovement",
    doThis: "Raise improvement actions from audits, reviews and incidents, and verify them.",
    auditorHint: "Improvement actions closed with effectiveness recorded.",
    phase: "improvement",
  },
];

export const ISO_9001_CLAUSES: readonly IsoClause[] = [
  {
    id: "9001-4.1",
    standard: "ISO_9001",
    clause: "4.1",
    title: "Understanding the organisation and its context",
    shall: "Determine internal and external issues relevant to the quality management system.",
    href: "/dashboard/iso/context",
    evidenceKey: "context",
    doThis: "Use the same context register — mark quality relevance where it applies.",
    auditorHint: "Context issues covering quality as well as OH&S.",
    phase: "context",
  },
  {
    id: "9001-4.2",
    standard: "ISO_9001",
    clause: "4.2",
    title: "Understanding the needs and expectations of interested parties",
    shall: "Determine interested parties and their requirements relevant to the QMS.",
    href: "/dashboard/iso/context",
    evidenceKey: "interestedParties",
    doThis: "Include customers and suppliers in the interested-party register.",
    auditorHint: "Interested parties including customers.",
    phase: "context",
  },
  {
    id: "9001-4.3",
    standard: "ISO_9001",
    clause: "4.3",
    title: "Determining the scope of the quality management system",
    shall: "Determine the boundaries and applicability of the QMS.",
    href: "/dashboard/iso/context",
    evidenceKey: "scope",
    doThis: "Record the quality scope alongside the OH&S scope.",
    auditorHint: "Approved quality scope on the same scope record.",
    phase: "context",
  },
  {
    id: "9001-5.2",
    standard: "ISO_9001",
    clause: "5.2",
    title: "Quality policy",
    shall: "Establish, implement and maintain a quality policy that is communicated.",
    href: "/dashboard/health-safety-policy",
    evidenceKey: "qualityPolicy",
    doThis: "Publish a quality policy section in the living policy, or a controlled quality-policy document.",
    auditorHint: "Quality policy section or approved document titled Quality policy.",
    phase: "leadership",
  },
  {
    id: "9001-5.3",
    standard: "ISO_9001",
    clause: "5.3",
    title: "Organisational roles, responsibilities and authorities",
    shall: "Assign and communicate QMS roles, responsibilities and authorities.",
    href: "/dashboard/organisasjonskart",
    evidenceKey: "roles",
    doThis: "Show quality responsibilities on the organisation chart.",
    auditorHint: "Organisation chart covering quality as well as health and safety.",
    phase: "leadership",
  },
  {
    id: "9001-6.1",
    standard: "ISO_9001",
    clause: "6.1",
    title: "Actions to address risks and opportunities",
    shall: "Determine risks and opportunities that need to be addressed.",
    href: "/dashboard/risks",
    evidenceKey: "risks",
    doThis: "Assess quality risks and opportunities in the same risk module.",
    auditorHint: "Risk assessments covering process and quality risk where relevant.",
    phase: "planning",
  },
  {
    id: "9001-6.2",
    standard: "ISO_9001",
    clause: "6.2",
    title: "Quality objectives and planning to achieve them",
    shall: "Establish quality objectives at relevant functions, levels and processes.",
    href: "/dashboard/goals",
    evidenceKey: "objectives",
    doThis: "Set measurable quality objectives with an owner and target.",
    auditorHint: "Active quality objectives with measurements.",
    phase: "planning",
  },
  {
    id: "9001-7.2",
    standard: "ISO_9001",
    clause: "7.2",
    title: "Competence",
    shall: "Determine and ensure the necessary competence of persons doing work under the QMS.",
    href: "/dashboard/training",
    evidenceKey: "competence",
    doThis: "Keep competence records for roles that affect quality of work.",
    auditorHint: "Competence matrix.",
    phase: "support",
  },
  {
    id: "9001-7.5",
    standard: "ISO_9001",
    clause: "7.5",
    title: "Documented information",
    shall: "Control documented information required by the QMS and by this standard.",
    href: "/dashboard/documents",
    evidenceKey: "documents",
    doThis: "Control procedures for the work you do — including product or service processes.",
    auditorHint: "Versioned, approved documents. Process documents cover 8.2–8.6 where relevant.",
    phase: "support",
  },
  {
    id: "9001-8.4",
    standard: "ISO_9001",
    clause: "8.4",
    title: "Control of externally provided processes, products and services",
    shall: "Ensure that externally provided processes, products and services conform to requirements.",
    href: "/dashboard/contractors",
    evidenceKey: "procurement",
    doThis: "Control contractors and suppliers through prequalification.",
    auditorHint: "Contractor / supplier control records.",
    phase: "operation",
  },
  {
    id: "9001-8.5",
    standard: "ISO_9001",
    clause: "8.5",
    title: "Production and service provision",
    shall: "Implement production and service provision under controlled conditions.",
    href: "/dashboard/documents",
    evidenceKey: "operationalControl",
    doThis: "Keep controlled procedures or RAMS for how work is carried out.",
    auditorHint: "Controlled process documents or RAMS — not a manufacturing ERP.",
    phase: "operation",
  },
  {
    id: "9001-9.1",
    standard: "ISO_9001",
    clause: "9.1",
    title: "Monitoring, measurement, analysis and evaluation",
    shall: "Determine what to monitor and measure, and evaluate QMS performance and customer satisfaction.",
    href: "/dashboard/hseq-cockpit",
    evidenceKey: "monitoring",
    doThis: "Watch objectives and customer feedback alongside HSEQ performance.",
    auditorHint: "Objectives, cockpit and any customer feedback records.",
    phase: "performance",
  },
  {
    id: "9001-9.2",
    standard: "ISO_9001",
    clause: "9.2",
    title: "Internal audit",
    shall: "Conduct internal audits at planned intervals.",
    href: "/dashboard/audits",
    evidenceKey: "internalAudit",
    doThis: "Include ISO 9001 clauses in the internal audit programme.",
    auditorHint: "Internal audit with 9001 clause findings.",
    phase: "performance",
  },
  {
    id: "9001-9.3",
    standard: "ISO_9001",
    clause: "9.3",
    title: "Management review",
    shall: "Top management shall review the QMS at planned intervals.",
    href: "/dashboard/management-reviews",
    evidenceKey: "managementReview",
    doThis: "Cover quality performance in the same management review.",
    auditorHint: "Management review minutes covering QMS inputs.",
    phase: "performance",
  },
  {
    id: "9001-10.2",
    standard: "ISO_9001",
    clause: "10.2",
    title: "Nonconformity and corrective action",
    shall: "When a nonconformity occurs, react, evaluate, take action and review effectiveness.",
    href: "/dashboard/incidents",
    evidenceKey: "correctiveAction",
    doThis: "Treat quality nonconformities in the accident book / actions with effectiveness review.",
    auditorHint: "Nonconformities with root cause, action and effectiveness.",
    phase: "improvement",
  },
];

export const ALL_ISO_CLAUSES: readonly IsoClause[] = [...ISO_45001_CLAUSES, ...ISO_9001_CLAUSES];

export function clausesForStandard(standard: IsoStandard | "BOTH"): readonly IsoClause[] {
  if (standard === "ISO_45001") return ISO_45001_CLAUSES;
  if (standard === "ISO_9001") return ISO_9001_CLAUSES;
  return ALL_ISO_CLAUSES;
}

export function auditClauseOptions(): { value: string; label: string }[] {
  return ALL_ISO_CLAUSES.map((clause) => ({
    value: `${clause.standard === "ISO_45001" ? "45001" : "9001"}:${clause.clause}`,
    label: `${clause.standard === "ISO_45001" ? "ISO 45001" : "ISO 9001"} ${clause.clause} — ${clause.title}`,
  }));
}
