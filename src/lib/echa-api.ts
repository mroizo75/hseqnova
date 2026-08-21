/**
 * ECHA (European Chemicals Agency) API Integration
 * Gratis API for kjemikaliedata fra EU
 * 
 * API-dokumentasjon: https://echa.europa.eu/information-on-chemicals
 * Ingen API-nøkkel kreves for grunnleggende oppslag
 */

export interface EchaSubstance {
  casNumber: string;
  ecNumber?: string;
  substanceName: string;
  isCMR: boolean; // Carcinogenic, Mutagenic, Reprotoxic
  isSVHC: boolean; // Substance of Very High Concern
  reachStatus?: string;
  hazardClass?: string[];
  hazardStatements?: string[];
  precautionaryStatements?: string[];
  candidateListDate?: string;
}

interface EchaApiResponse {
  substances?: Array<{
    ec_number?: string;
    cas_number: string;
    name: string;
    classifications?: Array<{
      hazard_class: string;
      hazard_statements: string[];
    }>;
    svhc_info?: {
      is_svhc: boolean;
      candidate_list_date?: string;
    };
    cmr_info?: {
      is_cmr: boolean;
    };
    reach_status?: string;
  }>;
}

/**
 * Søk etter stoff basert på CAS-nummer
 */
export async function searchSubstanceByCAS(casNumber: string): Promise<EchaSubstance | null> {
  try {
    // ECHA har flere APIer - vi bruker CHEM API
    // Alternativ: https://echa.europa.eu/api/substance/search/{cas}
    const cleanCAS = casNumber.trim().replace(/\s/g, '');
    
    // For demo: bruk PubChem API som backup (gratis og åpen)
    const pubchemResponse = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanCAS)}/JSON`
    );
    
    if (!pubchemResponse.ok) {
      console.warn(`PubChem lookup failed for CAS ${cleanCAS}`);
      return null;
    }

    const pubchemData = await pubchemResponse.json();
    
    // Ekstrahér grunnleggende informasjon
    const compound = pubchemData.PC_Compounds?.[0];
    if (!compound) return null;

    // I produksjon: koble til ECHA CHEM API eller bruke web scraping
    // For nå: returner grunnleggende data fra PubChem
    const substance: EchaSubstance = {
      casNumber: cleanCAS,
      ecNumber: undefined, // Må hentes fra ECHA
      substanceName: compound.props?.find((p: any) => p.urn?.label === "IUPAC Name")?.value?.sval || "Ukjent",
      isCMR: false, // Må evalueres basert på H-setninger
      isSVHC: false, // Må sjekkes mot ECHA kandidatliste
      hazardStatements: [],
      precautionaryStatements: [],
    };

    return substance;
  } catch (error) {
    console.error(`ECHA API error for CAS ${casNumber}:`, error);
    return null;
  }
}

/**
 * Beregn farenivå basert på H-setninger
 * 1 = Lav fare, 5 = Svært høy fare
 */
export function calculateHazardLevel(hazardStatements: string[]): number {
  if (!hazardStatements || hazardStatements.length === 0) return 1;

  let maxLevel = 1;

  for (const statement of hazardStatements) {
    const h = statement.toUpperCase().match(/H(\d+)/)?.[1];
    if (!h) continue;

    const code = parseInt(h);

    // H300-serien (Helse)
    if (code >= 300 && code < 400) {
      if (code >= 300 && code <= 311) maxLevel = Math.max(maxLevel, 5); // Fatal/toksisk
      else if (code >= 312 && code <= 319) maxLevel = Math.max(maxLevel, 4); // Skadelig
      else if (code >= 330 && code <= 336) maxLevel = Math.max(maxLevel, 5); // Fatal ved innånding
      else if (code >= 340 && code <= 351) maxLevel = Math.max(maxLevel, 5); // CMR (kreft, mutasjon, reproduksjon)
      else if (code >= 360 && code <= 373) maxLevel = Math.max(maxLevel, 5); // CMR / Organskade
      else maxLevel = Math.max(maxLevel, 3);
    }
    // H400-serien (Miljø)
    else if (code >= 400 && code < 500) {
      if (code >= 400 && code <= 411) maxLevel = Math.max(maxLevel, 4); // Svært giftig for vannlevende organismer
      else maxLevel = Math.max(maxLevel, 3);
    }
    // H200-serien (Fysisk)
    else if (code >= 200 && code < 300) {
      if (code >= 200 && code <= 205) maxLevel = Math.max(maxLevel, 5); // Eksplosiver
      else if (code >= 220 && code <= 229) maxLevel = Math.max(maxLevel, 4); // Brannfarlige gasser/væsker
      else maxLevel = Math.max(maxLevel, 3);
    }
  }

  return maxLevel;
}

/**
 * Sjekk om stoff er CMR (kreftfremkallende, mutagent, reproduksjonstoksisk)
 */
export function isCMRSubstance(hazardStatements: string[]): boolean {
  const cmrCodes = [
    "H340", // Kan forårsake genetiske defekter
    "H341", // Mistenkt for å forårsake genetiske defekter
    "H350", // Kan forårsake kreft
    "H350i", // Kan forårsake kreft ved innånding
    "H351", // Mistenkt for å kunne forårsake kreft
    "H360", // Kan skade reproduksjonsevne eller barnet i mors liv
    "H360F", // Kan skade reproduksjonsevne
    "H360D", // Kan skade barnet i mors liv
    "H360FD", // Kan skade reproduksjonsevne og barnet i mors liv
    "H360Fd", // Kan skade reproduksjonsevne. Mistenkt for å skade barnet i mors liv
    "H360Df", // Kan skade barnet i mors liv. Mistenkt for å skade reproduksjonsevne
    "H361", // Mistenkt for å skade reproduksjonsevne eller barnet i mors liv
    "H361f", // Mistenkt for å skade reproduksjonsevne
    "H361d", // Mistenkt for å skade barnet i mors liv
    "H361fd", // Mistenkt for å skade reproduksjonsevne og barnet i mors liv
    "H362", // Kan skade barn som ammes
  ];

  return hazardStatements.some(statement => 
    cmrCodes.some(cmr => statement.toUpperCase().includes(cmr))
  );
}

/**
 * Beregn substitusjonsprioritet
 */
export function calculateSubstitutionPriority(
  isCMR: boolean,
  isSVHC: boolean,
  hazardLevel: number
): "HIGH" | "MEDIUM" | "LOW" | null {
  if (isCMR || isSVHC) return "HIGH";
  if (hazardLevel >= 4) return "HIGH";
  if (hazardLevel === 3) return "MEDIUM";
  if (hazardLevel === 2) return "LOW";
  return null;
}

/**
 * Foreslå alternativer basert på faredata
 * (I produksjon: koble til database med kjente substitutter)
 */
export async function suggestAlternatives(
  casNumber: string,
  productName: string,
  hazardClass?: string
): Promise<string[]> {
  // Placeholder: I produksjon ville dette:
  // 1. Søke i en database over kjente substitutter
  // 2. Bruke AI til å foreslå tryggere alternativer
  // 3. Hente data fra leverandører om "grønnere" produkter
  
  const alternatives: string[] = [];

  // Eksempel på logikk:
  if (casNumber === "50-00-0") { // Formaldehyd
    alternatives.push("Glutaraldehyd (mindre farlig alternativ)");
    alternatives.push("Vurdér alkoholdbaserte desinfeksjonsmidler");
  }

  return alternatives;
}

/**
 * Batch-prosessering av flere stoffer
 */
export async function batchSearchSubstances(casNumbers: string[]): Promise<Map<string, EchaSubstance | null>> {
  const results = new Map<string, EchaSubstance | null>();
  
  // Prosesser i batches for å unngå rate limiting
  const batchSize = 5;
  for (let i = 0; i < casNumbers.length; i += batchSize) {
    const batch = casNumbers.slice(i, i + batchSize);
    const promises = batch.map(cas => searchSubstanceByCAS(cas));
    const batchResults = await Promise.all(promises);
    
    batch.forEach((cas, index) => {
      results.set(cas, batchResults[index]);
    });
    
    // Vent litt mellom batches
    if (i + batchSize < casNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
