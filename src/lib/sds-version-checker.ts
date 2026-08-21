/**
 * SDS VERSJONSSJEKK - ENKEL LØSNING
 * 
 * Søker på leverandør sine nettsider for å sjekke om det finnes nyere SDS
 * Bruker web scraping (ikke API) siden APIer ikke er offentlig tilgjengelige
 */

import * as cheerio from 'cheerio';

export interface SDSVersionInfo {
  productNumber: string;
  version?: string;
  revisionDate?: Date;
  downloadUrl?: string;
  isNewer: boolean;
}

/**
 * Søk på Sigma-Aldrich sin nettside
 */
export async function checkSigmaAldrichVersion(
  productNumber: string,
  currentDate?: Date
): Promise<SDSVersionInfo | null> {
  try {
    // Søk på Sigma-Aldrich sin dokumentsøk-side
    const searchUrl = `https://www.sigmaaldrich.com/NO/en/search/${encodeURIComponent(productNumber)}?focus=products`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`Sigma-Aldrich search failed: ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Finn SDS-lenke fra søkeresultat
    // (HTML-struktur kan variere, dette er et eksempel)
    const sdsLink = $('a[href*="sds"]').first().attr('href');
    
    if (!sdsLink) {
      return null;
    }

    // Hent SDS-siden
    const sdsResponse = await fetch(sdsLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const sdsHtml = await sdsResponse.text();
    const $sds = cheerio.load(sdsHtml);

    // Finn revisjonsdato (vanligvis i PDF-metadata eller på siden)
    // Dette varierer per leverandør
    const dateText = $sds('span:contains("Revision Date"), td:contains("Revision Date")')
      .next()
      .text()
      .trim();

    let revisionDate: Date | undefined;
    if (dateText) {
      revisionDate = new Date(dateText);
    }

    // Sjekk om det er nyere
    const isNewer = currentDate && revisionDate 
      ? revisionDate > currentDate 
      : true;

    return {
      productNumber,
      revisionDate,
      downloadUrl: sdsLink,
      isNewer,
    };
  } catch (error) {
    console.error(`Failed to check Sigma-Aldrich for ${productNumber}:`, error);
    return null;
  }
}

/**
 * Søk på VWR sin nettside
 */
export async function checkVWRVersion(
  catalogNumber: string,
  currentDate?: Date
): Promise<SDSVersionInfo | null> {
  try {
    const searchUrl = `https://no.vwr.com/store/search?keyword=${encodeURIComponent(catalogNumber)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Finn produktside
    const productLink = $('a[href*="/product/"]').first().attr('href');
    
    if (!productLink) {
      return null;
    }

    // På produktsida, finn SDS-lenke
    const productUrl = productLink.startsWith('http') 
      ? productLink 
      : `https://no.vwr.com${productLink}`;

    const productResponse = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const productHtml = await productResponse.text();
    const $product = cheerio.load(productHtml);

    const sdsLink = $product('a[href*="sds"], a:contains("SDS")').first().attr('href');
    
    if (!sdsLink) {
      return null;
    }

    // VWR har ofte PDF-metadata i lenken eller på siden
    const downloadUrl = sdsLink.startsWith('http') 
      ? sdsLink 
      : `https://no.vwr.com${sdsLink}`;

    return {
      productNumber: catalogNumber,
      downloadUrl,
      isNewer: true, // Vi kan ikke alltid få datoen, så vi antar at det kan være nyere
    };
  } catch (error) {
    console.error(`Failed to check VWR for ${catalogNumber}:`, error);
    return null;
  }
}

/**
 * Sjekk Fisher Scientific
 */
export async function checkFisherVersion(
  catalogNumber: string,
  currentDate?: Date
): Promise<SDSVersionInfo | null> {
  try {
    const searchUrl = `https://www.fishersci.no/shop/products/search?keyword=${encodeURIComponent(catalogNumber)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Fisher har ofte direkte SDS-lenke i søkeresultata
    const sdsLink = $('a[href*="sds"], a:contains("SDS")').first().attr('href');
    
    if (!sdsLink) {
      return null;
    }

    const downloadUrl = sdsLink.startsWith('http') 
      ? sdsLink 
      : `https://www.fishersci.no${sdsLink}`;

    return {
      productNumber: catalogNumber,
      downloadUrl,
      isNewer: true,
    };
  } catch (error) {
    console.error(`Failed to check Fisher for ${catalogNumber}:`, error);
    return null;
  }
}

/**
 * Generisk versjonskontroll (med caching)
 */
export async function checkSDSVersion(
  supplier: string,
  productNumber: string,
  currentDate?: Date
): Promise<SDSVersionInfo | null> {
  // Importer cache dynamisk for å unngå sirkelvise avhengigheter
  const { getCachedVersion, setCachedVersion } = await import('./sds-cache');
  
  // Sjekk cache først
  const cached = getCachedVersion(supplier, productNumber);
  if (cached) {
    return cached;
  }

  // Hvis ikke i cache, hent fra leverandør
  const normalizedSupplier = supplier.toLowerCase();
  let versionInfo: SDSVersionInfo | null = null;

  if (normalizedSupplier.includes('sigma') || normalizedSupplier.includes('aldrich')) {
    versionInfo = await checkSigmaAldrichVersion(productNumber, currentDate);
  } else if (normalizedSupplier.includes('vwr') || normalizedSupplier.includes('avantor')) {
    versionInfo = await checkVWRVersion(productNumber, currentDate);
  } else if (normalizedSupplier.includes('fisher') || normalizedSupplier.includes('thermo')) {
    versionInfo = await checkFisherVersion(productNumber, currentDate);
  }

  // Lagre i cache hvis funnet
  if (versionInfo) {
    setCachedVersion(supplier, productNumber, versionInfo);
  }

  return versionInfo;
}
