export const COMPETENCY_SCHEMES = [
  "IOSH",
  "NEBOSH",
  "CSCS",
  "FAW",
  "EFAW",
  "SSSTS",
  "SMSTS",
] as const;

export type CompetencyScheme = (typeof COMPETENCY_SCHEMES)[number];
