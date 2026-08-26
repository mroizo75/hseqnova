/** HSWA 1974 s.2(2)(c) — information, instruction, training and supervision. */

export const PERSONNEL_DOCUMENT_TYPES = [
  {
    key: "cv",
    title: "Curriculum vitae (CV)",
    provider: "Personnel file",
    expires: false,
  },
  {
    key: "diploma",
    title: "Diploma / qualification",
    provider: "Awarding body",
    expires: false,
  },
  {
    key: "certificate",
    title: "Certificate",
    provider: "Training provider",
    expires: true,
  },
] as const;

export type PersonnelDocumentTypeKey = (typeof PERSONNEL_DOCUMENT_TYPES)[number]["key"];

export function formatTrainingDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB");
}
