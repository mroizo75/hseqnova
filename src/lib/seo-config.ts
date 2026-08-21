/**
 * HMS Nova SEO Configuration
 * 
 * Fokusområder:
 * - "HMS Nova bygger trygghet" som kjerneverdi
 * - Overgå konkurrenter (Grønn Jobb, Avonova, Kuba)
 * - Optimalisert for både tradisjonelle søkemotorer og AI (ChatGPT, Perplexity, etc.)
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

// Strukturerte data for søkemotorer
export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
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
  sameAs: [
    SITE_CONFIG.socialMedia.linkedin,
    SITE_CONFIG.socialMedia.facebook,
  ],
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "HMS-tjenester",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "HMS-system",
          description: "Komplett digitalt HMS-system for norske bedrifter",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Bedriftshelsetjeneste",
          description: "HMS Nova etablerer seg som godkjent bedriftshelsetjeneste med minimum krav, tilleggstjenester og kurs.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "HMS-kurs",
          description: "Lovpålagte HMS-kurs og førstehjelp",
        },
      },
    ],
  },
} as const;

// Software Product Schema for HMS Nova systemet
export const SOFTWARE_PRODUCT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "HMS Nova",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "NOK",
    lowPrice: "300",
    highPrice: "300",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "300",
      priceCurrency: "NOK",
      unitText: "MONTH",
    },
  },
  featureList: [
    "Digital signatur",
    "Risikovurdering 5x5 matrise",
    "Hendelsesrapportering",
    "5 Whys analyse",
    "Automatiske påminnelser",
    "Mobilapp (offline)",
    "ISO 9001 compliance",
    "Dokumenthåndtering",
    "Kompetansematrise",
    "Stoffkartotek",
    "Revisjoner og audits",
    "Mål og KPI-oppfølging",
  ],
  description: "HMS Nova bygger trygghet. Norges mest moderne HMS-system med full ISO 9001 compliance, digital signatur og mobilapp.",
  screenshot: `${SITE_CONFIG.url}/opengraph-image`,
} as const;

// FAQ Schema for bedre synlighet i søk
export const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Hva er HMS Nova?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HMS Nova er Norges mest moderne HMS-system. Vi bygger trygghet gjennom digitalisering av HMS-arbeid. Med HMS Nova får bedrifter et komplett verktøy for risikovurdering, hendelsesrapportering, dokumenthåndtering og ISO 9001 compliance.",
      },
    },
    {
      "@type": "Question",
      name: "Hva koster HMS Nova?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HMS Nova koster 300 kr/mnd (3 600 kr/år) med 12 måneders abonnement. Ubegrenset antall brukere inkludert. Ingen oppstartskostnader, alt inkludert.",
      },
    },
    {
      "@type": "Question",
      name: "Er HMS Nova godkjent av Arbeidstilsynet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HMS Nova følger alle krav i Arbeidsmiljøloven, Internkontrollforskriften og ISO 9001:2015. Systemet er bygget for å sikre full compliance med norsk lov og internasjonale standarder.",
      },
    },
    {
      "@type": "Question",
      name: "Tilbyr HMS Nova bedriftshelsetjeneste?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HMS Nova etablerer seg som godkjent bedriftshelsetjeneste (BHT) og vil tilby minimum lovkrav, tilleggstjenester og et bredt kursutbud inkludert Diisocyanater. HMS-system og BHT vil være under ett tak.",
      },
    },
    {
      "@type": "Question",
      name: "Fungerer HMS Nova på mobil og offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja! HMS Nova har full mobilstøtte og fungerer offline. Perfekt for byggeplasser, verksteder og feltarbeid. Synkronisering skjer automatisk når du er tilbake online.",
      },
    },
    {
      "@type": "Question",
      name: "Hvordan skiller HMS Nova seg fra Grønn Jobb, Avonova og Kuba?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HMS Nova er 100% digitalt og moderne. Vi har digital signatur inkludert (ikke ekstrakostnad), 12 måneders abonnement (300 kr/mnd), mobilapp med offline-støtte, og betydelig lavere priser. Vår visjon er enkel: HMS Nova bygger trygghet - ikke byråkrati.",
      },
    },
  ],
} as const;

// BreadcrumbList for bedre navigasjon i søkeresultater
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

// Page-spesifikke metadata templates
export const PAGE_METADATA = {
  home: {
    title: "HSEQ Nova — Health and safety software for the UK",
    description: "Digital accident book, RIDDOR, living H&S policy, inspections and training. Priced per company, unlimited users. RAMS, COSHH, CDM and safety board add-ons.",
    keywords: [...PRIMARY_KEYWORDS, ...SECONDARY_KEYWORDS.slice(0, 10)].join(", "),
  },
  priser: {
    title: "Pricing — HSEQ Nova | Per company, unlimited users",
    description: "Core HSEQ for every company. Industry packs and extras as add-ons. VAT invoices, Bacs Direct Debit or card via Stripe.",
    keywords: "hms system pris, hms programvare kostnad, billig hms system, hms system alle bedrifter, beste hms system pris",
  },
  kurs: {
    title: "HMS-kurs - Lovpålagte Kurs & Førstehjelp | HMS Nova",
    description: "20% rabatt på HMS-kurs for medlemmer. Verneombud, førstehjelp og diisocyanater. Fysisk, digitalt eller hybrid. Bestill kurs hos HMS Nova i dag.",
    keywords: "hms kurs, verneombud kurs, førstehjelp kurs, hms opplæring, lovpålagt hms kurs",
  },
  bht: {
    title: "Bedriftshelsetjeneste (BHT) - HMS Nova blir BHT-organ | Minimum krav + kurs",
    description: "HMS Nova etablerer seg som godkjent BHT · Minimum lovkrav + tilleggstjenester + Diisocyanater og HMS-kurs · Ett sted for HMS og BHT · Registrer interesse →",
    keywords: "bedriftshelsetjeneste, BHT, godkjent bedriftshelsetjeneste, arbeidstilsynet bht, diisocyanater kurs, AMO-kurs",
  },
  komplettPakke: {
    title: "Komplett HMS-pakke - BHT + HMS Nova fra 6 900 kr/år | HMS Nova",
    description: "Lovpålagt BHT + HMS Nova. START 6 900 kr/år (1-5 ansatte), PRO 14 900 kr/år (6-20), PREMIUM fra 29 900 kr/år (20+). Tilleggstjenester til fast pris. Ring salg eller venteliste.",
    keywords: "komplett hms pakke, bht pakke, hms oppsett, implementering hms, hms nova pakke, bht pris",
  },
  handbook: {
    title: "HMS-håndbok - Digital & Oppdatert | HMS Nova",
    description: "Ferdig HMS-håndbok tilpasset din bedrift. Alltid oppdatert med lovkrav, digital signatur og versjonskontroll. Spar uker med arbeid. Prøv gratis.",
    keywords: "hms håndbok, digital hms håndbok, hms dokumentasjon, arbeidsmiljøhåndbok",
  },
  risikovurdering: {
    title: "Risikovurdering - 5x5 Matrise & Analyse | HMS Nova",
    description: "Profesjonell risikovurdering med 5x5 matrise (ISO 9001). Enkelt å bruke med automatisk oppfølging. Bestå revisjoner med glans. Prøv gratis i 14 dager.",
    keywords: "risikovurdering, risikoanalyse, 5x5 matrise, risikostyring, hms risikovurdering",
  },
  vernerunde: {
    title: "Vernerunde-guide - Digital Vernerunde på Mobil | HMS Nova",
    description: "Digital vernerunde på mobil som fungerer offline. Automatisk rapportering, perfekt for byggeplasser. Spar timer hver uke. Prøv gratis.",
    keywords: "vernerunde, digital vernerunde, vernerunde mal, sikkerhetsinspeksjon, bygningsvernerunde",
  },
  lover: {
    title: "HMS Lover & Regler - Arbeidsmiljøloven & ISO 9001 | HMS Nova",
    description: "Komplett oversikt over HMS-lover i Norge. Arbeidsmiljøloven, internkontrollforskriften og ISO 9001. Oppdatert 2026. Les mer om dine plikter.",
    keywords: "arbeidsmiljøloven, internkontrollforskriften, iso 9001, hms lovverk, arbeidstilsynet regler",
  },
  iso: {
    title: "ISO 9001 Sjekkliste - Gratis Last Ned | HMS Nova",
    description: "Gratis ISO 9001 sjekkliste for full compliance med kvalitetsstyringsstandarden. HMS Nova har innebygd ISO 9001-støtte. Last ned nå.",
    keywords: "iso 9001 sjekkliste, iso 9001 compliance, kvalitetsstyring, iso sertifisering",
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
  creator: "@hmsnova",
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

