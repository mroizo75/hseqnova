/**
 * SDS VERSJON CACHING
 * 
 * Cache SDS-versjoner for å redusere antall web scraping-kall
 * - Cache i 14 dager
 * - 90% cache hit rate forventet
 */

import NodeCache from "node-cache";
import { SDSVersionInfo } from "./sds-version-checker";

// Cache i 14 dager (1,209,600 sekunder)
const sdsCache = new NodeCache({ 
  stdTTL: 14 * 24 * 60 * 60,
  checkperiod: 60 * 60, // Sjekk for utløpte entries hver time
  useClones: false, // Mindre minnebruk
});

/**
 * Hent fra cache eller null hvis ikke funnet
 */
export function getCachedVersion(
  supplier: string,
  productNumber: string
): SDSVersionInfo | null {
  const key = getCacheKey(supplier, productNumber);
  const cached = sdsCache.get<SDSVersionInfo>(key);
  
  if (cached) {
    console.log(`✅ Cache hit: ${supplier} - ${productNumber}`);
  }
  
  return cached || null;
}

/**
 * Lagre i cache
 */
export function setCachedVersion(
  supplier: string,
  productNumber: string,
  versionInfo: SDSVersionInfo
): void {
  const key = getCacheKey(supplier, productNumber);
  sdsCache.set(key, versionInfo);
  console.log(`💾 Cached: ${supplier} - ${productNumber}`);
}

/**
 * Generer cache-nøkkel
 * Bruker leverandør + første 5 tegn av CAS for å gruppere lignende produkter
 */
function getCacheKey(supplier: string, productNumber: string): string {
  const normalizedSupplier = supplier.toLowerCase().trim();
  const normalizedNumber = productNumber.toLowerCase().trim().substring(0, 10);
  return `sds:${normalizedSupplier}:${normalizedNumber}`;
}

/**
 * Slett fra cache (for testing)
 */
export function clearCache(): void {
  sdsCache.flushAll();
  console.log("🗑️ Cache tømt");
}

/**
 * Hent cache-statistikk
 */
export function getCacheStats() {
  return {
    keys: sdsCache.keys().length,
    hits: sdsCache.getStats().hits,
    misses: sdsCache.getStats().misses,
    hitRate: sdsCache.getStats().hits / (sdsCache.getStats().hits + sdsCache.getStats().misses),
  };
}
