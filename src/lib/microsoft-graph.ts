import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

/**
 * Microsoft Graph API client for å hente brukere fra Azure AD
 * 
 * Krever:
 * - @microsoft/microsoft-graph-client
 * - Miljøvariabler: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET
 */

interface AzureAdUser {
  id: string;
  displayName: string | null;
  mail: string | null;
  userPrincipalName: string;
  jobTitle: string | null;
  department: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
  businessPhones: string[];
}

/**
 * Opprett Graph API client med app-only autentisering
 */
async function getGraphClient(tenantId: string): Promise<Client | null> {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Azure AD miljøvariabler ikke satt");
    return null;
  }

  try {
    // Hent access token via client credentials flow
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error("Failed to get access token:", error);
      return null;
    }

    const { access_token } = await tokenResponse.json();

    // Opprett Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, access_token);
      },
    });

    return client;
  } catch (error) {
    console.error("Error creating Graph client:", error);
    return null;
  }
}

/**
 * Hent alle brukere fra en Azure AD tenant
 */
export async function fetchAzureAdUsers(
  tenantId: string,
  domain?: string
): Promise<{ success: boolean; users?: AzureAdUser[]; error?: string }> {
  try {
    const client = await getGraphClient(tenantId);
    if (!client) {
      return {
        success: false,
        error: "Kunne ikke opprette forbindelse til Microsoft Graph API",
      };
    }

    // Hent brukere (kun medlemmer, ikke gjester)
    let query = client
      .api("/users")
      .select("id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones")
      .filter("accountEnabled eq true and userType eq 'Member'")
      .top(999); // Max 999 per request

    // Hvis domene er spesifisert, filtrer på det
    if (domain) {
      query = query.filter(
        `accountEnabled eq true and userType eq 'Member' and endsWith(mail,'@${domain}')`
      );
    }

    const response = await query.get();
    const users: AzureAdUser[] = response.value || [];

    return {
      success: true,
      users,
    };
  } catch (error: any) {
    console.error("Error fetching Azure AD users:", error);
    return {
      success: false,
      error: error.message || "Kunne ikke hente brukere fra Azure AD",
    };
  }
}

/**
 * Hent en enkelt bruker fra Azure AD basert på e-post
 */
export async function fetchAzureAdUserByEmail(
  tenantId: string,
  email: string
): Promise<{ success: boolean; user?: AzureAdUser; error?: string }> {
  try {
    const client = await getGraphClient(tenantId);
    if (!client) {
      return {
        success: false,
        error: "Kunne ikke opprette forbindelse til Microsoft Graph API",
      };
    }

    // Søk etter bruker med e-post
    const response = await client
      .api("/users")
      .filter(`mail eq '${email}' or userPrincipalName eq '${email}'`)
      .select("id,displayName,mail,userPrincipalName,jobTitle,department")
      .get();

    if (!response.value || response.value.length === 0) {
      return {
        success: false,
        error: "Bruker ikke funnet i Azure AD",
      };
    }

    return {
      success: true,
      user: response.value[0],
    };
  } catch (error: any) {
    console.error("Error fetching Azure AD user:", error);
    return {
      success: false,
      error: error.message || "Kunne ikke hente bruker fra Azure AD",
    };
  }
}

/**
 * Verifiser om en Azure AD tenant ID er gyldig
 */
export async function verifyAzureAdTenant(
  tenantId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = await getGraphClient(tenantId);
    if (!client) {
      return {
        valid: false,
        error: "Kunne ikke koble til Azure AD. Sjekk Tenant ID og credentials.",
      };
    }

    // Prøv å hente organisasjonsinformasjon
    await client.api("/organization").get();

    return { valid: true };
  } catch (error: any) {
    console.error("Error verifying Azure AD tenant:", error);
    return {
      valid: false,
      error: "Ugyldig Azure AD Tenant ID eller manglende tilganger",
    };
  }
}

