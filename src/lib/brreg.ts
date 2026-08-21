/**
 * Companies House lookup — replacement for the Norwegian Brreg client.
 * Keep the old export names so existing registration UI still compiles.
 */

import { lookupCompany } from "@/lib/companies-house";

export interface BrregEnhet {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  forretningsadresse?: {
    land: string;
    landkode: string;
    postnummer: string;
    poststed: string;
    adresse: string[];
  };
}

export class BrregClient {
  async getEnhet(companyNumber: string): Promise<BrregEnhet | null> {
    const company = await lookupCompany(companyNumber);
    if (!company) return null;
    return {
      organisasjonsnummer: company.companyNumber,
      navn: company.name,
      organisasjonsform: {
        kode: "UK",
        beskrivelse: company.status ?? "Active",
      },
      forretningsadresse: {
        land: "United Kingdom",
        landkode: "GB",
        postnummer: company.postalCode ?? "",
        poststed: company.city ?? "",
        adresse: company.address ? [company.address] : [],
      },
    };
  }

  async searchEnheter(): Promise<BrregEnhet[]> {
    return [];
  }
}

export const brregClient = new BrregClient();
