/**
 * Site register export for the digital safety board.
 * Operational access record — not a CDM 2015 duty.
 * Retention of six months after work ends matches the CDM roster operational period.
 */

/** Operational retention after work ends — not a CDM statutory period. */
export const OVERSIKTSLISTE_RETENTION_MONTHS = 6;

/**
 * Antall måneder uten innsjekk før arbeidet regnes som avsluttet på tavler der
 * byggherren ikke har satt sluttdato. Uten en slik grense ville personopplysninger
 * ligget uten sluttdato, i strid med GDPR art. 5 nr. 1 bokstav e.
 */
export const OVERSIKTSLISTE_INACTIVITY_MONTHS = 6;

export interface OversiktslisteRad {
  name: string;
  employer: string | null;
  employerOrgNr: string | null;
  hmsCardNr: string | null;
  birthDate: string | null;
  phone: string | null;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  date: string;
}

export interface OversiktslisteKontekst {
  siteName: string;
  siteAddress: string | null;
  clientName: string | null;
}

/** Beregner når oversiktslisten for en tavle kan slettes. */
export function calculateRetentionCutoff(
  workEndedAt: Date | null,
  lastCheckinAt: Date | null,
  now: Date
): { cutoff: Date | null; basis: "workEndedAt" | "inactivity" } {
  if (workEndedAt) {
    const cutoff = new Date(workEndedAt);
    cutoff.setMonth(cutoff.getMonth() + OVERSIKTSLISTE_RETENTION_MONTHS);
    return { cutoff, basis: "workEndedAt" };
  }

  if (!lastCheckinAt) return { cutoff: null, basis: "inactivity" };

  // Arbeidet regnes som avsluttet ved siste innsjekk, og listen beholdes seks
  // måneder etter det – men først etter en inaktiv periode av samme lengde.
  const antattAvsluttet = new Date(lastCheckinAt);
  antattAvsluttet.setMonth(antattAvsluttet.getMonth() + OVERSIKTSLISTE_INACTIVITY_MONTHS);
  if (antattAvsluttet > now) return { cutoff: null, basis: "inactivity" };

  const cutoff = new Date(antattAvsluttet);
  cutoff.setMonth(cutoff.getMonth() + OVERSIKTSLISTE_RETENTION_MONTHS);
  return { cutoff, basis: "inactivity" };
}

function csvFelt(verdi: string | null | undefined): string {
  const tekst = (verdi ?? "").replace(/"/g, '""');
  return `"${tekst}"`;
}

function formaterTidspunkt(verdi: Date | null): string {
  if (!verdi) return "";
  const dato = verdi instanceof Date ? verdi : new Date(verdi);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dato.getFullYear()}-${pad(dato.getMonth() + 1)}-${pad(dato.getDate())} ${pad(dato.getHours())}:${pad(dato.getMinutes())}`;
}

/**
 * CSV for the operational site register. British English headers.
 */
export function buildOversiktslisteCsv(
  rader: ReadonlyArray<OversiktslisteRad>,
  kontekst: OversiktslisteKontekst
): string {
  const kolonner = [
    "Site",
    "Address",
    "Client",
    "Date",
    "Name",
    "Date of birth",
    "Employer",
    "Company number",
    "Competence card number",
    "Telephone",
    "Checked in",
    "Checked out",
  ];

  const linjer = rader.map((rad) =>
    [
      csvFelt(kontekst.siteName),
      csvFelt(kontekst.siteAddress),
      csvFelt(kontekst.clientName),
      csvFelt(rad.date),
      csvFelt(rad.name),
      csvFelt(rad.birthDate),
      csvFelt(rad.employer),
      csvFelt(rad.employerOrgNr),
      csvFelt(rad.hmsCardNr),
      csvFelt(rad.phone),
      csvFelt(formaterTidspunkt(rad.checkedInAt)),
      csvFelt(formaterTidspunkt(rad.checkedOutAt)),
    ].join(";")
  );

  return `\uFEFF${kolonner.map(csvFelt).join(";")}\n${linjer.join("\n")}\n`;
}

/** Normaliserer organisasjonsnummer til ni siffer, eller null om det er ugyldig. */
export function normalizeOrgNr(input: string | null | undefined): string | null {
  if (!input) return null;
  const siffer = input.replace(/\D/g, "");
  return siffer.length === 9 ? siffer : null;
}
