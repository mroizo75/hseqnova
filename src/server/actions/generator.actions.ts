"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { DocumentKind, DocStatus } from "@prisma/client";
import { completeGeneratorSchema, getEmployeeCount } from "@/features/document-generator/schemas/generator.schema";
import type { CompleteGeneratorData } from "@/features/document-generator/schemas/generator.schema";
import { INDUSTRY_RISKS } from "@/features/document-generator/data/industry-risks";
import { INDUSTRY_TRAINING } from "@/features/document-generator/data/industry-training";

/**
 * Server Actions for HMS Document Generator
 * 
 * Flow:
 * 1. createGeneratedDocument() - Lagre form data til database
 * 2. generateDocuments() - Generer PDF/Excel filer
 * 3. sendDocuments() - Send email med download links
 */

// ═══════════════════════════════════════════════════════════════
// 1. CREATE GENERATED DOCUMENT
// ═══════════════════════════════════════════════════════════════

export interface CreateGeneratedDocumentOptions {
  /** Gratis HMS-løype: lagrer kun vannmerkede PDF-er (ikke DOCX) slik at systemet ikke gis bort utskriftsklart */
  isFreeTrialPackage?: boolean;
  /** Når satt: pakken tilhører denne tenanten og importeres som Document etter generering */
  tenantId?: string;
}

export async function createGeneratedDocument(
  data: z.infer<typeof completeGeneratorSchema>,
  options: CreateGeneratedDocumentOptions = {}
) {
  try {
    const validated = completeGeneratorSchema.parse(data);
    const { isFreeTrialPackage = false, tenantId: optionTenantId } = options;

    const { step1, step2, step3, step4, step5 } = validated;

    // Beregn antall ansatte (midtpunkt av range)
    const employees = getEmployeeCount(step1.employeeRange);

    // Opprett document record
    const doc = await prisma.generatedDocument.create({
      data: {
        // Step 1: Bedriftsinfo
        email: step1.email,
        companyName: step1.companyName,
        orgNumber: step1.orgNumber,
        address: step1.address,
        postalCode: step1.postalCode,
        city: step1.city,
        ceoName: step1.ceoName,
        phone: step1.phone,
        employees,

        // Step 2: Bransje
        industry: step2.industry,
        companyDescription: step2.companyDescription,

        // Step 3: HMS-organisering
        hmsResponsible: step3.hmsIsCeo ? step1.ceoName : step3.hmsResponsible,
        hmsEmail: step3.hmsEmail,
        hmsPhone: step3.hmsPhone,
        safetyRep: step3.hasSafetyRep ? step3.safetyRep : null,
        safetyRepEmail: step3.hasSafetyRep ? step3.safetyRepEmail : null,
        safetyRepPhone: step3.hasSafetyRep ? step3.safetyRepPhone : null,
        hasBHT: step3.hasBHT,
        bhtProvider: step3.hasBHT ? step3.bhtProvider : null,
        bhtContact: step3.hasBHT ? step3.bhtContact : null,
        departments: step3.departments || [],

        // Step 4: Opplæring
        completedTraining: step4.completedTraining || [],

        // Step 5: Marketing & Newsletter
        marketingConsent: step5.marketingConsent,
        newsletterSubscribed: step5.marketingConsent, // Auto-subscribe if marketing consent given

        // Status
        status: "PENDING",
        isFreeTrialPackage,
        tenantId: optionTenantId ?? undefined,
      },
    });

    return {
      success: true,
      data: { id: doc.id },
    };
  } catch (error: any) {
    console.error("Create generated document error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Ugyldig data: " + error.issues.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message || "Kunne ikke opprette dokument",
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. GENERATE DOCUMENTS (PDF/Excel)
// ═══════════════════════════════════════════════════════════════

export async function generateDocuments(documentId: string) {
  try {
    // Hent document data
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return { success: false, error: "Dokument ikke funnet" };
    }

    // Oppdater status til GENERATING
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: { status: "GENERATING" },
    });

    // Import dependencies
    const { 
      generateDocumentRegister,
      generateHMSHandbook,
      generateRiskAssessment,
      generateTrainingPlan,
      generateSafetyRound,
      generateAMUProtocol,
    } = await import("@/lib/docx-generator");
    const { getStorage, generateFileKey } = await import("@/lib/storage");
    const JSZip = (await import("jszip")).default;

    const storage = getStorage();

    // Generate ALL DOCX documents (editable Word files)
    console.log("Generating HMS documents...");
    const registerDocx = await generateDocumentRegister(doc);
    const handbookDocx = await generateHMSHandbook(doc);
    const riskDocx = await generateRiskAssessment(doc);
    const trainingDocx = await generateTrainingPlan(doc);
    const safetyRoundDocx = await generateSafetyRound(doc);
    const amuDocx = await generateAMUProtocol(doc);

    const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    let registerKey: string;
    let handbookKey: string;
    let riskKey: string;
    let trainingKey: string;
    let vernerundeKey: string;
    let amuKey: string;
    let zipKey: string;
    let zipBuffer: Buffer;

    if (doc.isFreeTrialPackage) {
      // Gratis-prøve: konverter til PDF, legg på vannmerke, lagre kun vannmerkede PDF-er (ikke DOCX)
      const {
        convertDocumentToPDF,
        applyWatermarkToPdf,
        generateWatermarkPdfBuffer,
      } = await import("@/lib/adobe-pdf");

      const watermarkPdf = await generateWatermarkPdfBuffer();

      const toWatermarkedPdf = async (docxBuffer: Buffer): Promise<Buffer> => {
        const pdfBuffer = await convertDocumentToPDF(docxBuffer, DOCX_MIME);
        return applyWatermarkToPdf(pdfBuffer, watermarkPdf, { opacity: 50 });
      };

      console.log("Converting to watermarked PDFs for free trial package...");
      const [registerPdf, handbookPdf, riskPdf, trainingPdf, vernerundePdf, amuPdf] =
        await Promise.all([
          toWatermarkedPdf(registerDocx),
          toWatermarkedPdf(handbookDocx),
          toWatermarkedPdf(riskDocx),
          toWatermarkedPdf(trainingDocx),
          toWatermarkedPdf(safetyRoundDocx),
          toWatermarkedPdf(amuDocx),
        ]);

      const zip = new JSZip();
      zip.file("HMS-00-Dokumentregister.pdf", registerPdf);
      zip.file("HMS-01-HMS-Håndbok.pdf", handbookPdf);
      zip.file("HMS-02-Risikovurdering.pdf", riskPdf);
      zip.file("HMS-03-Opplæringsplan.pdf", trainingPdf);
      zip.file("HMS-04-Vernerunde-sjekkliste.pdf", vernerundePdf);
      zip.file("HMS-05-AMU-møteprotokoll.pdf", amuPdf);
      zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      registerKey = generateFileKey(doc.id, "generated", "HMS-00-Dokumentregister.pdf");
      handbookKey = generateFileKey(doc.id, "generated", "HMS-01-HMS-Håndbok.pdf");
      riskKey = generateFileKey(doc.id, "generated", "HMS-02-Risikovurdering.pdf");
      trainingKey = generateFileKey(doc.id, "generated", "HMS-03-Opplæringsplan.pdf");
      vernerundeKey = generateFileKey(doc.id, "generated", "HMS-04-Vernerunde-sjekkliste.pdf");
      amuKey = generateFileKey(doc.id, "generated", "HMS-05-AMU-møteprotokoll.pdf");
      zipKey = generateFileKey(doc.id, "generated", "HMS-Komplett-Pakke.zip");

      console.log("Uploading watermarked PDFs to storage...");
      await Promise.all([
        storage.upload(registerKey, registerPdf),
        storage.upload(handbookKey, handbookPdf),
        storage.upload(riskKey, riskPdf),
        storage.upload(trainingKey, trainingPdf),
        storage.upload(vernerundeKey, vernerundePdf),
        storage.upload(amuKey, amuPdf),
        storage.upload(zipKey, zipBuffer),
      ]);
    } else {
      // Vanlig pakke: DOCX og ZIP med DOCX
      const zip = new JSZip();
      zip.file("HMS-00-Dokumentregister.docx", registerDocx);
      zip.file("HMS-01-HMS-Håndbok.docx", handbookDocx);
      zip.file("HMS-02-Risikovurdering.docx", riskDocx);
      zip.file("HMS-03-Opplæringsplan.docx", trainingDocx);
      zip.file("HMS-04-Vernerunde-sjekkliste.docx", safetyRoundDocx);
      zip.file("HMS-05-AMU-møteprotokoll.docx", amuDocx);
      zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      registerKey = generateFileKey(doc.id, "generated", "HMS-00-Dokumentregister.docx");
      handbookKey = generateFileKey(doc.id, "generated", "HMS-01-HMS-Håndbok.docx");
      riskKey = generateFileKey(doc.id, "generated", "HMS-02-Risikovurdering.docx");
      trainingKey = generateFileKey(doc.id, "generated", "HMS-03-Opplæringsplan.docx");
      vernerundeKey = generateFileKey(doc.id, "generated", "HMS-04-Vernerunde-sjekkliste.docx");
      amuKey = generateFileKey(doc.id, "generated", "HMS-05-AMU-møteprotokoll.docx");
      zipKey = generateFileKey(doc.id, "generated", "HMS-Komplett-Pakke.zip");

      console.log("Uploading documents to storage...");
      await Promise.all([
        storage.upload(registerKey, registerDocx),
        storage.upload(handbookKey, handbookDocx),
        storage.upload(riskKey, riskDocx),
        storage.upload(trainingKey, trainingDocx),
        storage.upload(vernerundeKey, safetyRoundDocx),
        storage.upload(amuKey, amuDocx),
        storage.upload(zipKey, zipBuffer),
      ]);
    }
    
    console.log("All documents uploaded successfully!");

    // Oppdater document med file keys
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        generatedAt: new Date(),
        registerKey,
        handbookKey,
        riskKey,
        trainingKey,
        vernerundeKey,
        amuKey,
        zipKey,
      },
    });

    return {
      success: true,
      data: {
        registerKey,
        handbookKey,
        riskKey,
        trainingKey,
        vernerundeKey,
        amuKey,
        zipKey,
      },
    };
  } catch (error: any) {
    console.error("Generate documents error:", error);

    // Oppdater status til FAILED
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });

    return {
      success: false,
      error: error.message || "Kunne ikke generere dokumenter",
    };
  }
}

/** Map antall ansatte tilbake til employeeRange for generator-skjema */
function getEmployeeRangeFromCount(employees: number): "1-5" | "6-20" | "21-50" | "51+" {
  if (employees <= 5) return "1-5";
  if (employees <= 20) return "6-20";
  if (employees <= 50) return "21-50";
  return "51+";
}

/**
 * Bygger CompleteGeneratorData fra en eksisterende GeneratedDocument.
 * Brukes ved oppgradering fra gratis-prøve til betalende (generere uten vannmerke).
 */
function buildGeneratorDataFromDocument(
  doc: {
    companyName: string;
    email: string;
    orgNumber: string | null;
    industry: string;
    employees: number;
    ceoName: string;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    phone: string | null;
    hmsResponsible: string | null;
    hmsEmail: string | null;
    hmsPhone: string | null;
    safetyRep: string | null;
    safetyRepEmail: string | null;
    safetyRepPhone: string | null;
    hasBHT: boolean;
    bhtProvider: string | null;
    bhtContact: string | null;
    departments: unknown;
    completedTraining: unknown;
    companyDescription: string | null;
  }
): CompleteGeneratorData {
  const departments = Array.isArray(doc.departments) ? doc.departments : [];
  const completedTraining = Array.isArray(doc.completedTraining) ? doc.completedTraining : [];
  const employeeRange = getEmployeeRangeFromCount(doc.employees);
  const hmsResponsible = doc.hmsResponsible || doc.ceoName;
  return {
    step1: {
      companyName: doc.companyName,
      email: doc.email,
      ceoName: doc.ceoName,
      employeeRange,
      orgNumber: doc.orgNumber ?? "",
      address: doc.address ?? undefined,
      postalCode: doc.postalCode ?? undefined,
      city: doc.city ?? undefined,
      phone: doc.phone ?? undefined,
    },
    step2: {
      industry: doc.industry as "OTHER" | "CONSTRUCTION" | "HEALTHCARE" | "TRANSPORT" | "MANUFACTURING" | "RETAIL" | "HOSPITALITY" | "EDUCATION" | "TECHNOLOGY" | "AGRICULTURE",
      companyDescription: doc.companyDescription ?? undefined,
    },
    step3: {
      hmsIsCeo: hmsResponsible === doc.ceoName,
      hmsResponsible,
      hmsEmail: doc.hmsEmail ?? "",
      hmsPhone: doc.hmsPhone ?? "",
      hasSafetyRep: !!doc.safetyRep,
      safetyRep: doc.safetyRep ?? undefined,
      safetyRepEmail: doc.safetyRepEmail ?? "",
      safetyRepPhone: doc.safetyRepPhone ?? "",
      hasBHT: doc.hasBHT,
      bhtProvider: doc.bhtProvider ?? undefined,
      bhtContact: doc.bhtContact ?? undefined,
      departments: departments as { name: string; leader: string }[],
    },
    step4: {
      hasHMSIntroduction: true,
      hasAnnualTraining: completedTraining.length > 0,
      hasNoSystematicTraining: false,
      completedTraining,
      firstAidCount: "0",
      lastFirstAidDate: undefined,
    },
    step5: {
      confirmEmail: doc.email,
      acceptPrivacy: true,
      marketingConsent: false,
    },
  };
}

/** HMS-dokumenter som importeres til tenant (gratis-prøve): slug, tittel, kind, fileKey-felt på GeneratedDocument */
const FREE_TRIAL_DOCUMENT_SPEC = [
  { slug: "hms-00-dokumentregister", title: "HMS-00 Register over HMS-dokumenter", kind: "PROCEDURE" as const, key: "registerKey" as const },
  { slug: "hms-01-hms-handbok", title: "HMS-01 HMS-Håndbok", kind: "PROCEDURE" as const, key: "handbookKey" as const },
  { slug: "hms-02-risikovurdering", title: "HMS-02 Risikovurdering", kind: "PLAN" as const, key: "riskKey" as const },
  { slug: "hms-03-opplaeringsplan", title: "HMS-03 Opplæringsplan", kind: "PLAN" as const, key: "trainingKey" as const },
  { slug: "hms-04-vernerunde-sjekkliste", title: "HMS-04 Vernerunde / Sjekkliste", kind: "CHECKLIST" as const, key: "vernerundeKey" as const },
  { slug: "hms-05-amu-moteprotokoll", title: "HMS-05 AMU møteprotokoll", kind: "PROCEDURE" as const, key: "amuKey" as const },
];

/**
 * Importerer vannmerkede PDF-er fra en ferdig generert gratis-prøvepakke inn i tenant som Document.
 * Brukere kan da se dokumentene (med vannmerke) under Dokumenter i dashboard.
 */
export async function importGeneratedDocumentsToTenant(
  tenantId: string,
  generatedDocumentId: string,
  uploadedByUserId: string
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: generatedDocumentId },
    });

    if (!doc) {
      return { success: false, error: "Generert pakke ikke funnet" };
    }
    if (doc.tenantId !== tenantId) {
      return { success: false, error: "Pakken tilhører ikke denne bedriften" };
    }
    if (!doc.isFreeTrialPackage || doc.status !== "COMPLETED") {
      return { success: false, error: "Pakken er ikke en ferdig gratis-prøvepakke" };
    }

    const version = "v1.0";
    const now = new Date();

    for (const spec of FREE_TRIAL_DOCUMENT_SPEC) {
      const fileKey = doc[spec.key];
      if (!fileKey) continue;

      await prisma.document.create({
        data: {
          tenantId,
          kind: spec.kind as DocumentKind,
          title: spec.title,
          slug: spec.slug,
          version,
          status: DocStatus.APPROVED,
          fileKey,
          mime: "application/pdf",
          reviewIntervalMonths: 12,
          effectiveFrom: now,
          nextReviewDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
          versions: {
            create: {
              tenantId,
              version,
              fileKey,
              mime: "application/pdf",
              uploadedBy: uploadedByUserId,
              changeComment: "Levert med gratis HMS-prøvepakke (vannmerket PDF)",
              approvedBy: uploadedByUserId,
              approvedAt: now,
            },
          },
        },
      });
    }

    return { success: true, count: FREE_TRIAL_DOCUMENT_SPEC.length };
  } catch (error: any) {
    console.error("Import generated documents to tenant error:", error);
    return {
      success: false,
      error: error.message || "Kunne ikke importere dokumenter til bedriften",
    };
  }
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Oppgraderer gratis-prøve-tenant til betalende: genererer dokumenter uten vannmerke,
 * legger dem inn som ny versjon (v2.0) på de 6 HMS-dokumentene, og setter tenant til STANDARD + subscription ACTIVE.
 * Kalles når kunden har betalt (f.eks. fra Fiken webhook). 300 kr/mnd, 12 mnd binding er default.
 */
export async function upgradeFreeTrialTenantDocumentsToPaid(
  tenantId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const freeTrialPackage = await prisma.generatedDocument.findFirst({
      where: { tenantId, isFreeTrialPackage: true, status: "COMPLETED" },
    });

    if (!freeTrialPackage) {
      return { success: false, error: "Ingen gratis-prøvepakke funnet for denne bedriften" };
    }

    const adminUser = await prisma.userTenant.findFirst({
      where: { tenantId, role: "ADMIN" },
      select: { userId: true },
    });
    const uploadedBy = adminUser?.userId ?? "system";

    const generatorData = buildGeneratorDataFromDocument(freeTrialPackage);
    const createResult = await createGeneratedDocument(generatorData, {
      isFreeTrialPackage: false,
    });
    if (!createResult.success || !createResult.data?.id) {
      return {
        success: false,
        error: createResult.error ?? "Kunne ikke opprette oppgraderingspakke",
      };
    }

    const upgradeDocId = createResult.data.id;
    const genResult = await generateDocuments(upgradeDocId);
    if (!genResult.success) {
      return {
        success: false,
        error: genResult.error ?? "Kunne ikke generere dokumenter uten vannmerke",
      };
    }

    const upgradedPackage = await prisma.generatedDocument.findUnique({
      where: { id: upgradeDocId },
    });
    if (!upgradedPackage?.registerKey) {
      return { success: false, error: "Generert pakke mangler filer" };
    }

    const newVersion = "v2.0";
    const now = new Date();

    for (const spec of FREE_TRIAL_DOCUMENT_SPEC) {
      const fileKey = upgradedPackage[spec.key];
      if (!fileKey) continue;

      const document = await prisma.document.findUnique({
        where: { tenantId_slug: { tenantId, slug: spec.slug } },
        include: { versions: true },
      });
      if (!document) continue;

      await prisma.documentVersion.updateMany({
        where: { documentId: document.id, supersededAt: null },
        data: { supersededAt: now },
      });

      await prisma.documentVersion.create({
        data: {
          tenantId,
          documentId: document.id,
          version: newVersion,
          fileKey,
          mime: DOCX_MIME,
          uploadedBy,
          changeComment: "Oppgradert til betalende kunde – uten vannmerke, kan lastes ned",
          approvedBy: uploadedBy,
          approvedAt: now,
        },
      });

      await prisma.document.update({
        where: { id: document.id },
        data: {
          version: newVersion,
          fileKey,
          mime: DOCX_MIME,
          status: DocStatus.APPROVED,
          approvedBy: uploadedBy,
          approvedAt: now,
        },
      });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: "ACTIVE", registrationType: "STANDARD" },
    });

    await prisma.subscription.updateMany({
      where: { tenantId },
      data: { status: "ACTIVE" },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Upgrade free trial tenant documents error:", error);
    return {
      success: false,
      error: error.message ?? "Kunne ikke oppgradere dokumenter",
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. SEND DOCUMENTS VIA EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendDocuments(documentId: string) {
  try {
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return { success: false, error: "Dokument ikke funnet" };
    }

    if (doc.status !== "COMPLETED") {
      return { success: false, error: "Dokumenter er ikke generert ennå" };
    }

    // Utlevering av dokumenter på e-post er avviklet – bruk HMS Nova for tilgang
    return {
      success: false,
      error: "Utsending av dokumenter på e-post er ikke tilgjengelig. Bruk HMS Nova for å få tilgang til HMS-systemet.",
    };
  } catch (error: any) {
    console.error("Send documents error:", error);
    return {
      success: false,
      error: error.message || "Kunne ikke sende dokumenter",
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. GET GENERATED DOCUMENT
// ═══════════════════════════════════════════════════════════════

export async function getGeneratedDocument(documentId: string) {
  try {
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return { success: false, error: "Dokument ikke funnet" };
    }

    return {
      success: true,
      data: doc,
    };
  } catch (error: any) {
    console.error("Get generated document error:", error);
    return {
      success: false,
      error: error.message || "Kunne ikke hente dokument",
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. TRACK DOWNLOAD
// ═══════════════════════════════════════════════════════════════

export async function trackDownload(documentId: string) {
  try {
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Track download error:", error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. MARK AS CONVERTED TO TRIAL
// ═══════════════════════════════════════════════════════════════

export async function markAsConvertedToTrial(documentId: string) {
  try {
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        convertedToTrial: true,
        convertedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Mark as converted error:", error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. GET DOWNLOAD LINKS
// ═══════════════════════════════════════════════════════════════

export async function getDownloadLinks(documentId: string) {
  try {
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return { success: false, error: "Dokument ikke funnet" };
    }

    if (doc.status !== "COMPLETED" || !doc.zipKey) {
      return { success: false, error: "Dokumenter er ikke generert ennå" };
    }

    // Nedlasting av ZIP/dokumenter er avviklet – bruk HMS Nova for tilgang
    return {
      success: false,
      error: "Nedlasting av dokumentpakke er ikke tilgjengelig. Bruk HMS Nova for å få tilgang til HMS-systemet.",
    };
  } catch (error: any) {
    console.error("Get download links error:", error);
    return {
      success: false,
      error: error.message || "Kunne ikke hente nedlastingslenker",
    };
  }
}

