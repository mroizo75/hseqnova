import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { tenantCanUseGlobalFormTemplate } from "@/lib/form-template-industry";

type FormTemplateRow = {
  id: string;
  tenantId: string | null;
  title: string;
  description: string | null;
  category: string;
  isGlobal: boolean;
  isActive: boolean;
  industryScope: unknown;
  createdAt: string;
};

type FormFieldRow = {
  id: string;
  formTemplateId: string;
  fieldType: string;
  label: string;
  isRequired: boolean;
  order: number;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ forms: [] });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const showAll = searchParams.get("view") === "all";
    const db = getAdminDb();

    const [tenantFormsRes, globalFormsRes, tenantRes] = await Promise.all([
      db
        .from("FormTemplate")
        .select("id, tenantId, title, description, category, isGlobal, isActive, industryScope, createdAt")
        .eq("tenantId", tenantId)
        .eq("isActive", true),
      db
        .from("FormTemplate")
        .select("id, tenantId, title, description, category, isGlobal, isActive, industryScope, createdAt")
        .eq("isGlobal", true)
        .eq("isActive", true),
      db.from("Tenant").select("industry").eq("id", tenantId).maybeSingle(),
    ]);

    if (tenantFormsRes.error) {
      throw { code: "FORM_LIST_FAILED", message: tenantFormsRes.error.message };
    }
    if (globalFormsRes.error) {
      throw { code: "FORM_LIST_FAILED", message: globalFormsRes.error.message };
    }

    const seen = new Set<string>();
    const templates = [...(tenantFormsRes.data ?? []), ...(globalFormsRes.data ?? [])].filter((row) => {
      const template = row as FormTemplateRow;
      if (seen.has(template.id)) return false;
      seen.add(template.id);
      if (category && template.category !== category) return false;
      return true;
    }) as FormTemplateRow[];

    const templateIds = templates.map((template) => template.id);
    const { data: fieldRows, error: fieldsError } =
      templateIds.length === 0
        ? { data: [] as FormFieldRow[], error: null }
        : await db
            .from("FormField")
            .select("id, formTemplateId, fieldType, label, isRequired, order")
            .in("formTemplateId", templateIds)
            .order("order", { ascending: true });

    if (fieldsError) {
      throw { code: "FORM_FIELD_LIST_FAILED", message: fieldsError.message };
    }

    const fieldsByTemplate = new Map<string, FormFieldRow[]>();
    for (const field of (fieldRows ?? []) as FormFieldRow[]) {
      const list = fieldsByTemplate.get(field.formTemplateId) ?? [];
      list.push(field);
      fieldsByTemplate.set(field.formTemplateId, list);
    }

    const tenantIndustry = (tenantRes.data?.industry as string | null | undefined) ?? null;
    const scoped = templates
      .filter((form) =>
        tenantCanUseGlobalFormTemplate(form, tenantIndustry, { allTemplatesView: showAll }),
      )
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((form) => ({
        ...form,
        fields: (fieldsByTemplate.get(form.id) ?? []).sort((a, b) => a.order - b.order),
      }));

    return NextResponse.json({ forms: scoped });
  } catch (error: unknown) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message: string }).message)
        : "Could not load forms";
    return NextResponse.json({ code: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
