"use server";

/** Norwegian Safety Intelligence — not offered in the UK product. */

export async function getIntelligenceConsent() {
  return null;
}

export async function updateIntelligenceConsent(_optIn: boolean) {
  return { success: false, error: "Not available" };
}
