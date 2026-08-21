export type PpePictogram = {
  id: string;
  name: string;
  file: string;
};

export type HazardPictogram = {
  id: string;
  name: string;
  file: string;
  code: string;
};

export const PPE_PICTOGRAMS: PpePictogram[] = [
  { id: "M001", name: "Generelt påbudt", file: "ISO_7010_M001.svg.png" },
  { id: "M002", name: "Les instruksjonsbok", file: "ISO_7010_M002.svg.png" },
  { id: "M003", name: "Hørselsvern", file: "ISO_7010_M003.svg.png" },
  { id: "M004", name: "Vernebriller", file: "ISO_7010_M004.svg.png" },
  { id: "M005", name: "Jording påkrevd", file: "ISO_7010_M005.svg.png" },
  { id: "M006", name: "Koble fra strøm", file: "ISO_7010_M006.svg.png" },
  { id: "M007", name: "Mørke vernebriller", file: "ISO_7010_M007.svg.png" },
  { id: "M008", name: "Fotvern", file: "ISO_7010_M008.svg.png" },
  { id: "M009", name: "Vernehansker", file: "ISO_7010_M009.svg.png" },
  { id: "M010", name: "Verneklær", file: "ISO_7010_M010.svg.png" },
  { id: "M011", name: "Vask hendene", file: "ISO_7010_M011.svg.png" },
  { id: "M012", name: "Bruk gelender", file: "ISO_7010_M012.svg.png" },
  { id: "M013", name: "Ansiktsskjerm", file: "ISO_7010_M013.svg.png" },
  { id: "M014", name: "Hjelm", file: "ISO_7010_M014.svg.png" },
  { id: "M015", name: "Refleksvest", file: "ISO_7010_M015.svg.png" },
  { id: "M016", name: "Maske", file: "ISO_7010_M016.svg.png" },
  { id: "M017", name: "Åndedrettsvern", file: "ISO_7010_M017.svg.png" },
  { id: "M018", name: "Vernesko", file: "ISO_7010_M018.svg.png" },
  { id: "M019", name: "Sikkerhetsbelte", file: "ISO_7010_M019.svg.png" },
  { id: "M020", name: "Fotbeskyttelse", file: "ISO_7010_M020.svg.png" },
  { id: "M021", name: "Antistatiske sko", file: "ISO_7010_M021.svg.png" },
  { id: "M022", name: "Ledende sko", file: "ISO_7010_M022.svg.png" },
  { id: "M023", name: "Beskyttende lær", file: "ISO_7010_M023.svg.png" },
  { id: "M024", name: "Hansker mot elektrisk støt", file: "ISO_7010_M024.svg.png" },
  { id: "M025", name: "Hansker mot kjemikalier", file: "ISO_7010_M025.svg.png" },
  { id: "M026", name: "Beskyttelse mot kulde", file: "ISO_7010_M026.svg.png" },
  { id: "M027", name: "Heldekkende ansikt", file: "ISO_7010_M027.svg.png" },
  { id: "M028", name: "Hørselsbeskyttelse", file: "ISO_7010_M028.svg.png" },
  { id: "M029", name: "Isolerende hansker", file: "ISO_7010_M029.svg.png" },
  { id: "M030", name: "Bruk fotgjenger-rute", file: "ISO_7010_M030.svg.png" },
  { id: "M031", name: "Bruk spesiell rute", file: "ISO_7010_M031.svg.png" },
  { id: "M032", name: "Antistatiske hansker", file: "ISO_7010_M032.svg.png" },
  { id: "M033", name: "Vernehansker", file: "ISO_7010_M033.svg.png" },
  { id: "M034", name: "Les instruksjoner", file: "ISO_7010_M034.svg.png" },
  { id: "M035", name: "Vernebriller m/sideskjermer", file: "ISO_7010_M035.svg.png" },
  { id: "M036", name: "Øyebeskyttelse", file: "ISO_7010_M036.svg.png" },
  { id: "M037", name: "Ansiktsbeskyttelse", file: "ISO_7010_M037.svg.png" },
  { id: "M038", name: "Åndedrettsvern", file: "ISO_7010_M038.svg.png" },
  { id: "M039", name: "Hørselsvern", file: "ISO_7010_M039.svg.png" },
  { id: "M040", name: "Vernehjelm", file: "ISO_7010_M040.svg.png" },
  { id: "M041", name: "Verneutstyr", file: "ISO_7010_M041.svg.png" },
  { id: "M042", name: "Verneklær", file: "ISO_7010_M042.svg.png" },
  { id: "M043", name: "Friskluftsapparat", file: "ISO_7010_M043.svg.png" },
  { id: "M044", name: "Vernesko", file: "ISO_7010_M044.svg.png" },
  { id: "M045", name: "Koble fra før arbeid", file: "ISO_7010_M045.svg.png" },
  { id: "M046", name: "Vernehansker ved arbeid", file: "ISO_7010_M046.svg.png" },
  { id: "M047", name: "Heldekkende verneutstyr", file: "ISO_7010_M047.svg.png" },
  { id: "M048", name: "Sikkerhetssele", file: "ISO_7010_M048.svg.png" },
  { id: "M049", name: "Fotbeskyttelse", file: "ISO_7010_M049.svg.png" },
  { id: "M050", name: "Beskyttende hansker", file: "ISO_7010_M050.svg.png" },
  { id: "M051", name: "Hørselsvern (øreklokker)", file: "ISO_7010_M051.svg.png" },
  { id: "M052", name: "Gassmaske", file: "ISO_7010_M052.svg.png" },
  { id: "M053", name: "Vernehjelm m/ørebeskyttelse", file: "ISO_7010_M053.svg.png" },
  { id: "M054", name: "Støvmaske", file: "ISO_7010_M054.svg.png" },
  { id: "M055", name: "Vernehjelm m/ansiktsskjerm", file: "ISO_7010_M055.svg.png" },
  { id: "M056", name: "Sveisemaske", file: "ISO_7010_M056.svg.png" },
  { id: "M057", name: "Anti-kutt hansker", file: "ISO_7010_M057.svg.png" },
  { id: "M058", name: "Anti-vibrasjonshansker", file: "ISO_7010_M058.svg.png" },
  { id: "M059", name: "Varmebeskyttelse", file: "ISO_7010_M059.svg.png" },
  { id: "M060", name: "Sko mot varme", file: "ISO_7010_M060.svg.png" },
  { id: "M061", name: "Hansker mot varme", file: "ISO_7010_M061.svg.png" },
  { id: "M062", name: "Klær mot varme", file: "ISO_7010_M062.svg.png" },
];

const ppeMap = new Map<string, PpePictogram>();
for (const item of PPE_PICTOGRAMS) {
  ppeMap.set(item.file, item);
}

export const HAZARD_PICTOGRAMS: HazardPictogram[] = [
  { id: "brannfarlig", name: "Brannfarlig", file: "brannfarlig.webp", code: "F" },
  { id: "etsende", name: "Etsende", file: "etsende.webp", code: "C" },
  { id: "explosive", name: "Eksplosivt", file: "explosive.webp", code: "E" },
  { id: "gass_under_trykk", name: "Gass under trykk", file: "gass_under_trykk.webp", code: "G" },
  { id: "giftig", name: "Giftig", file: "giftig.webp", code: "T" },
  { id: "helserisiko", name: "Helsefare", file: "helserisiko.webp", code: "H" },
  { id: "kronisk_helsefarlig", name: "Kronisk helsefarlig", file: "kronisk_helsefarlig.webp", code: "X" },
  { id: "miljofare", name: "Miljøfare", file: "miljofare.webp", code: "M" },
  { id: "oksiderende", name: "Oksiderende", file: "oksiderende.webp", code: "O" },
];

const hazardMap = new Map<string, HazardPictogram>();
for (const item of HAZARD_PICTOGRAMS) {
  hazardMap.set(item.file, item);
}

export function getPpePictogram(file: string): PpePictogram | undefined {
  return ppeMap.get(file);
}

export function getHazardPictogram(file: string): HazardPictogram | undefined {
  return hazardMap.get(file);
}

// Helper: Maps old PPE names to correct file paths
const ppeNameToFileMap = new Map<string, string>();
for (const item of PPE_PICTOGRAMS) {
  ppeNameToFileMap.set(item.name.toLowerCase(), item.file);
}

// Normalize PPE value to correct file path
export function normalizePpeFile(value: string): string | null {
  // Already a valid file path?
  if (value.startsWith("ISO_7010_") && value.endsWith(".png")) {
    return value;
  }
  // Check if it's a known name (case-insensitive)
  const normalized = ppeNameToFileMap.get(value.toLowerCase());
  if (normalized) {
    return normalized;
  }
  // Try partial match
  for (const [name, file] of ppeNameToFileMap) {
    if (name.includes(value.toLowerCase()) || value.toLowerCase().includes(name)) {
      return file;
    }
  }
  return null; // Not found
}

