/**
 * Controlled H&S documents — UK legal basis.
 *
 * HSWA 1974 s.2(2)(c) — information, instruction, training and supervision.
 * MHSWR 1999 reg.10 — comprehensible and relevant information on risks and
 *   the preventive and protective measures.
 * MHSWR 1999 reg.5 — write down the arrangements where there are five or
 *   more employees.
 * HSE HSG65 — keep health and safety documents functional, concise and
 *   current. The working copy employees follow must be the approved version,
 *   not a draft in progress.
 *
 * There is no statutory document-control form and no duty to track paper
 * copies or collect a read-receipt on every procedure. Records stay with
 * the employer — they are not submitted to the HSE.
 *
 * Official: legislation.gov.uk/uksi/1999/3242/regulation/10
 *           hse.gov.uk/pubns/books/hsg65.htm
 */

export const DOCUMENT_KIND_LABELS = {
  LAW: "Laws and regulations",
  PROCEDURE: "Procedure",
  CHECKLIST: "Checklist",
  FORM: "Form",
  SDS: "Safety data sheet (SDS)",
  PLAN: "Plan",
  OTHER: "Other",
} as const;

export type DocumentKindKey = keyof typeof DOCUMENT_KIND_LABELS;

export function documentKindLabel(kind: string): string {
  return DOCUMENT_KIND_LABELS[kind as DocumentKindKey] ?? kind;
}

export function parseVisibleToRoles(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const roles = raw.map(String).filter(Boolean);
    return roles.length > 0 ? roles : null;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return parseVisibleToRoles(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

/** The copy employees must follow — approved, and still in date if a validity end is set. */
export function isCurrentWorkingCopy(input: {
  status: string;
  effectiveTo?: Date | string | null;
  now?: Date;
}): boolean {
  if (input.status !== "APPROVED") return false;
  if (!input.effectiveTo) return true;
  const end = input.effectiveTo instanceof Date ? input.effectiveTo : new Date(input.effectiveTo);
  if (Number.isNaN(end.getTime())) return true;
  return end.getTime() >= (input.now ?? new Date()).getTime();
}

export function employeeMaySeeDocument(input: {
  status: string;
  visibleToRoles: unknown;
  role: string;
  effectiveTo?: Date | string | null;
  now?: Date;
}): boolean {
  if (!isCurrentWorkingCopy(input)) return false;
  const roles = parseVisibleToRoles(input.visibleToRoles);
  if (!roles) return true;
  return roles.includes(input.role);
}

/** Drafts and pending files are for people who create or approve documents. */
export function mayOpenDocumentFile(input: {
  status: string;
  visibleToRoles: unknown;
  effectiveTo?: Date | string | null;
  role: string;
  canCreateDocuments: boolean;
  canApproveDocuments: boolean;
}): boolean {
  if (input.canCreateDocuments || input.canApproveDocuments) return true;
  return employeeMaySeeDocument(input);
}
