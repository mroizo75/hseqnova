import { ALL_ISO_CLAUSES, type IsoClause } from "@/features/iso/lib/clauses";

export function clauseDossierHref(clauseKey: string): string {
  return `/dashboard/iso/clauses/${encodeURIComponent(clauseKey)}`;
}

export function clausesNeedingControlledDocument(): IsoClause[] {
  return ALL_ISO_CLAUSES.filter((clause) => clause.needsControlledDocument === true);
}

/** ISO 9001:2015 4.3 — exclusions limited to clause 8; 8.3 must be justified in writing. */
export function isJustifiedDesignExclusion(input: {
  excludeDesign: boolean;
  excludeDesignJustification?: string | null;
}): boolean {
  const justification = input.excludeDesignJustification?.trim() ?? "";
  return input.excludeDesign && justification.length >= 20;
}

export function missingControlledDocumentClauses(approvedClauseKeys: Iterable<string>): IsoClause[] {
  const linked = new Set(approvedClauseKeys);
  return clausesNeedingControlledDocument().filter((clause) => {
    if (clause.id === "9001-8.3") return false;
    return !linked.has(clause.id);
  });
}
