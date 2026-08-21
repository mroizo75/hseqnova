/**
 * Bransjekonfigurasjon for Digital HMS Tavle.
 *
 * Brukes til å tilpasse seksjonstekster, lovkrav-referanser og seksjonsforslag
 * basert på hvilken bransje tavlen er konfigurert for.
 */

import { SAFETY_BOARD_SECTION_LABELS } from "./safety-board-labels";

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
 * Bygg og anlegg bruker Byggherreforskriften-paragrafer.
 * Reiseliv bruker tilpassede tjeneste-/gjestetekster.
 * Andre bransjer bruker AML/IK-HMS-referanser.
 */
export function getSectionLabels(_bransje: string | null | undefined): Record<string, string> {
  return { ...SAFETY_BOARD_SECTION_LABELS };
}

/**
 * Lovkrav-sjekkliste tilpasset bransje.
 * Hjemmel: AML / IK-HMS / IK-mat / næringsmiddelhygieneforskriften /
 * Pakkereiseloven / Yrkestransportlova
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
    return [
      // § 7 krever SHA-plan, § 8 stiller kravene til innholdet i planen
      { label: "SHA-plan godkjent",           ok: isAddon ? shaPlan?.status === "ACTIVE" : null, ref: "§ 7+8" },
      // Forhåndsmelding til Arbeidstilsynet er § 10, og skal stå synlig på plassen
      { label: "Forhåndsmelding sendt",       ok: isAddon ? !!preNotif?.sentAt : null,           ref: "§ 10" },
      // § 15 krever at oversiktslisten kontrolleres og oppdateres daglig
      {
        label: "Mannskapsliste ført i dag",
        ok: checkinsToday === undefined ? null : checkinsToday > 0,
        ref: "§ 15",
      },
      // Koordinator utpekes etter § 13 og følger opp arbeidet etter § 14
      { label: "Koordinator utpekt",           ok: null,                                          ref: "§ 13+14" },
    ];
  }

  if (bransje === "HOTELL_OVERNATTING") {
    return [
      { label: "HMS-plan oppdatert",               ok: null, ref: "IK-HMS § 5" },
      { label: "Risikovurdering gjennomført",       ok: null, ref: "AML § 3-1" },
      { label: "Beredskapsplan – brann/evakuering", ok: null, ref: "AML § 4-2 + Brannloven" },
      { label: "Verneombud valgt",                  ok: null, ref: "AML § 6-1" },
      { label: "BHT-tilknytning dokumentert",       ok: null, ref: "Forskrift kode 55.1" },
      { label: "Kjemikalier/stoffkartotek oppdatert", ok: null, ref: "AML § 4-5" },
    ];
  }

  if (bransje === "RESTAURANT_SERVERING") {
    return [
      { label: "HMS-plan oppdatert",               ok: null, ref: "IK-HMS § 5" },
      { label: "Internkontroll for mat dokumentert", ok: null, ref: "IK-mat § 4" },
      { label: "HACCP-basert fareanalyse på plass",  ok: null, ref: "Forordning 852/2004 art. 5" },
      { label: "Registrert hos Mattilsynet",         ok: null, ref: "Forordning 852/2004 art. 6" },
      { label: "Allergeninformasjon tilgjengelig",  ok: null, ref: "EU-forordning 1169/2011" },
      { label: "BHT-tilknytning dokumentert",       ok: null, ref: "Forskrift kode 56.11/56.3" },
      { label: "Ansvarlig alkoholservering",        ok: null, ref: "Alkoholloven § 1-7c" },
    ];
  }

  if (bransje === "ATTRAKSJON_OPPLEVELSE") {
    return [
      { label: "HMS-plan oppdatert",               ok: null, ref: "IK-HMS § 5" },
      { label: "Risikovurdering gjennomført",       ok: null, ref: "AML § 3-1" },
      { label: "Gjestesikkerhet dokumentert",       ok: null, ref: "Produktkontrolloven § 3" },
      { label: "Beredskapsplan klar",               ok: null, ref: "AML § 4-2" },
      { label: "Sesongoppstartsprotokoll OK",       ok: null, ref: "IK-HMS § 5" },
    ];
  }

  if (bransje === "TUROPERATOR") {
    return [
      { label: "HMS-plan oppdatert",               ok: null, ref: "IK-HMS § 5" },
      { label: "Risikovurdering gjennomført",       ok: null, ref: "AML § 3-1" },
      { label: "Beredskapsplan – reisehendelser",  ok: null, ref: "Pakkereiseloven § 14" },
      { label: "Reisegaranti dokumentert",          ok: null, ref: "Pakkereiseloven § 3" },
      { label: "GDPR / behandlingsprotokoll",       ok: null, ref: "GDPR art. 30" },
    ];
  }

  if (bransje === "TURISTTRANSPORT") {
    return [
      { label: "HMS-plan oppdatert",               ok: null, ref: "IK-HMS § 5" },
      { label: "Løyvedokumentasjon gyldig",        ok: null, ref: "Yrkestransportlova § 4" },
      { label: "Kjøre-/hviletid dokumentert",      ok: null, ref: "Vegtransportloven § 7" },
      { label: "Sjåførkompetanse dokumentert",      ok: null, ref: "Forskrift om yrkessjåfør" },
      { label: "BHT-tilknytning dokumentert",       ok: null, ref: "Forskrift kode 49" },
    ];
  }

  // Generisk for øvrige bransjer
  return [
    { label: "HMS-plan oppdatert",            ok: null, ref: "IK-HMS § 5" },
    { label: "Risikovurdering gjennomført",   ok: null, ref: "AML § 3-1" },
    { label: "Beredskapsplan på plass",       ok: null, ref: "AML § 4-2" },
    { label: "Verneombud valgt",              ok: null, ref: "AML § 6-1" },
    { label: "Opplæring gjennomført",         ok: null, ref: "AML § 3-2" },
  ];
}
