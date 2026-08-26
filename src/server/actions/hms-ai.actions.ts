"use server";

/** Norwegian HMS Intelligence cockpit — not offered in the UK product. */

export async function getHmsCockpitData() {
  return { success: false as const, error: "Not available" };
}

export async function recalculateScoreNow() {
  return { success: false as const, error: "Not available" };
}

export async function getImprovementSuggestions() {
  return [];
}

export async function getImprovementTimeline() {
  return [];
}

export async function getAnonymizedStats(_periodStart?: Date) {
  return [];
}
