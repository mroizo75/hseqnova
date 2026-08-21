/**
 * ISOCYANAT-SKANNING
 * 
 * Skanner eksisterende stoffkartotek for å identifisere kjemikalier
 * som inneholder diisocyanater (MDI, TDI, HDI, IPDI, etc.)
 * 
 * VIKTIG: EU-forordning 2020/1149 krever obligatorisk kurs for
 * arbeid med produkter som inneholder >0.1% diisocyanater
 */

"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { detectIsocyanates } from "@/lib/sds-parser";

async function getSessionContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Ikke autentisert");
  }

  const userTenant = await prisma.userTenant.findFirst({
    where: {
      userId: session.user.id,
      tenantId: session.user.tenantId!,
    },
    include: {
      tenant: true,
    },
  });

  if (!userTenant) {
    throw new Error("Ingen aktiv tenant");
  }

  return {
    userId: session.user.id,
    tenantId: userTenant.tenantId,
    role: userTenant.role,
    tenant: userTenant.tenant,
  };
}

export interface IsocyanateScanResult {
  success: boolean;
  totalScanned: number;
  foundIsocyanates: number;
  updated: number;
  chemicals: Array<{
    id: string;
    productName: string;
    supplier?: string;
    casNumber?: string;
    containsIsocyanates: boolean;
    isocyanateDetails?: string;
    wasUpdated: boolean;
  }>;
}

/**
 * Skann alle kjemikalier i bedriftens stoffkartotek
 */
export async function scanStoffkartotekForIsocyanates(): Promise<IsocyanateScanResult> {
  try {
    const { tenantId, role } = await getSessionContext();

    // Kun HMS/ADMIN kan kjøre skanning
    if (role !== "ADMIN" && role !== "HMS") {
      throw new Error("Kun HMS-ansvarlige og administratorer kan kjøre isocyanat-skanning");
    }

    console.log(`🔍 Starter isocyanat-skanning for tenant ${tenantId}...`);

    // Hent alle aktive kjemikalier
    const chemicals = await prisma.chemical.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        productName: true,
        supplier: true,
        casNumber: true,
        hazardStatements: true,
        containsIsocyanates: true,
        aiExtractedData: true,
      },
    });

    console.log(`📊 Fant ${chemicals.length} kjemikalier å skanne`);

    const results: IsocyanateScanResult["chemicals"] = [];
    let foundCount = 0;
    let updatedCount = 0;

    for (const chemical of chemicals) {
      // Bygg opp tekst for deteksjon
      let searchText = chemical.productName;
      if (chemical.supplier) searchText += ` ${chemical.supplier}`;
      if (chemical.hazardStatements) searchText += ` ${chemical.hazardStatements}`;
      if (chemical.aiExtractedData) searchText += ` ${chemical.aiExtractedData}`;

      // Sjekk for isocyanater
      const casNumbers = chemical.casNumber ? [chemical.casNumber] : [];
      const detection = detectIsocyanates(
        chemical.productName,
        casNumbers,
        searchText
      );

      // Hvis funnet og ikke allerede merket
      const needsUpdate = detection.containsIsocyanates && !chemical.containsIsocyanates;

      if (detection.containsIsocyanates) {
        foundCount++;
      }

      if (needsUpdate) {
        // Oppdater database
        await prisma.chemical.update({
          where: { id: chemical.id },
          data: {
            containsIsocyanates: true,
          },
        });

        updatedCount++;
        console.log(`✅ Oppdatert: ${chemical.productName} - ${detection.details}`);
      }

      results.push({
        id: chemical.id,
        productName: chemical.productName,
        supplier: chemical.supplier || undefined,
        casNumber: chemical.casNumber || undefined,
        containsIsocyanates: detection.containsIsocyanates,
        isocyanateDetails: detection.details,
        wasUpdated: needsUpdate,
      });
    }

    console.log(`✅ Isocyanat-skanning fullført:`);
    console.log(`   - Skannet: ${chemicals.length}`);
    console.log(`   - Funnet: ${foundCount}`);
    console.log(`   - Oppdatert: ${updatedCount}`);

    return {
      success: true,
      totalScanned: chemicals.length,
      foundIsocyanates: foundCount,
      updated: updatedCount,
      chemicals: results.filter(r => r.containsIsocyanates), // Returner kun de med isocyanater
    };
  } catch (error) {
    console.error("❌ Isocyanat-skanning feilet:", error);
    throw error;
  }
}

/**
 * Skann et enkelt kjemikalie
 */
export async function scanSingleChemicalForIsocyanates(
  chemicalId: string
): Promise<{
  success: boolean;
  containsIsocyanates: boolean;
  details?: string;
  wasUpdated: boolean;
}> {
  try {
    const { tenantId } = await getSessionContext();

    const chemical = await prisma.chemical.findUnique({
      where: {
        id: chemicalId,
        tenantId,
      },
      select: {
        id: true,
        productName: true,
        supplier: true,
        casNumber: true,
        hazardStatements: true,
        containsIsocyanates: true,
        aiExtractedData: true,
      },
    });

    if (!chemical) {
      throw new Error("Kjemikalie ikke funnet");
    }

    // Bygg søketekst
    let searchText = chemical.productName;
    if (chemical.supplier) searchText += ` ${chemical.supplier}`;
    if (chemical.hazardStatements) searchText += ` ${chemical.hazardStatements}`;
    if (chemical.aiExtractedData) searchText += ` ${chemical.aiExtractedData}`;

    const casNumbers = chemical.casNumber ? [chemical.casNumber] : [];
    const detection = detectIsocyanates(
      chemical.productName,
      casNumbers,
      searchText
    );

    const needsUpdate = detection.containsIsocyanates && !chemical.containsIsocyanates;

    if (needsUpdate) {
      await prisma.chemical.update({
        where: { id: chemical.id },
        data: {
          containsIsocyanates: true,
        },
      });
    }

    return {
      success: true,
      containsIsocyanates: detection.containsIsocyanates,
      details: detection.details,
      wasUpdated: needsUpdate,
    };
  } catch (error) {
    console.error("❌ Enkelt-skanning feilet:", error);
    throw error;
  }
}

/**
 * Hent statistikk over isocyanater i stoffkartoteket
 */
export async function getIsocyanateStats() {
  try {
    const { tenantId } = await getSessionContext();

    const total = await prisma.chemical.count({
      where: { tenantId, status: "ACTIVE" },
    });

    const withIsocyanates = await prisma.chemical.count({
      where: { 
        tenantId, 
        status: "ACTIVE",
        containsIsocyanates: true,
      },
    });

    const chemicalsWithIsocyanates = await prisma.chemical.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        containsIsocyanates: true,
      },
      select: {
        id: true,
        productName: true,
        supplier: true,
        casNumber: true,
        quantity: true,
        location: true,
      },
      orderBy: {
        productName: "asc",
      },
    });

    return {
      total,
      withIsocyanates,
      percentage: total > 0 ? Math.round((withIsocyanates / total) * 100) : 0,
      chemicals: chemicalsWithIsocyanates,
    };
  } catch (error) {
    console.error("❌ Henting av isocyanat-statistikk feilet:", error);
    throw error;
  }
}
