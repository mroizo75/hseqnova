"use server";

import { lookupCompany } from "@/lib/companies-house";

export async function validateOrgNumber(companyNumber: string): Promise<{
  success: boolean;
  data?: {
    organisasjonsnummer: string;
    navn: string;
    organisasjonsform: { kode: string; beskrivelse: string };
    forretningsadresse?: {
      land: string;
      landkode: string;
      postnummer: string;
      poststed: string;
      adresse: string[];
    };
  };
  error?: string;
}> {
  try {
    const company = await lookupCompany(companyNumber);
    if (!company) {
      return {
        success: false,
        error: "Company number not found at Companies House",
      };
    }
    return {
      success: true,
      data: {
        organisasjonsnummer: company.companyNumber,
        navn: company.name,
        organisasjonsform: { kode: "UK", beskrivelse: company.status ?? "Active" },
        forretningsadresse: {
          land: "United Kingdom",
          landkode: "GB",
          postnummer: company.postalCode ?? "",
          poststed: company.city ?? "",
          adresse: company.address ? [company.address] : [],
        },
      },
    };
  } catch {
    return {
      success: false,
      error: "Could not validate company number. Try again later.",
    };
  }
}

export async function searchCompanies(): Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}> {
  return {
    success: false,
    error: "Company search is not available. Enter the Companies House number.",
  };
}
