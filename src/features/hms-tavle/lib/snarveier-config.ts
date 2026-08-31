/**
 * Forhåndsdefinerte HMS-snarveier for Digital HMS Tavle.
 *
 * Hver snarvei har:
 *  - id: unik nøkkel lagret i config
 *  - label: vises på knappen
 *  - icon: Lucide-ikonnavn
 *  - color: Tailwind bg-farge for knappen
 *  - hmsFunksjon: internal HSEQ Nova path (used automatically for ADDON plan)
 *  - lovRef: valgfri paragraf-referanse som vises under knappen
 */

export interface SnarveiDefinisjon {
  id: string;
  label: string;
  icon: string;
  color: string;        // Tailwind bg-klasse
  textColor: string;    // Tailwind text-klasse
  hmsFunksjon: string;  // relative path in HSEQ Nova: /dashboard/...
  lovRef?: string;
}

export const ALLE_SNARVEIER: SnarveiDefinisjon[] = [
  {
    id: "avvik",
    label: "Incident",
    icon: "AlertTriangle",
    color: "bg-red-500/20 hover:bg-red-500/40 border-red-500/40",
    textColor: "text-red-300",
    hmsFunksjon: "/dashboard/avvik/ny",
    lovRef: "RIDDOR / accident book",
  },
  {
    id: "sja",
    label: "RAMS",
    icon: "Shield",
    color: "bg-orange-500/20 hover:bg-orange-500/40 border-orange-500/40",
    textColor: "text-orange-300",
    hmsFunksjon: "/dashboard/sja/ny",
    lovRef: "MHSWR reg.3",
  },
  {
    id: "sha_plan",
    label: "Construction phase plan",
    icon: "ClipboardList",
    color: "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/40",
    textColor: "text-blue-300",
    hmsFunksjon: "/dashboard/construction-compliance",
    lovRef: "CDM 2015 reg.12",
  },
  {
    id: "vernerunde",
    label: "Workplace inspection",
    icon: "Search",
    color: "bg-green-500/20 hover:bg-green-500/40 border-green-500/40",
    textColor: "text-green-300",
    hmsFunksjon: "/dashboard/vernerunder",
    lovRef: "MHSWR reg.5",
  },
  {
    id: "innsjekk",
    label: "Check-in",
    icon: "UserCheck",
    color: "bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-500/40",
    textColor: "text-emerald-300",
    hmsFunksjon: "",
    lovRef: "Site access",
  },
  {
    id: "dokumenter",
    label: "Documents",
    icon: "FolderOpen",
    color: "bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/40",
    textColor: "text-purple-300",
    hmsFunksjon: "/dashboard/dokumenter",
  },
  {
    id: "stoffkartotek",
    label: "COSHH",
    icon: "FlaskConical",
    color: "bg-yellow-500/20 hover:bg-yellow-500/40 border-yellow-500/40",
    textColor: "text-yellow-300",
    hmsFunksjon: "/dashboard/stoffkartotek",
    lovRef: "COSHH 2002",
  },
  {
    id: "opplaering",
    label: "Training",
    icon: "GraduationCap",
    color: "bg-indigo-500/20 hover:bg-indigo-500/40 border-indigo-500/40",
    textColor: "text-indigo-300",
    hmsFunksjon: "/dashboard/opplaering",
    lovRef: "HSWA s.2(2)(c)",
  },
  {
    id: "risiko",
    label: "Risk assessment",
    icon: "Gauge",
    color: "bg-rose-500/20 hover:bg-rose-500/40 border-rose-500/40",
    textColor: "text-rose-300",
    hmsFunksjon: "/dashboard/risiko",
    lovRef: "MHSWR reg.3",
  },
  {
    id: "tiltak",
    label: "Actions",
    icon: "Wrench",
    color: "bg-cyan-500/20 hover:bg-cyan-500/40 border-cyan-500/40",
    textColor: "text-cyan-300",
    hmsFunksjon: "/dashboard/tiltak",
  },
  {
    id: "timeregistrering",
    label: "Time recording",
    icon: "Clock",
    color: "bg-slate-500/20 hover:bg-slate-500/40 border-slate-500/40",
    textColor: "text-slate-300",
    hmsFunksjon: "/dashboard/timer",
  },
  {
    id: "varsling",
    label: "Whistleblowing",
    icon: "Bell",
    color: "bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/40",
    textColor: "text-amber-300",
    hmsFunksjon: "/dashboard/whistleblowing",
    lovRef: "PIDA 1998",
  },
];

export interface SnarveiConfig {
  id: string;
  isVisible: boolean;
  externalUrl?: string;   // Overrides HSEQ Nova link for standalone/own systems
  customLabel?: string;   // Valgfritt egendefinert navn
}

/** Hent definisjon for én snarvei */
export function getSnarveiDef(id: string): SnarveiDefinisjon | undefined {
  return ALLE_SNARVEIER.find((s) => s.id === id);
}

/** Standard-konfig: avvik, sja, sha_plan, vernerunde, innsjekk synlige */
export const DEFAULT_SNARVEIER_CONFIG: SnarveiConfig[] = ALLE_SNARVEIER.map((s) => ({
  id: s.id,
  isVisible: ["avvik", "sja", "sha_plan", "vernerunde", "innsjekk"].includes(s.id),
  externalUrl: "",
  customLabel: "",
}));
