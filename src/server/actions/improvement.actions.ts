"use server";

/** Norwegian HMS Intelligence suggestions — not offered in the UK product. */

export async function acceptSuggestion(_suggestionId: string) {
  return { success: false, error: "Not available" };
}

export async function rejectSuggestion(_suggestionId: string, _reason?: string) {
  return { success: false, error: "Not available" };
}

export async function markSuggestionImplemented(_suggestionId: string, _note?: string) {
  return { success: false, error: "Not available" };
}

export async function reviewEffectiveness(_suggestionId: string, _effective?: boolean) {
  return { success: false, error: "Not available" };
}
