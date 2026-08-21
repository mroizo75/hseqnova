/**
 * SMART SDS-SCHEDULER
 * 
 * Intelligent prioritering for å håndtere stor skala (10,000+ kunder)
 * - CMR/SVHC: Sjekkes ukentlig
 * - Høy faregrad: Månedlig
 * - Medium faregrad: Kvartalsvis
 * - Lav faregrad: Årlig
 */

import { prisma } from "@/lib/db";
import { Chemical } from "@prisma/client";

/**
 * Hent kjemikalier som skal sjekkes basert på prioritet
 */
export async function getChemicalsToCheck(
  date: Date = new Date()
): Promise<Chemical[]> {
  const dayOfWeek = date.getDay(); // 0 = søndag, 1 = mandag
  const dayOfMonth = date.getDate();
  const weekOfYear = getWeekNumber(date);

  let chemicals: Chemical[] = [];

  // MANDAG: Sjekk CMR-substanser (kritisk - ukentlig)
  if (dayOfWeek === 1) {
    console.log("📍 Prioritet KRITISK: CMR-substanser");
    chemicals = await prisma.chemical.findMany({
      where: {
        status: "ACTIVE",
        isCMR: true,
        supplier: { not: null },
        casNumber: { not: null },
      },
      take: 10000, // Maks 10k per dag
    });
  }

  // TIRSDAG: Sjekk SVHC-stoffer (kritisk - ukentlig)
  else if (dayOfWeek === 2) {
    console.log("📍 Prioritet KRITISK: SVHC-stoffer");
    chemicals = await prisma.chemical.findMany({
      where: {
        status: "ACTIVE",
        isSVHC: true,
        isCMR: false, // Ikke sjekk CMR igjen
        supplier: { not: null },
        casNumber: { not: null },
      },
      take: 10000,
    });
  }

  // ONSDAG: Sjekk høy faregradering (månedlig)
  else if (dayOfWeek === 3 && dayOfMonth <= 7) {
    console.log("📍 Prioritet HØY: Faregrad 3-4");
    chemicals = await prisma.chemical.findMany({
      where: {
        status: "ACTIVE",
        hazardLevel: { gte: 3 },
        isCMR: false,
        isSVHC: false,
        supplier: { not: null },
        casNumber: { not: null },
      },
      take: 5000,
    });
  }

  // TORSDAG: Sjekk medium faregradering (kvartalsvis)
  else if (dayOfWeek === 4 && [1, 14, 27, 40].includes(weekOfYear)) {
    console.log("📍 Prioritet MEDIUM: Faregrad 1-2 (kvartal)");
    chemicals = await prisma.chemical.findMany({
      where: {
        status: "ACTIVE",
        hazardLevel: { in: [1, 2] },
        supplier: { not: null },
        casNumber: { not: null },
      },
      take: 7000,
    });
  }

  // FREDAG: Sjekk lav risiko (årlig, rotert)
  else if (dayOfWeek === 5) {
    console.log("📍 Prioritet LAV: Små mengder/nylig oppdatert");
    const offset = (weekOfYear % 52) * 1000; // Roter gjennom året
    chemicals = await prisma.chemical.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { quantity: { lte: 1 } }, // Små mengder
          { 
            sdsDate: { 
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // <6 mnd gamle
            } 
          },
        ],
        supplier: { not: null },
        casNumber: { not: null },
      },
      skip: offset,
      take: 1000,
    });
  }

  console.log(`✅ Fant ${chemicals.length} kjemikalier å sjekke`);
  return chemicals;
}

/**
 * Hent ukenummer (ISO 8601)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Beregn prioritet for et kjemikalie
 */
export function calculatePriority(chemical: Chemical): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (chemical.isCMR || chemical.isSVHC) return "CRITICAL";
  if (chemical.hazardLevel && chemical.hazardLevel >= 3) return "HIGH";
  if (chemical.hazardLevel && chemical.hazardLevel >= 1) return "MEDIUM";
  return "LOW";
}

/**
 * Beregn hvor ofte et kjemikalie skal sjekkes (i dager)
 */
export function getCheckFrequency(priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"): number {
  switch (priority) {
    case "CRITICAL": return 7;    // Ukentlig
    case "HIGH": return 30;        // Månedlig
    case "MEDIUM": return 90;      // Kvartalsvis
    case "LOW": return 365;        // Årlig
  }
}

/**
 * Sjekk om et kjemikalie trenger versjonskontroll nå
 */
export function needsCheck(chemical: Chemical, lastCheck?: Date): boolean {
  const priority = calculatePriority(chemical);
  const frequency = getCheckFrequency(priority);
  
  if (!lastCheck) return true; // Aldri sjekket
  
  const daysSinceCheck = Math.floor(
    (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceCheck >= frequency;
}
