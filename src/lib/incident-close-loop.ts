/**
 * Closed loop for accident-book records (MHSWR 1999 arrangements; HSE HSG245).
 * An incident cannot be closed without a completed action, or a recorded decision that none is needed.
 */

export type CloseLoopInput = {
  measureStatuses: readonly string[];
  noActionReason?: string | null;
};

export type CloseLoopResult =
  | { ok: true; path: "actions" | "no_action" }
  | { ok: false; code: "ACTIONS_OPEN" | "NO_ACTION_REQUIRED" };

const MIN_REASON = 20;

export function evaluateIncidentCloseLoop(input: CloseLoopInput): CloseLoopResult {
  const statuses = input.measureStatuses;
  if (statuses.length > 0) {
    if (statuses.every((status) => status === "DONE")) {
      return { ok: true, path: "actions" };
    }
    return { ok: false, code: "ACTIONS_OPEN" };
  }

  const reason = input.noActionReason?.trim() ?? "";
  if (reason.length >= MIN_REASON) {
    return { ok: true, path: "no_action" };
  }
  return { ok: false, code: "NO_ACTION_REQUIRED" };
}

export const CLOSE_LOOP_MESSAGES: Record<"ACTIONS_OPEN" | "NO_ACTION_REQUIRED", string> = {
  ACTIONS_OPEN: "All actions must be completed before the incident can be closed",
  NO_ACTION_REQUIRED:
    "Add an action, or record why none is needed (at least 20 characters). MHSWR 1999 arrangements; HSE HSG245.",
};
