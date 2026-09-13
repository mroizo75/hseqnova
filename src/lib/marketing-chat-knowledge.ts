import {
  ADDON_PACKS,
  ANNUAL_DISCOUNT_PERCENT,
  HSEQ_CORE,
  UK_VAT_PERCENT,
  VAT_REVERSE_CHARGE_NOTE,
  yearlyPriceGbp,
  type AddonPackId,
} from "@/lib/billing-catalog";
import { HOME_FAQS, formatGbp } from "@/lib/homepage-content";
import { SITE_CONFIG } from "@/lib/seo-config";

export type MarketingChatRole = "user" | "assistant";

export type MarketingChatMessage = {
  role: MarketingChatRole;
  content: string;
};

export type PackRecommendation = {
  packId: AddonPackId;
  name: string;
  reason: string;
};

const PACK_RULES: readonly { pattern: RegExp; packIds: readonly AddonPackId[]; reason: string }[] = [
  {
    pattern:
      /\b(construction|contractor|builder|scaffold|principal contractor|principal designer|cdm|building site|site work)\b/i,
    packIds: ["rams", "cdm", "safety-board"],
    reason: "Construction work typically needs RAMS, CDM 2015 duty-holder records and a board at the gate.",
  },
  {
    pattern: /\b(rams|method statement)\b/i,
    packIds: ["rams"],
    reason: "Task-level risk assessments and method statements sit in the RAMS add-on.",
  },
  {
    pattern: /\b(coshh|chemical|solvent|paint|fume|hazardous substance|safety data sheet|\bsds\b)\b/i,
    packIds: ["coshh"],
    reason: "Hazardous substances need COSHH assessments and 40-year health records.",
  },
  {
    pattern: /\b(iso 45001|internal audit|management review|chas|constructionline|safecontractor|\bssip\b)\b/i,
    packIds: ["audits"],
    reason: "Tenders and ISO 45001 work often want internal audits and management review.",
  },
  {
    pattern: /\b(iso 14001|environmental aspect)\b/i,
    packIds: ["environment"],
    reason: "An environmental management system is the Environment add-on, not a Core HSWA duty.",
  },
];

export function recommendPacksForCompany(text: string): PackRecommendation[] {
  const seen = new Set<AddonPackId>();
  const recommendations: PackRecommendation[] = [];
  for (const rule of PACK_RULES) {
    if (!rule.pattern.test(text)) continue;
    for (const packId of rule.packIds) {
      if (seen.has(packId)) continue;
      seen.add(packId);
      const pack = ADDON_PACKS.find((item) => item.id === packId);
      if (!pack) continue;
      recommendations.push({ packId, name: pack.name, reason: rule.reason });
    }
  }
  return recommendations;
}

function gbp(amount: number): string {
  return formatGbp(amount);
}

export function buildMarketingKnowledge(): string {
  const coreYearly = yearlyPriceGbp(HSEQ_CORE.monthlyPriceGbp);
  const addonLines = ADDON_PACKS.map((pack) => {
    return `- ${pack.name}: ${gbp(pack.monthlyPriceGbp)}/month or ${gbp(yearlyPriceGbp(pack.monthlyPriceGbp))}/year (${ANNUAL_DISCOUNT_PERCENT}% off). ${pack.description} Legal hook: ${pack.legalHook}. Page: ${packPage(pack.id)}`;
  }).join("\n");

  const faqs = HOME_FAQS.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

  return `HSEQ Nova public catalogue (live prices from the product catalog — not from any customer account).

PRODUCT
HSEQ Nova is health and safety software for UK employers. It is a system, not consultancy and not a competent person (MHSWR reg. 7). British English. Supplier is in Norway; ${VAT_REVERSE_CHARGE_NOTE}

CONTACT
Sales: ${SITE_CONFIG.contactName}, ${SITE_CONFIG.contactPhone}, ${SITE_CONFIG.contactEmail}.
Book a 30-minute demo: ${SITE_CONFIG.url}/book-a-demo (Mon–Fri 09:00–17:00 UK, skip 12:00–13:00).
Start checkout: ${SITE_CONFIG.url}/register
Pricing page: ${SITE_CONFIG.url}/pricing

CORE — ${HSEQ_CORE.name}
${gbp(HSEQ_CORE.monthlyPriceGbp)} per month excluding VAT, or ${gbp(coreYearly)} per year with ${ANNUAL_DISCOUNT_PERCENT}% off.
Billed per company. Unlimited users. No per-seat fee.
Included: living health and safety policy (HSWA s.2(3) statement, organisation, arrangements); digital accident book (lawful instead of paper; keep 3 years); RIDDOR triage (death without delay, specified injury 10 days, over-seven-day 15 days — does NOT submit to HSE; the responsible person files on hse.gov.uk); risk assessments (MHSWR); procedures/documents; workplace inspections; fire drills (Fire Safety Order 2005); training records; actions; organisation chart.
Does not report RIDDOR to the HSE automatically.

ADD-ONS (optional, switch on when the work needs them)
${addonLines}

WHAT FITS WHICH COMPANY
- Office, warehouse, shop, cafe, most SMEs: Core only.
- Construction / contractors / CDM sites: Core + RAMS + CDM 2015 + digital safety board.
- Chemicals, paints, dusts, fumes: Core + COSHH.
- CHAS / Constructionline / ISO 45001 evidence: Core, then Audits if they want internal audit and management review.
- ISO 14001 EMS: Environment add-on (optional, not an HSWA duty).
Digital safety board can run standalone without Core at the same board price; with Core it pulls live first aiders, RAMS and accident tally. Personal names stay off the public screen (UK GDPR).

PAYMENT
Card or Bacs Direct Debit. Monthly or yearly. Invoice Net 30 on request via ${SITE_CONFIG.contactEmail}.
UK VAT ${UK_VAT_PERCENT}% is reverse-charged for VAT-registered UK customers — not collected on the card.

HARD LIMITS
Do not invent modules, prices or integrations. Do not access or claim to see a customer's records, users, incidents or invoices. If they ask about their own account, tell them to sign in at ${SITE_CONFIG.url}/login. If the question is not about HSEQ Nova, decline briefly and offer to help with the product.

SITE FAQ
${faqs}

OTHER FACTS
Written policy is required for employers with five or more employees (HSWA s.2(3)). Accident book for 10 or more employees; digital is lawful. COSHH health records 40 years. Near misses are not RIDDOR but belong in the accident book.
`;
}

function packPage(id: AddonPackId): string {
  switch (id) {
    case "rams":
      return "/rams";
    case "coshh":
      return "/coshh";
    case "safety-board":
      return "/digital-safety-board";
    default:
      return "/pricing";
  }
}
