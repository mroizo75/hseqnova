import { GLOBAL_ROUTINE_TEMPLATE_LIBRARY } from "@/lib/routine-template-library";

const CATEGORY_LABELS: Record<string, string> = {
  AVVIK: "Incidents and corrective actions",
  VARSLING: "Whistleblowing",
  HMS_STYRING: "HSEQ management and system",
  EL_SIKKERHET: "Electrical safety",
  BYGG_ANLEGG: "Construction",
  HELSE: "Health and environment",
  TRANSPORT: "Transport and logistics",
  INDUSTRI: "Industry and production",
  HANDEL_SERVICE: "Retail and service",
  HOTELL_RESTAURANT: "Hotels and restaurants",
  UTDANNING: "Education",
  TEKNOLOGI_IT: "Technology and IT",
  LANDBRUK: "Agriculture",
  GENERELL: "General HSEQ",
};

const CUSTOM_SENTINEL = "__ANNET__";

export function getRoutineCategoryPresets(): { value: string; label: string }[] {
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const entry of GLOBAL_ROUTINE_TEMPLATE_LIBRARY) {
    const c = entry.category?.trim();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push({ value: c, label: CATEGORY_LABELS[c] ?? c });
  }
  out.sort((a, b) => a.label.localeCompare(b.label, "en-GB"));
  return out;
}

export { CUSTOM_SENTINEL };

export function resolveRoutineCategoryFromForm(preset: string, custom: string): string | null {
  const p = preset.trim();
  const c = custom.trim();
  if (p === CUSTOM_SENTINEL) {
    return c.length > 0 ? c : null;
  }
  if (p.length > 0) {
    return p;
  }
  return c.length > 0 ? c : null;
}

export function routineCategoryToPresetAndCustom(
  stored: string | null | undefined
): { preset: string; custom: string } {
  if (!stored?.trim()) {
    return { preset: "", custom: "" };
  }
  const presets = getRoutineCategoryPresets();
  const hit = presets.find((x) => x.value === stored);
  if (hit) {
    return { preset: stored, custom: "" };
  }
  return { preset: CUSTOM_SENTINEL, custom: stored };
}
