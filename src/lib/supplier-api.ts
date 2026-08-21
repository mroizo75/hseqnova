/**
 * LEVERANDØR-API INTEGRASJONER
 * Automatisk henting av oppdaterte SDS-er fra store leverandører
 * 
 * Støttede leverandører:
 * - VWR (Avantor)
 * - Sigma-Aldrich (Merck)
 * - Fisher Scientific (Thermo Fisher)
 * - Brenntag
 */

export interface SupplierProduct {
  catalogNumber: string;
  productName: string;
  casNumber?: string;
  sdsUrl?: string;
  sdsVersion?: string;
  sdsDate?: Date;
  manufacturer?: string;
}

export interface SupplierSDSInfo {
  product: SupplierProduct;
  sdsAvailable: boolean;
  sdsUrl?: string;
  sdsVersion?: string;
  sdsLastUpdated?: Date;
  downloadUrl?: string; // Direkte nedlastingslenke
}

/**
 * VWR (Avantor) API
 * Dokumentasjon: https://developer.vwr.com/
 */
export class VWRSupplierAPI {
  private apiKey: string;
  private region: string; // "eu", "us", "asia"

  constructor(apiKey: string, region: string = "eu") {
    this.apiKey = apiKey;
    this.region = region;
  }

  /**
   * Søk etter produkt basert på katalognummer
   */
  async searchProduct(catalogNumber: string): Promise<SupplierProduct | null> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/products/search?q=${encodeURIComponent(catalogNumber)}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`VWR API error: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      if (!data.products || data.products.length === 0) {
        return null;
      }

      const product = data.products[0];
      return {
        catalogNumber: product.catalogNumber,
        productName: product.productName,
        casNumber: product.casNumber,
        manufacturer: product.manufacturer,
      };
    } catch (error) {
      console.error("VWR API error:", error);
      return null;
    }
  }

  /**
   * Hent SDS-informasjon for produkt
   */
  async getSDSInfo(catalogNumber: string): Promise<SupplierSDSInfo | null> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/products/${encodeURIComponent(catalogNumber)}/sds`;

    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const product = await this.searchProduct(catalogNumber);

      if (!product) return null;

      return {
        product,
        sdsAvailable: data.available || false,
        sdsUrl: data.url,
        sdsVersion: data.version,
        sdsLastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : undefined,
        downloadUrl: data.downloadUrl,
      };
    } catch (error) {
      console.error("VWR SDS API error:", error);
      return null;
    }
  }

  /**
   * Last ned SDS som PDF
   */
  async downloadSDS(catalogNumber: string): Promise<Buffer | null> {
    const sdsInfo = await this.getSDSInfo(catalogNumber);
    
    if (!sdsInfo || !sdsInfo.downloadUrl) {
      return null;
    }

    try {
      const response = await fetch(sdsInfo.downloadUrl, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("VWR SDS download error:", error);
      return null;
    }
  }

  private getBaseUrl(): string {
    const baseUrls: Record<string, string> = {
      eu: "https://api.vwr.com/v1",
      us: "https://api.us.vwr.com/v1",
      asia: "https://api.asia.vwr.com/v1",
    };
    return baseUrls[this.region] || baseUrls.eu;
  }
}

/**
 * Sigma-Aldrich (Merck) API
 * Dokumentasjon: https://developer.sigmaaldrich.com/
 */
export class SigmaAldrichSupplierAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchProduct(catalogNumber: string): Promise<SupplierProduct | null> {
    const url = `https://api.sigmaaldrich.com/v1/products/${encodeURIComponent(catalogNumber)}`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-API-Key": this.apiKey,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        catalogNumber: data.productNumber,
        productName: data.productName,
        casNumber: data.casNumber,
        manufacturer: "Sigma-Aldrich",
      };
    } catch (error) {
      console.error("Sigma-Aldrich API error:", error);
      return null;
    }
  }

  async getSDSInfo(catalogNumber: string): Promise<SupplierSDSInfo | null> {
    const url = `https://api.sigmaaldrich.com/v1/products/${encodeURIComponent(catalogNumber)}/sds`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-API-Key": this.apiKey,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const product = await this.searchProduct(catalogNumber);

      if (!product) return null;

      return {
        product,
        sdsAvailable: data.available || false,
        sdsUrl: data.pdfUrl,
        sdsVersion: data.version,
        sdsLastUpdated: data.revisionDate ? new Date(data.revisionDate) : undefined,
        downloadUrl: data.pdfUrl,
      };
    } catch (error) {
      console.error("Sigma-Aldrich SDS API error:", error);
      return null;
    }
  }

  async downloadSDS(catalogNumber: string): Promise<Buffer | null> {
    const sdsInfo = await this.getSDSInfo(catalogNumber);
    
    if (!sdsInfo || !sdsInfo.downloadUrl) {
      return null;
    }

    try {
      const response = await fetch(sdsInfo.downloadUrl);

      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Sigma-Aldrich SDS download error:", error);
      return null;
    }
  }
}

/**
 * Fisher Scientific (Thermo Fisher) API
 */
export class FisherScientificSupplierAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchProduct(catalogNumber: string): Promise<SupplierProduct | null> {
    const url = `https://api.fishersci.com/v1/products?catalogNumber=${encodeURIComponent(catalogNumber)}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.products || data.products.length === 0) {
        return null;
      }

      const product = data.products[0];
      return {
        catalogNumber: product.catalogNumber,
        productName: product.description,
        casNumber: product.casNumber,
        manufacturer: product.manufacturer,
      };
    } catch (error) {
      console.error("Fisher Scientific API error:", error);
      return null;
    }
  }

  async getSDSInfo(catalogNumber: string): Promise<SupplierSDSInfo | null> {
    const url = `https://api.fishersci.com/v1/products/${encodeURIComponent(catalogNumber)}/sds`;

    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const product = await this.searchProduct(catalogNumber);

      if (!product) return null;

      return {
        product,
        sdsAvailable: true,
        sdsUrl: data.sdsUrl,
        sdsVersion: data.revision,
        sdsLastUpdated: data.issueDate ? new Date(data.issueDate) : undefined,
        downloadUrl: data.pdfLink,
      };
    } catch (error) {
      console.error("Fisher Scientific SDS API error:", error);
      return null;
    }
  }

  async downloadSDS(catalogNumber: string): Promise<Buffer | null> {
    const sdsInfo = await this.getSDSInfo(catalogNumber);
    
    if (!sdsInfo || !sdsInfo.downloadUrl) {
      return null;
    }

    try {
      const response = await fetch(sdsInfo.downloadUrl, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Fisher Scientific SDS download error:", error);
      return null;
    }
  }
}

/**
 * Generisk leverandør-manager
 * Håndterer alle leverandør-APIer
 */
export class SupplierSDSManager {
  private suppliers: Map<string, any> = new Map();

  constructor(config: {
    vwrApiKey?: string;
    sigmaAldrichApiKey?: string;
    fisherScientificApiKey?: string;
  }) {
    if (config.vwrApiKey) {
      this.suppliers.set("vwr", new VWRSupplierAPI(config.vwrApiKey));
    }
    if (config.sigmaAldrichApiKey) {
      this.suppliers.set("sigma-aldrich", new SigmaAldrichSupplierAPI(config.sigmaAldrichApiKey));
    }
    if (config.fisherScientificApiKey) {
      this.suppliers.set("fisher", new FisherScientificSupplierAPI(config.fisherScientificApiKey));
    }
  }

  /**
   * Sjekk alle leverandører for oppdatert SDS
   */
  async checkForUpdates(
    supplier: string,
    catalogNumber: string,
    currentSDSDate?: Date
  ): Promise<{
    hasUpdate: boolean;
    sdsInfo?: SupplierSDSInfo;
  }> {
    const supplierKey = this.normalizeSupplierName(supplier);
    const api = this.suppliers.get(supplierKey);

    if (!api) {
      return { hasUpdate: false };
    }

    const sdsInfo = await api.getSDSInfo(catalogNumber);

    if (!sdsInfo || !sdsInfo.sdsAvailable) {
      return { hasUpdate: false };
    }

    // Sjekk om det er nyere enn dagens versjon
    if (currentSDSDate && sdsInfo.sdsLastUpdated) {
      const hasUpdate = sdsInfo.sdsLastUpdated > currentSDSDate;
      return { hasUpdate, sdsInfo };
    }

    return { hasUpdate: true, sdsInfo };
  }

  /**
   * Last ned oppdatert SDS fra leverandør
   */
  async downloadUpdatedSDS(
    supplier: string,
    catalogNumber: string
  ): Promise<Buffer | null> {
    const supplierKey = this.normalizeSupplierName(supplier);
    const api = this.suppliers.get(supplierKey);

    if (!api) {
      return null;
    }

    return await api.downloadSDS(catalogNumber);
  }

  private normalizeSupplierName(supplier: string): string {
    const normalized = supplier.toLowerCase().replace(/\s+/g, "-");
    
    if (normalized.includes("vwr") || normalized.includes("avantor")) {
      return "vwr";
    }
    if (normalized.includes("sigma") || normalized.includes("aldrich") || normalized.includes("merck")) {
      return "sigma-aldrich";
    }
    if (normalized.includes("fisher") || normalized.includes("thermo")) {
      return "fisher";
    }

    return normalized;
  }
}
