"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { submitSitemap } from "@/lib/google/search-console";
import { clearSeoDashboardCache } from "@/server/queries/seo-dashboard.queries";

type ActionResult = {
  success: boolean;
  error?: string;
};

async function isSuperAdmin(): Promise<boolean> {
  const staff = await requirePlatformStaff();
  return Boolean(staff?.isSuperAdmin);
}

function toFailure(error: unknown, fallback: string): ActionResult {
  if (error && typeof error === "object" && "message" in error) {
    return { success: false, error: String((error as { message: unknown }).message) };
  }
  return { success: false, error: fallback };
}

export async function resubmitSitemap(): Promise<ActionResult> {
  try {
    if (!(await isSuperAdmin())) {
      return { success: false, error: "Only super admins can submit the sitemap" };
    }
    await submitSitemap();
    clearSeoDashboardCache();
    revalidatePath("/admin/seo");
    return { success: true };
  } catch (error) {
    return toFailure(error, "Could not submit the sitemap");
  }
}

export async function refreshSeoDashboard(): Promise<ActionResult> {
  if (!(await isSuperAdmin())) {
    return { success: false, error: "Only super admins can refresh search data" };
  }
  clearSeoDashboardCache();
  revalidatePath("/admin/seo");
  return { success: true };
}
