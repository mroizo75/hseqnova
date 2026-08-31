/**
 * Actions (further control) — UK legal basis.
 *
 * MHSWR 1999 reg.5 — make and give effect to arrangements for the effective
 * planning, organisation, control, monitoring and review of preventive and
 * protective measures. Write them down if there are five or more employees.
 *
 * HSG245 (HSE investigation workbook, not a statutory form) — the investigation
 * should produce an action plan. Each risk control measure needs what will be
 * done, who is responsible, and when. A named person is accountable. Monitor
 * implementation. Records stay with the employer — they are not submitted to
 * the HSE.
 *
 * Official: legislation.gov.uk/uksi/1999/3242/regulation/5
 *           hse.gov.uk/pubns/hsg245.htm
 */

export const MEASURE_CATEGORY_LABELS = {
  CORRECTIVE: "Corrective",
  PREVENTIVE: "Preventive",
  IMPROVEMENT: "Improvement",
  MITIGATION: "Risk reduction",
} as const;

export type MeasureCategoryKey = keyof typeof MEASURE_CATEGORY_LABELS;

export function measureCategoryLabel(category: string): string {
  return MEASURE_CATEGORY_LABELS[category as MeasureCategoryKey] ?? category;
}

/** HSG245: what, who, when on every action. */
export function validateHsg245Action(input: {
  title?: string | null;
  responsibleId?: string | null;
  dueAt?: Date | string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  const title = input.title?.trim() ?? "";
  if (title.length < 3) {
    return {
      ok: false,
      code: "ACTION_WHAT_REQUIRED",
      message: "Say what will be done (HSG245 — each control needs a specific action).",
    };
  }
  if (!input.responsibleId?.trim()) {
    return {
      ok: false,
      code: "ACTION_WHO_REQUIRED",
      message: "Name the person responsible (HSG245 — a specific person owns the action).",
    };
  }
  if (!input.dueAt) {
    return {
      ok: false,
      code: "ACTION_WHEN_REQUIRED",
      message: "Set a due date (HSG245 — each control needs a timescale).",
    };
  }
  const due = input.dueAt instanceof Date ? input.dueAt : new Date(input.dueAt);
  if (Number.isNaN(due.getTime())) {
    return {
      ok: false,
      code: "ACTION_WHEN_REQUIRED",
      message: "Set a valid due date (HSG245 — each control needs a timescale).",
    };
  }
  return { ok: true };
}

/**
 * HSG245: monitor implementation. The owner records what was done when they close it.
 * Starting work does not need a note.
 */
export function validateOwnerProgress(input: {
  status: string;
  completionNote?: string | null;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (input.status !== "IN_PROGRESS" && input.status !== "DONE") {
    return {
      ok: false,
      code: "ACTION_STATUS_INVALID",
      message: "You can mark the action in progress or complete.",
    };
  }
  if (input.status === "DONE") {
    const note = input.completionNote?.trim() ?? "";
    if (note.length < 10) {
      return {
        ok: false,
        code: "ACTION_DONE_NOTE_REQUIRED",
        message:
          "Say what was done (HSG245 — monitor implementation before you close the action).",
      };
    }
  }
  return { ok: true };
}

export function formatActionDueDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
