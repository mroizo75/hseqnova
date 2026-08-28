/**
 * Additional SEO Schemas for specific pages
 * Extra structured data for pricing, courses, occupational health, etc.
 */

import { SITE_CONFIG } from "./seo-config";

export const PRICING_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "HSEQ Nova pricing",
  description: "Core HSEQ per company plus add-ons. Unlimited users. GBP excluding VAT.",
  itemListElement: [
    {
      "@type": "Offer",
      position: 1,
      name: "Annual subscription",
      description: "HSEQ Nova – full access, 12-month subscription",
      price: "Ask",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "249",
        priceCurrency: "GBP",
        unitText: "MONTH",
      },
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
      itemOffered: {
        "@type": "Service",
        name: "HSEQ Nova - Annual subscription",
        description: "Complete HSEQ management system with unlimited users. £2,988/year.",
      },
    },
  ],
} as const;

export const COURSE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "HSEQ courses and First Aid",
  description: "20% discount on all HSEQ courses for HSEQ Nova members",
  itemListElement: [
    {
      "@type": "Course",
      position: 1,
      name: "Safety Representative Course",
      description: "Statutory safety representative training course",
      provider: {
        "@type": "Organization",
        name: "HSEQ Nova",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: ["onsite", "online", "blended"],
        duration: "P40H",
      },
    },
    {
      "@type": "Course",
      position: 2,
      name: "First Aid for Adults",
      description: "Essential first aid course with certificate",
      provider: {
        "@type": "Organization",
        name: "HSEQ Nova",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: ["onsite"],
        duration: "P8H",
      },
    },
    {
      "@type": "Course",
      position: 3,
      name: "Paediatric First Aid",
      description: "First aid specifically adapted for children",
      provider: {
        "@type": "Organization",
        name: "HSEQ Nova",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: ["onsite"],
        duration: "P4H",
      },
    },
  ],
} as const;

export const BHT_SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Occupational Health Service",
  description: "HSEQ Nova provides occupational health services. Minimum statutory requirements, additional services and a broad range of courses including Diisocyanates.",
  provider: {
    "@type": "Organization",
    name: SITE_CONFIG.name,
  },
  serviceType: "Occupational Health",
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  offers: {
    "@type": "Offer",
    description: "Core occupational health package and additional services. Contact for a quote.",
  },
} as const;

export const GRATIS_HMS_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to get a free HSEQ starter pack",
  description: "Get a complete health and safety policy and documents free in 5 minutes",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Enter company information",
      text: "Fill in basic information about your organisation",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Select industry",
      text: "Select your industry for sector-specific documents",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Download the pack",
      text: "Download a complete HSEQ pack with policy, risk assessment and templates",
    },
  ],
} as const;

export const REVIEW_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "HSEQ Nova",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "249",
    priceCurrency: "GBP",
  },
} as const;

export const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE_CONFIG.name,
  image: `${SITE_CONFIG.url}/opengraph-image`,
  "@id": SITE_CONFIG.url,
  url: SITE_CONFIG.url,
  telephone: SITE_CONFIG.contactPhone,
  email: SITE_CONFIG.contactEmail,
  address: {
    "@type": "PostalAddress",
    streetAddress: "71-75 Shelton Street",
    addressLocality: "London",
    postalCode: "WC2H 9JQ",
    addressRegion: "Greater London",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 51.5154,
    longitude: -0.1255,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "17:00",
  },
  sameAs: [
    SITE_CONFIG.socialMedia.linkedin,
    SITE_CONFIG.socialMedia.facebook,
  ],
} as const;

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  description: SITE_CONFIG.description,
  publisher: {
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
  },
  inLanguage: "en-GB",
} as const;
