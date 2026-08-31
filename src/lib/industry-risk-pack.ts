import type { RiskCategory } from "@prisma/client";
import { RISK_WHO_KEYS, RISK_WHO_META, type RiskWhoKey } from "@/lib/risk-mhswr";

export const INDUSTRY_RISK_CATEGORIES = [
  "SAFETY",
  "HEALTH",
  "ERGONOMIC",
  "PSYCHOSOCIAL",
  "ENVIRONMENTAL",
  "PHYSICAL",
  "ORGANISATIONAL",
  "OPERATIONAL",
  "LEGAL",
] as const satisfies readonly RiskCategory[];

export type IndustryRiskCategory = (typeof INDUSTRY_RISK_CATEGORIES)[number];

export type IndustryRiskPackHazard = {
  key: string;
  title: string;
  context: string;
  whoAtRisk: RiskWhoKey[];
  category: IndustryRiskCategory;
  likelihood: number;
  consequence: number;
  existingControls: string;
  legalRef: string;
};

export type IndustryRiskPack = {
  industryLabel: string;
  hazards: IndustryRiskPackHazard[];
};

const CATEGORY_SET = new Set<string>(INDUSTRY_RISK_CATEGORIES);
const MAX_HAZARDS = 15;
const MAX_LABEL = 80;

function clampScore(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function asText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function mapWhoKey(value: unknown): RiskWhoKey | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const snake = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
  if ((RISK_WHO_KEYS as readonly string[]).includes(snake)) {
    return snake as RiskWhoKey;
  }
  const byLabel = RISK_WHO_KEYS.find(
    (key) => RISK_WHO_META[key].label.toLowerCase() === trimmed.toLowerCase(),
  );
  return byLabel ?? null;
}

function mapCategory(value: unknown): IndustryRiskCategory {
  if (typeof value === "string" && CATEGORY_SET.has(value)) {
    return value as IndustryRiskCategory;
  }
  return "SAFETY";
}

/**
 * Turns a model JSON object into a bounded UK risk pack.
 * Drops empty titles. Scores stay on the 5×5 matrix (MHSWR practice, not a statutory grid).
 */
export function sanitizeIndustryRiskPack(raw: unknown): IndustryRiskPack {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const industryLabel =
    asText(input.industryLabel, MAX_LABEL) || asText(input.industry, MAX_LABEL) || "Workplace";

  const rows = Array.isArray(input.hazards) ? input.hazards : [];
  const hazards: IndustryRiskPackHazard[] = [];

  for (const row of rows) {
    if (hazards.length >= MAX_HAZARDS) break;
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const title = asText(item.title, 160);
    const context = asText(item.context, 600);
    const existingControls = asText(item.existingControls, 600);
    if (title.length < 3 || context.length < 10 || existingControls.length < 8) continue;

    const whoRaw = Array.isArray(item.whoAtRisk) ? item.whoAtRisk : [item.whoAtRisk];
    const whoAtRisk = [...new Set(whoRaw.map(mapWhoKey).filter((key): key is RiskWhoKey => key != null))];

    hazards.push({
      key: `ai-${hazards.length + 1}`,
      title,
      context,
      whoAtRisk: whoAtRisk.length > 0 ? whoAtRisk : ["employees"],
      category: mapCategory(item.category),
      likelihood: clampScore(item.likelihood, 3),
      consequence: clampScore(item.consequence, 3),
      existingControls,
      legalRef: asText(item.legalRef, 180) || "MHSWR 1999 reg.3",
    });
  }

  return { industryLabel, hazards };
}
