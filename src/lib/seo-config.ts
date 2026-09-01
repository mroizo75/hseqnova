/**
 * HSEQ Nova SEO configuration for the UK product.
 */

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hseqnova.co.uk";
const normalizedBaseUrl = rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`;

export const SITE_CONFIG = {
  name: "HSEQ Nova",
  tagline: "Health, safety, environment and quality software for the UK",
  description: "HSEQ software for UK employers. Digital accident book, RIDDOR triage, living H&S policy, RAMS, COSHH, CDM and a digital site safety board. Priced per company, unlimited users.",
  url: normalizedBaseUrl,
  locale: "en_GB",
  contactPhone: "",
  contactEmail: "hello@hseqnova.co.uk",
  socialMedia: {
    linkedin: "https://www.linkedin.com/company/hseqnova",
    facebook: "",
  },
} as const;

export const PRIMARY_KEYWORDS = [
  "health and safety software UK",
  "HSEQ software",
  "digital accident book",
  "RIDDOR reporting software",
  "RAMS software",
  "COSHH assessment software",
  "CDM 2015 software",
  "CHAS",
  "Constructionline",
  "SSIP",
  "digital site safety board",
  "ISO 45001 software",
  "workplace inspection software",
] as const;

export const SECONDARY_KEYWORDS = [
  "health and safety policy template UK",
  "competent person software",
  "F10 notification",
  "construction phase plan software",
  "permit to work software",
  "DSE assessment software",
  "fire drill log",
  "SmartQHSE alternative",
  "HSE Cloud alternative",
  "Citation alternative",
  "Alcumus alternative",
  "SafetyCulture alternative",
] as const;

// Organisation structured data
export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_CONFIG.url}/#organisation`,
  name: SITE_CONFIG.name,
  slogan: SITE_CONFIG.tagline,
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}/opengraph-image`,
  description: SITE_CONFIG.description,
  telephone: SITE_CONFIG.contactPhone,
  email: SITE_CONFIG.contactEmail,
  address: {
    "@type": "PostalAddress",
    addressCountry: "GB",
  },
  sameAs: [SITE_CONFIG.socialMedia.linkedin].filter(Boolean),
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "HSEQ software",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "SoftwareApplication",
          name: "HSEQ Nova Core",
          description:
            "Living health and safety policy, digital accident book, RIDDOR triage, risk assessments, inspections, training and fire drills. Unlimited users.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "RAMS, COSHH and CDM add-ons",
          description:
            "Optional packs for method statements, hazardous substances, construction duty holders and a digital site safety board.",
        },
      },
    ],
  },
} as const;

export const SOFTWARE_PRODUCT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "HSEQ Nova",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "GBP",
    lowPrice: "29",
    highPrice: "152",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "29",
      priceCurrency: "GBP",
      unitText: "MONTH",
      valueAddedTaxIncluded: false,
    },
  },
  featureList: [
    "Living health and safety policy",
    "Digital accident book",
    "RIDDOR triage",
    "Risk assessments",
    "Workplace inspections",
    "Fire drills",
    "Training records",
    "Organisation chart",
    "RAMS add-on",
    "COSHH add-on",
    "CDM 2015 add-on",
    "Digital safety board add-on",
  ],
  description: SITE_CONFIG.description,
  screenshot: `${SITE_CONFIG.url}/opengraph-image`,
} as const;

export const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is HSEQ Nova?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HSEQ Nova is health and safety software for UK employers. It keeps the written policy, digital accident book, RIDDOR triage, risk assessments, workplace inspections, training and fire drills in one system — built around HSWA, MHSWR, RIDDOR, COSHH and CDM.",
      },
    },
    {
      "@type": "Question",
      name: "How much does HSEQ Nova cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core is £29 per month excluding VAT, billed per company with unlimited users. RAMS, COSHH, CDM 2015, the digital safety board, audits and environment are optional add-ons. The supplier is in Norway; Stripe Tax applies reverse charge for UK VAT-registered customers.",
      },
    },
    {
      "@type": "Question",
      name: "Does HSEQ Nova replace a competent person?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. HSEQ Nova is the system your competent person and managers use. It does not replace the legal duty to appoint competent help under MHSWR regulation 7, and it is not health and safety consultancy.",
      },
    },
    {
      "@type": "Question",
      name: "Does HSEQ Nova include a digital accident book?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You log injuries and near misses in a digital accident book. If the event is reportable under RIDDOR 2013, the system flags the correct deadline — without delay for deaths, 10 days for specified injuries, 15 days for over-seven-day injuries.",
      },
    },
    {
      "@type": "Question",
      name: "Can I add RAMS, COSHH or CDM later?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Core HSEQ is always on. RAMS, COSHH, CDM 2015, the digital safety board, audits and environment are add-ons you switch on when the work asks for them.",
      },
    },
  ],
} as const;

// BreadcrumbList for search-result navigation
export const getBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${SITE_CONFIG.url}${item.url}`,
  })),
});

// Page metadata templates
export const PAGE_METADATA = {
  home: {
    title: "Health and Safety Software for UK Employers | HSEQ Nova",
    description:
      "Digital accident book, RIDDOR triage, living H&S policy and inspections. £29/month per company, unlimited users. RAMS, COSHH and CDM as add-ons.",
    keywords: [...PRIMARY_KEYWORDS, ...SECONDARY_KEYWORDS.slice(0, 8)].join(", "),
  },
  priser: {
    title: "Pricing — HSEQ Nova | Per company, unlimited users",
    description: "Core HSEQ for every company. Industry packs and extras as add-ons. VAT invoices, Bacs Direct Debit or card via Stripe.",
    keywords: "health and safety software pricing UK, HSEQ software cost, per company pricing, unlimited users",
  },
  riddor: {
    title: "Digital Accident Book and RIDDOR Reporting | HSEQ Nova",
    description: "Record workplace accidents in a digital accident book. RIDDOR deaths, specified injuries, over-seven-day injuries and dangerous occurrences get the correct reporting deadline.",
    keywords: "digital accident book, RIDDOR reporting software, RIDDOR 2013, accident book software UK, workplace injury reporting",
  },
  rams: {
    title: "RAMS Software — Risk Assessments and Method Statements | HSEQ Nova",
    description: "Risk assessments and method statements for UK construction. RAMS linked to CDM duty holders, the construction phase plan and F10.",
    keywords: "RAMS software UK, risk assessment method statement, construction RAMS, CDM 2015 RAMS",
  },
  coshh: {
    title: "COSHH Assessment Software — Hazardous Substances | HSEQ Nova",
    description: "COSHH 2002 assessments, safety data sheets and health records kept for 40 years. Hazardous substance management for UK employers.",
    keywords: "COSHH assessment software, COSHH 2002, hazardous substances software, health surveillance records, SDS management",
  },
  safetyBoard: {
    title: "Digital Site Safety Board for UK Construction | HSEQ Nova",
    description: "A digital safety board for UK sites: first aider, fire marshal, principal contractor, RAMS, F10, CPP and visitor induction.",
    keywords: "digital safety board, construction site board, CDM 2015 site information, site induction board",
  },
  policy: {
    title: "Living Health and Safety Policy Software | HSEQ Nova",
    description: "A living H&S policy with statement of intent, organisation and arrangements that link to live modules. Written for HSWA s.2(3).",
    keywords: "health and safety policy software, HSWA s.2(3), written safety policy, living policy document",
  },
  software: {
    title: "Health and Safety Software for UK Employers | HSEQ Nova",
    description: "HSEQ software built for HSWA, MHSWR, RIDDOR, COSHH and CDM 2015. Core features for every company, industry add-ons when the work needs them.",
    keywords: "health and safety software UK, HSEQ software, workplace safety management, CHAS evidence, Constructionline, SSIP",
  },
  about: {
    title: "About HSEQ Nova | Health and Safety Software for the UK",
    description: "HSEQ Nova is purpose-built for UK health and safety law. One system for the accident book, RIDDOR, your written policy, inspections and training.",
    keywords: "about HSEQ Nova, UK health and safety software company, HSEQ platform",
  },
  contact: {
    title: "Contact HSEQ Nova | Get in Touch",
    description: "Get in touch with HSEQ Nova. Email hello@hseqnova.co.uk for questions about health and safety software, pricing or support.",
    keywords: "contact HSEQ Nova, health and safety software support, HSEQ enquiry",
  },
} as const;

// Open Graph defaults
export const getOpenGraphDefaults = (
  title: string,
  description: string,
  path: string = ""
) => ({
  title,
  description,
  url: `${SITE_CONFIG.url}${path}`,
  siteName: SITE_CONFIG.name,
  locale: SITE_CONFIG.locale,
  type: "website" as const,
});

// Twitter Card defaults
export const getTwitterDefaults = (title: string, description: string) => ({
  card: "summary_large_image" as const,
  title,
  description,
  creator: "@hseqnova",
});

// Robots meta tags
export const ROBOTS_CONFIG = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
  },
} as const;

// Canonical URL helper
export const getCanonicalUrl = (path: string) => {
  return `${SITE_CONFIG.url}${path}`;
};

