"use server";

/** Norwegian Safety Intelligence — not offered in the UK product. */

export async function createApiKey(_name: string) {
  return { success: false, error: "Not available" };
}

export async function deactivateApiKey(_id: string) {
  return { success: false, error: "Not available" };
}

export async function getApiKeys() {
  return [];
}
