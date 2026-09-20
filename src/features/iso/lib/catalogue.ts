import { ALL_ISO_CLAUSES, type IsoClause, type IsoStandard } from "@/features/iso/lib/clauses";

export const ISO_45001_2018_VERSION_ID = "iso-45001-2018";
export const ISO_9001_2015_VERSION_ID = "iso-9001-2015";

export type IsoRequirementSeedRow = {
  id: string;
  versionId: string;
  clauseKey: string;
  clause: string;
  title: string;
  shallParaphrase: string;
  phase: string;
  evidenceKey: string;
  doThis: string;
  auditorHint: string;
  href: string;
};

export function requirementIdForClause(clauseKey: string): string {
  return `req-${clauseKey}`;
}

export function versionIdForStandard(standard: IsoStandard): string {
  return standard === "ISO_45001" ? ISO_45001_2018_VERSION_ID : ISO_9001_2015_VERSION_ID;
}

export function isoRequirementSeedRows(): IsoRequirementSeedRow[] {
  return ALL_ISO_CLAUSES.map((clause) => ({
    id: requirementIdForClause(clause.id),
    versionId: versionIdForStandard(clause.standard),
    clauseKey: clause.id,
    clause: clause.clause,
    title: clause.title,
    shallParaphrase: clause.shall,
    phase: clause.phase,
    evidenceKey: clause.evidenceKey,
    doThis: clause.doThis,
    auditorHint: clause.auditorHint,
    href: clause.href,
  }));
}

export function clauseFromRequirement(row: {
  clauseKey: string;
  clause: string;
  title: string;
  shallParaphrase: string;
  phase: string;
  evidenceKey: string;
  doThis: string;
  auditorHint: string;
  href: string;
  versionId: string;
}): IsoClause {
  const fromLibrary = ALL_ISO_CLAUSES.find((item) => item.id === row.clauseKey);
  if (fromLibrary) return fromLibrary;
  return {
    id: row.clauseKey,
    standard: row.versionId.includes("9001") ? "ISO_9001" : "ISO_45001",
    clause: row.clause,
    title: row.title,
    shall: row.shallParaphrase,
    href: row.href,
    evidenceKey: row.evidenceKey as IsoClause["evidenceKey"],
    doThis: row.doThis,
    auditorHint: row.auditorHint,
    phase: row.phase as IsoClause["phase"],
  };
}

export const PUBLISHED_ISO_VERSIONS = [
  { id: ISO_45001_2018_VERSION_ID, standard: "ISO_45001" as const, edition: "2018", status: "PUBLISHED" },
  { id: ISO_9001_2015_VERSION_ID, standard: "ISO_9001" as const, edition: "2015", status: "PUBLISHED" },
] as const;
