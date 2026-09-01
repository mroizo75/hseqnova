"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

type LegalReferenceRow = {
  id: string;
  title: string;
  paragraphRef: string | null;
  description: string;
  sourceUrl: string;
  industries: unknown;
  sortOrder: number;
  lastVerifiedAt: string | Date | null;
};

function applicableForIndustry(industries: unknown, industry: string | null): boolean {
  if (!Array.isArray(industries) || industries.length === 0) return false;
  if (industries.includes("all")) return true;
  if (!industry) return false;
  return industries.includes(industry.toLowerCase());
}

export async function getLegalReferencesForIndustry(industry: string | null) {
  const { data, error } = await getAdminDb()
    .from("LegalReference")
    .select("*")
    .order("sortOrder", { ascending: true });
  if (error) {
    throw { code: "LEGAL_LOOKUP_FAILED", message: error.message };
  }
  return ((data ?? []) as LegalReferenceRow[]).filter((ref) =>
    applicableForIndustry(ref.industries, industry),
  );
}

async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw { code: "UNAUTHENTICATED", message: "Not authenticated" };
  }
  const { data: user, error } = await getAdminDb()
    .from("User")
    .select("id, isSuperAdmin, isSupport")
    .eq("email", session.user.email)
    .maybeSingle();
  if (error) {
    throw { code: "STAFF_LOOKUP_FAILED", message: error.message };
  }
  if (!user?.isSuperAdmin && !user?.isSupport) {
    throw { code: "FORBIDDEN", message: "Only staff can manage legal references" };
  }
}

export async function getAllLegalReferencesAdmin() {
  try {
    await requireStaff();
    const { data, error } = await getAdminDb()
      .from("LegalReference")
      .select("*")
      .order("sortOrder", { ascending: true });
    if (error) {
      throw { code: "LEGAL_LOOKUP_FAILED", message: error.message };
    }
    return { success: true as const, data: (data ?? []) as LegalReferenceRow[] };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not load legal references",
      data: [] as LegalReferenceRow[],
    };
  }
}

function parseLegalForm(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const paragraphRef = (formData.get("paragraphRef") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim();
  const sourceUrl = (formData.get("sourceUrl") as string)?.trim();
  const industriesRaw = formData.get("industries") as string;
  const sortOrder = parseInt(formData.get("sortOrder") as string, 10) || 0;
  if (!title || !description || !sourceUrl) {
    return null;
  }
  const industries = industriesRaw
    ? industriesRaw.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
    : ["all"];
  return {
    title,
    paragraphRef,
    description,
    sourceUrl,
    industries: industries.length > 0 ? industries : ["all"],
    sortOrder,
    lastVerifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function createLegalReference(formData: FormData) {
  try {
    await requireStaff();
    const payload = parseLegalForm(formData);
    if (!payload) {
      return { success: false, error: "Title, description and source URL are required" };
    }
    const { error } = await getAdminDb().from("LegalReference").insert({
      id: createId(),
      ...payload,
    });
    if (error) {
      throw { code: "LEGAL_CREATE_FAILED", message: error.message };
    }
    revalidatePath("/admin/legal-references");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create the legal reference",
    };
  }
}

export async function updateLegalReference(id: string, formData: FormData) {
  try {
    await requireStaff();
    const payload = parseLegalForm(formData);
    if (!payload) {
      return { success: false, error: "Title, description and source URL are required" };
    }
    const { error } = await getAdminDb().from("LegalReference").update(payload).eq("id", id);
    if (error) {
      throw { code: "LEGAL_UPDATE_FAILED", message: error.message };
    }
    revalidatePath("/admin/legal-references");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update the legal reference",
    };
  }
}

export async function deleteLegalReference(id: string) {
  try {
    await requireStaff();
    const { error } = await getAdminDb().from("LegalReference").delete().eq("id", id);
    if (error) {
      throw { code: "LEGAL_DELETE_FAILED", message: error.message };
    }
    revalidatePath("/admin/legal-references");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete the legal reference",
    };
  }
}
