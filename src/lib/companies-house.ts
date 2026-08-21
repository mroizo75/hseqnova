export interface CompanyHouseCompany {
  company_number: string;
  company_name: string;
  company_status?: string;
  registered_office_address?: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface CompaniesHouseLookup {
  companyNumber: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  status?: string;
}

function getAuthHeader(): string {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) {
    throw { code: "COMPANIES_HOUSE_NOT_CONFIGURED", message: "COMPANIES_HOUSE_API_KEY is not set" };
  }
  return Buffer.from(`${key}:`).toString("base64");
}

export async function lookupCompany(companyNumber: string): Promise<CompaniesHouseLookup | null> {
  const cleaned = companyNumber.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6,8}$/.test(cleaned)) {
    return null;
  }

  const response = await fetch(`https://api.company-information.service.gov.uk/company/${cleaned}`, {
    headers: {
      Authorization: `Basic ${getAuthHeader()}`,
    },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw {
      code: "COMPANIES_HOUSE_ERROR",
      message: `Companies House lookup failed (${response.status})`,
    };
  }

  const data = (await response.json()) as CompanyHouseCompany;
  const office = data.registered_office_address;
  return {
    companyNumber: data.company_number,
    name: data.company_name,
    address: [office?.address_line_1, office?.address_line_2].filter(Boolean).join(", ") || undefined,
    city: office?.locality,
    postalCode: office?.postal_code,
    status: data.company_status,
  };
}
