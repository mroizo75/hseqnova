import { ADDON_PACKS, HSEQ_CORE, UK_VAT_PERCENT } from "@/lib/billing-catalog";
import { SITE_CONFIG } from "@/lib/seo-config";

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export const HOME_FAQS = [
  {
    question: "What is HSEQ Nova?",
    answer:
      "HSEQ Nova is health and safety software for UK employers. It keeps the written policy, digital accident book, RIDDOR triage, risk assessments, workplace inspections, training and fire drills in one system, built around HSWA, MHSWR and RIDDOR.",
  },
  {
    question: "How much does HSEQ Nova cost?",
    answer: `HSEQ Nova Core is ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month excluding VAT, billed per company with unlimited users. RAMS, COSHH, CDM 2015, the digital safety board, audits and environment are optional add-ons. Every subscription includes a UK VAT invoice at ${UK_VAT_PERCENT}%.`,
  },
  {
    question: "What is included in HSEQ Nova Core?",
    answer:
      "Core includes a living health and safety policy (statement, organisation and arrangements), a digital accident book with RIDDOR triage, risk assessments, documents, workplace inspections, fire drills, training, actions and an organisation chart. Unlimited people in the company can log in.",
  },
  {
    question: "Does HSEQ Nova include a digital accident book and RIDDOR?",
    answer:
      "Yes. You log injuries and near misses in a digital accident book. If the event is reportable under RIDDOR 2013, the system flags the correct clock: without delay for deaths, 10 days for specified injuries, and 15 days for over-seven-day injuries.",
  },
  {
    question: "Do I need RAMS, COSHH or CDM 2015?",
    answer:
      "Only if the work needs them. RAMS is for task-level risk assessments and method statements. COSHH is for hazardous substances and health records. CDM 2015 is for construction duty holders, the construction phase plan, F10 and the health and safety file. Switch a pack on when a site or contract asks for it.",
  },
  {
    question: "Is HSEQ Nova a consultancy or a competent person?",
    answer:
      "No. HSEQ Nova is the system your competent person and managers use. It does not replace the legal duty to appoint competent help (MHSWR regulation 7), and it is not health and safety consultancy.",
  },
  {
    question: "How do I pay?",
    answer:
      "Self-serve checkout is card or Bacs Direct Debit. Invoice (Net 30) is available if you email hello@hseqnova.co.uk. Prices are in GBP excluding VAT.",
  },
  {
    question: "Who can use HSEQ Nova in the company?",
    answer:
      "Everyone you give access to. The price is per company, not per seat, so first aiders, supervisors and directors can all log work without a licence count getting in the way.",
  },
] as const;

const ADDON_SCHEMA_URL: Record<string, string> = {
  rams: "/rams",
  coshh: "/coshh",
  cdm: "/pricing",
  "safety-board": "/digital-safety-board",
  audits: "/pricing",
  environment: "/pricing",
};

export function getHomePageJsonLd(): Array<Record<string, unknown>> {
  const coreUrl = `${SITE_CONFIG.url}/pricing`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/#webpage`,
      url: SITE_CONFIG.url,
      name: "Health and safety software for UK employers | HSEQ Nova",
      description: SITE_CONFIG.description,
      inLanguage: "en-GB",
      isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
      about: { "@id": `${SITE_CONFIG.url}/#software` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_CONFIG.url}/#website`,
      url: SITE_CONFIG.url,
      name: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
      inLanguage: "en-GB",
      publisher: { "@id": `${SITE_CONFIG.url}/#organisation` },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${SITE_CONFIG.url}/#software`,
      name: "HSEQ Nova",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "en-GB",
      url: SITE_CONFIG.url,
      description: SITE_CONFIG.description,
      featureList: [
        "Living health and safety policy",
        "Digital accident book",
        "RIDDOR triage",
        "Risk assessments",
        "Workplace inspections",
        "Fire drills",
        "Training records",
        "RAMS add-on",
        "COSHH add-on",
        "CDM 2015 add-on",
        "Digital safety board add-on",
      ],
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "GBP",
        lowPrice: String(HSEQ_CORE.monthlyPriceGbp),
        highPrice: String(HSEQ_CORE.monthlyPriceGbp + ADDON_PACKS.reduce((sum, pack) => sum + pack.monthlyPriceGbp, 0)),
        offerCount: 1 + ADDON_PACKS.length,
        url: coreUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Offer",
      "@id": `${SITE_CONFIG.url}/#offer-core`,
      name: HSEQ_CORE.name,
      url: coreUrl,
      availability: "https://schema.org/InStock",
      price: String(HSEQ_CORE.monthlyPriceGbp),
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(HSEQ_CORE.monthlyPriceGbp),
        priceCurrency: "GBP",
        valueAddedTaxIncluded: false,
        billingDuration: "P1M",
        unitText: "MONTH",
      },
      itemOffered: {
        "@type": "Service",
        name: HSEQ_CORE.name,
        description: HSEQ_CORE.description,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "HSEQ Nova add-ons",
      itemListElement: ADDON_PACKS.map((pack, index) => ({
        "@type": "Offer",
        position: index + 1,
        name: pack.name,
        url: `${SITE_CONFIG.url}${ADDON_SCHEMA_URL[pack.id] ?? "/pricing"}`,
        price: String(pack.monthlyPriceGbp),
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          name: pack.name,
          description: pack.description,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ] as Array<Record<string, unknown>>;
}
