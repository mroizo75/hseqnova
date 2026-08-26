/**
 * COSHH 2002: assessments must be kept up to date and reviewed
 * when there is reason to suspect they are no longer valid.
 */
export function isChemicalReviewOverdue(nextReviewDate: Date | string | null, now = new Date()): boolean {
  if (!nextReviewDate) return false;
  return new Date(nextReviewDate) < now;
}

export function isChemicalReviewDueSoon(
  nextReviewDate: Date | string | null,
  days = 30,
  now = new Date(),
): boolean {
  if (!nextReviewDate) return false;
  const due = new Date(nextReviewDate);
  const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return due <= windowEnd;
}
