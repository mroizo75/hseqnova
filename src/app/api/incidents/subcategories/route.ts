import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import type { IncidentType } from "@prisma/client";
import { getIncidentIndustryScopes } from "@/lib/tenant-features";

type SubcategoryOption = {
  id: string;
  key: string;
  label: string;
  industry: string;
  tenantId: string | null;
};

const HEALTHCARE_FALLBACK_SUBCATEGORIES: Partial<
  Record<IncidentType, Array<{ key: string; label: string; industry: string }>>
> = {
  ULYKKE: [
    { key: "PASIENTFORFLYTNING", label: "Patient handling / musculoskeletal injury", industry: "HELSE" },
    { key: "VOLD_TRUSLER", label: "Violence or threats from a service user / relative", industry: "HELSE" },
    { key: "STIKK_KUTT", label: "Needlestick or cut injury", industry: "HELSE" },
  ],
  NESTEN: [
    { key: "NESTEN_MEDIKAMENT", label: "Near miss in medication handling", industry: "HELSE" },
    { key: "NESTEN_FALL", label: "Near miss fall during a home visit", industry: "HELSE" },
  ],
  FARLIG_SITUASJON: [
    { key: "ALENEARBEID", label: "Lone working with elevated risk", industry: "HELSE" },
    { key: "SMITTE_RISIKO", label: "Infection risk during an assignment", industry: "HELSE" },
  ],
  YRKESSYKDOM: [
    { key: "BIOLOGISK_EKSPONERING", label: "Biological exposure", industry: "HELSE" },
    { key: "MUSKEL_SKJELETT", label: "Musculoskeletal disorder", industry: "HELSE" },
  ],
};

function mergeFallbackSubcategories(
  type: IncidentType,
  existingOptions: SubcategoryOption[],
  industryScopes: string[],
): SubcategoryOption[] {
  const fallbackOptions = HEALTHCARE_FALLBACK_SUBCATEGORIES[type] ?? [];
  if (fallbackOptions.length === 0 || !industryScopes.includes("HELSE")) {
    return existingOptions;
  }

  const optionMap = new Map(existingOptions.map((option) => [option.key, option]));
  for (const fallbackOption of fallbackOptions) {
    if (!optionMap.has(fallbackOption.key)) {
      optionMap.set(fallbackOption.key, {
        id: `fallback-${fallbackOption.key}`,
        key: fallbackOption.key,
        label: fallbackOption.label,
        industry: fallbackOption.industry,
        tenantId: null,
      });
    }
  }

  return Array.from(optionMap.values());
}

// GET /api/incidents/subcategories?type=ULYKKE
// Henter systemstandard + tenant-egne underkategorier for en gitt hendelsestype
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as IncidentType | null;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const tenantId = session.user.tenantId;
    const db = getAdminDb();
    const { data: tenant } = tenantId
      ? await db.from("Tenant").select("industry").eq("id", tenantId).maybeSingle()
      : { data: null };
    const industryScopes = getIncidentIndustryScopes(tenant?.industry);

    const { data: systemOptions } = await db
      .from("IncidentSubcategoryOption")
      .select("id, key, label, industry, tenantId")
      .eq("incidentType", type)
      .eq("isActive", true)
      .is("tenantId", null)
      .in("industry", industryScopes)
      .order("sortOrder", { ascending: true });

    const { data: tenantOptions } = tenantId
      ? await db
          .from("IncidentSubcategoryOption")
          .select("id, key, label, industry, tenantId")
          .eq("incidentType", type)
          .eq("isActive", true)
          .eq("tenantId", tenantId)
          .order("sortOrder", { ascending: true })
      : { data: [] };

    const optionMap = new Map<string, SubcategoryOption>();
    for (const option of [...(systemOptions ?? []), ...(tenantOptions ?? [])] as SubcategoryOption[]) {
      optionMap.set(option.key, option);
    }
    const options = Array.from(optionMap.values());

    return NextResponse.json({
      options: mergeFallbackSubcategories(type, options, industryScopes),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
