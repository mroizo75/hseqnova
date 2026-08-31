/**
 * Industry labels for the digital safety board.
 * Construction uses CDM 2015. Other industries use HSWA / MHSWR / FSO.
 */

import { SAFETY_BOARD_SECTION_LABELS } from "./safety-board-labels";
import {
  constructionSiteInformationChecks,
  generalSiteInformationChecks,
} from "@/lib/safety-board-uk";

export const BRANSJE_OPTIONS = [
  { value: "BYGG_ANLEGG",          label: "Construction",              emoji: "🏗️" },
  { value: "EIENDOM",              label: "Property and facilities",      emoji: "🏢" },
  { value: "BORETTSLAG",           label: "Residential / housing",        emoji: "🏘️" },
  { value: "SYKEHUS_HELSE",        label: "Healthcare",            emoji: "🏥" },
  { value: "SKOLE_BARNEHAGE",      label: "Education",          emoji: "🏫" },
  { value: "LAGER_LOGISTIKK",      label: "Warehouse and logistics",          emoji: "📦" },
  { value: "INDUSTRI",             label: "Manufacturing",         emoji: "🏭" },
  { value: "VERKSTED",             label: "Workshop and service",         emoji: "🔧" },
  { value: "BUTIKK_KJEDE",         label: "Retail",             emoji: "🛒" },
  { value: "HOTELL_OVERNATTING",   label: "Hotels",       emoji: "🏨" },
  { value: "RESTAURANT_SERVERING", label: "Restaurants",     emoji: "🍽️" },
  { value: "ATTRAKSJON_OPPLEVELSE",label: "Attractions",    emoji: "🎡" },
  { value: "TUROPERATOR",          label: "Tour operator",emoji: "✈️" },
  { value: "TURISTTRANSPORT",      label: "Tourist transport",             emoji: "🚌" },
  { value: "ANNET",                label: "Other",                       emoji: "🏢" },
] as const;

export type BransjeValue = typeof BRANSJE_OPTIONS[number]["value"];

export function getBransjeLabel(value: string | null | undefined): string {
  return BRANSJE_OPTIONS.find((b) => b.value === value)?.label ?? "Construction";
}

export function getBransjeEmoji(value: string | null | undefined): string {
  return BRANSJE_OPTIONS.find((b) => b.value === value)?.emoji ?? "🏗️";
}

/**
 * Returnerer tilpassede seksjonstekster basert på bransje.
 */
export function getSectionLabels(_bransje: string | null | undefined): Record<string, string> {
  return { ...SAFETY_BOARD_SECTION_LABELS };
}

/**
 * Site information checklist. Construction maps to CDM 2015.
 * Other industries use general workplace duties. There is no statutory digital board.
 */
export function getLovkravItems(
  bransje: string | null | undefined,
  isAddon: boolean,
  tavle: any,
  checkinsToday?: number
): Array<{
  label: string; ok: boolean | null; ref: string;
}> {
  const isConstruction = !bransje || bransje === "BYGG_ANLEGG";
  const shaPlan = tavle?.project?.constructionShaPlan;
  const preNotif = tavle?.project?.constructionPreNotification;

  if (isConstruction) {
    if (!isAddon) {
      return [
        { label: "Construction phase plan available", ok: null, ref: "CDM 2015 reg.12" },
        { label: "F10 displayed in the site office if notifiable", ok: null, ref: "CDM 2015 reg.6" },
        { label: "Suitable site induction arranged", ok: null, ref: "CDM 2015 reg.13(4)(a)" },
        {
          label: "Site register check (operational — not a CDM duty)",
          ok: checkinsToday === undefined ? null : checkinsToday > 0,
          ref: "—",
        },
      ];
    }
    return constructionSiteInformationChecks({
      cppStatus: shaPlan?.status ?? null,
      f10: preNotif
        ? {
            status: preNotif.status,
            expectedStartDate: preNotif.expectedStartDate,
            expectedEndDate: preNotif.expectedEndDate,
            maxWorkersSimultaneous: preNotif.maxWorkersSimultaneous,
          }
        : null,
      checkinsToday,
    });
  }

  return generalSiteInformationChecks();
}
