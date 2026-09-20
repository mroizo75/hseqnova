export type Iso93ReviewFields = {
  previousActionsStatus?: string | null;
  interestedPartiesReview?: string | null;
  complianceEvaluationReview?: string | null;
  consultationReview?: string | null;
};

export type ManagementReviewActionItem = {
  title: string;
  ownerId: string;
  dueDate?: string | null;
};

const MIN_LENGTH = 8;

function filled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length >= MIN_LENGTH;
}

export function hasIso93Input(fields: Iso93ReviewFields): boolean {
  return (
    filled(fields.previousActionsStatus) &&
    filled(fields.interestedPartiesReview) &&
    filled(fields.complianceEvaluationReview) &&
    filled(fields.consultationReview)
  );
}

export function parseManagementReviewActions(raw: unknown): ManagementReviewActionItem[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = String(row.title ?? "").trim();
    const ownerId = String(row.ownerId ?? "").trim();
    if (!title || !ownerId) return [];
    return [
      {
        title,
        ownerId,
        dueDate: row.dueDate ? String(row.dueDate) : null,
      },
    ];
  });
}
