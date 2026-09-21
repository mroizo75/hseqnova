/**
 * Pricing & CRM utilities for HSEQ Nova 2.0
 * 
 * Konkurransefordel mot Grønn Jobb:
 * - Bedre UI/UX
 * - Mer omfattende funksjonalitet
 * - Digital signatur på skjemaer
 * - Kraftig rapportering og analytics
 * - Automatiserte varsler og oppfølging
 * - ISO 9001 sertifiserings-klart
 */

import { PricingTier } from "@prisma/client";
import { SUPPORTED_INDUSTRIES } from "@/lib/industry-packages";

export type BindingPeriod = "none" | "1year" | "2year";

export interface BindingPlan {
  period: BindingPeriod;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  savings?: string;
  popular?: boolean;
}

export interface PricingPlan {
  tier: PricingTier;
  name: string;
  employeeRange: string;
  minEmployees: number;
  maxEmployees: number | null;
  yearlyPrice: number;
  monthlyPrice: number;
  features: string[];
  popularFeatures: string[];
}

/**
 * HSEQ Nova Pricing Plan (Software Only)
 * 
 * Transparent prising. Ingen skjulte kostnader.
 * 
 * Prismodell: én pakke 12 mnd binding
 * - 12 mnd binding: 300 kr/mnd (3 600 kr/år)
 * 
 * HSEQ Nova advantages:
 * - Ingen oppstartskostnader: 0 kr (konkurrenter: 20.000-50.000 kr)
 * - Alt inkludert: Alle funksjoner i prisen
 * - Norsk support: E-post og telefon inkludert
 * - Gratis HMS-håndbok: Ferdig mal klar til bruk
 * - Digital signatur: Inkludert (konkurrenter: ekstrakostnad)
 */
export const BINDING_PLANS: BindingPlan[] = [
  {
    period: "1year",
    name: "12 month contract",
    description: "Core HSEQ for the company, unlimited users",
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: true,
  },
];

/**
 * Standard funksjoner inkludert i alle planer
 */
export const INCLUDED_FEATURES = [
  "Unlimited users",
  "Document control with versioning",
  "Risk assessment (5×5 matrix)",
  "Incident reporting and 5 Whys",
  "Digital signatures (sign-in)",
  "Health and safety policy template",
  "Training module and competence matrix",
  "Audits (ISO 9001)",
  "Goals and KPI tracking",
  "COSHH register with safety data sheets",
  "Automatic reminders and alerts",
  "Mobile-ready workspace",
  "Email and telephone support",
  "Unlimited storage",
  "API access for integrations",
];

// Legacy pricing plans (beholdes for bakoverkompatibilitet)
export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: "MICRO",
    name: "HSEQ Nova Software",
    employeeRange: "All company sizes",
    minEmployees: 1,
    maxEmployees: null,
    yearlyPrice: 3600,
    monthlyPrice: 300,
    features: INCLUDED_FEATURES,
    popularFeatures: [
      "Digital signature",
      "Health and safety policy template",
      "ISO 9001",
    ],
  },
  {
    tier: "SMALL",
    name: "HSEQ Nova Software",
    employeeRange: "All company sizes",
    minEmployees: 1,
    maxEmployees: null,
    yearlyPrice: 3600,
    monthlyPrice: 300,
    features: INCLUDED_FEATURES,
    popularFeatures: [
      "Automatic alerts",
      "API access",
      "Telephone support",
    ],
  },
  {
    tier: "MEDIUM",
    name: "HSEQ Nova Software",
    employeeRange: "All company sizes",
    minEmployees: 1,
    maxEmployees: null,
    yearlyPrice: 3600,
    monthlyPrice: 300,
    features: INCLUDED_FEATURES,
    popularFeatures: [
      "Unlimited users",
      "Unlimited storage",
      "Full support",
    ],
  },
];

/**
 * Beregn pricing tier basert på antall ansatte
 * Nå returnerer alltid MICRO siden alle får samme pris
 */
export function calculatePricingTier(employeeCount: number): PricingTier {
  return "MICRO"; // Alle får samme pris uansett størrelse
}

/**
 * Hent pricing plan for en tier
 */
export function getPricingPlan(tier: PricingTier): PricingPlan {
  return PRICING_PLANS.find((p) => p.tier === tier) || PRICING_PLANS[0];
}

/**
 * Hent binding plan basert på periode
 */
export function getBindingPlan(period: BindingPeriod): BindingPlan {
  return BINDING_PLANS.find((p) => p.period === period) || BINDING_PLANS[0];
}

/**
 * Hent pris basert på bindingsperiode
 */
export function getPriceForBinding(period: BindingPeriod, isYearly: boolean = false): number {
  const plan = getBindingPlan(period);
  return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
}

/**
 * Hent pris basert på antall ansatte (legacy - returnerer 1 år binding pris)
 */
export function getPriceForEmployeeCount(employeeCount: number, isYearly: boolean = true): number {
  const plan = getBindingPlan("1year"); // Standard er 1 år binding
  return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
}

/**
 * HSEQ Nova 2.0 vs Grønn Jobb - Competitive advantages
 */
export const COMPETITIVE_ADVANTAGES = [
  {
    feature: "Digital signatures on forms",
    hmsNova: "Included",
    gronnJobb: "Not available",
    advantage: "Employees can sign in the workspace",
  },
  {
    feature: "Roles and access control",
    hmsNova: "7 company roles (Admin, HSE manager, line manager, safety representative, employee, occupational health, auditor)",
    gronnJobb: "Limited",
    advantage: "Granular control over who can do what",
  },
  {
    feature: "ISO 9001",
    hmsNova: "Documented and ready for certification",
    gronnJobb: "Partial",
    advantage: "Certification-ready out of the box",
  },
  {
    feature: "Audit module",
    hmsNova: "Complete with ISO clauses",
    gronnJobb: "Basic audit",
    advantage: "Structured findings, actions and verification",
  },
  {
    feature: "Goals and KPIs",
    hmsNova: "Automatic and manual tracking",
    gronnJobb: "Not available",
    advantage: "Follow health and safety objectives",
  },
  {
    feature: "COSHH register",
    hmsNova: "With hazard pictograms and PPE",
    gronnJobb: "Simple chemical list",
    advantage: "Visual UN pictograms",
  },
  {
    feature: "5 Whys",
    hmsNova: "Built into incident handling",
    gronnJobb: "Not available",
    advantage: "Root cause analysis in the record",
  },
  {
    feature: "Multi-tenant architecture",
    hmsNova: "Company isolation by design",
    gronnJobb: "Unknown",
    advantage: "Customers cannot see each other",
  },
  {
    feature: "API and integrations",
    hmsNova: "REST API",
    gronnJobb: "Not available",
    advantage: "Connect other systems",
  },
  {
    feature: "Modern workspace",
    hmsNova: "Clear UK HSEQ workflow",
    gronnJobb: "Older design",
    advantage: "Faster to learn and use",
  },
];

/**
 * Onboarding checklist
 */
export const ONBOARDING_STEPS = [
  {
    id: "admin_created",
    title: "Create the first administrator",
    description: "The first administrator must be created and given access",
    estimatedTime: "5 min",
  },
  {
    id: "company_info",
    title: "Company information",
    description: "Add company number, address and contact details",
    estimatedTime: "10 min",
  },
  {
    id: "users_invited",
    title: "Invite employees",
    description: "Add users with the right company roles",
    estimatedTime: "15 min",
  },
  {
    id: "templates_configured",
    title: "Choose industry templates",
    description: "Select templates that match the industry",
    estimatedTime: "20 min",
  },
  {
    id: "documents_uploaded",
    title: "Upload existing documents",
    description: "Import existing health and safety documents",
    estimatedTime: "30 min",
  },
  {
    id: "training_setup",
    title: "Set up training",
    description: "Define mandatory courses",
    estimatedTime: "20 min",
  },
  {
    id: "chemicals_registered",
    title: "Register substances",
    description: "Add products to the COSHH register",
    estimatedTime: "30 min",
  },
  {
    id: "first_risk_assessment",
    title: "First risk assessment",
    description: "Complete a suitable and sufficient risk assessment",
    estimatedTime: "1 hour",
  },
  {
    id: "mobile_app",
    title: "Download the mobile app",
    description: "Employees install the app",
    estimatedTime: "10 min",
  },
  {
    id: "training_completed",
    title: "Complete induction training",
    description: "System training with the customer consultant",
    estimatedTime: "2 hours",
  },
];

/**
 * Industrier vi støtter med spesialiserte maler
 */
export { SUPPORTED_INDUSTRIES };

