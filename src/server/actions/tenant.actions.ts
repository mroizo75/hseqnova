"use server";

import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { getAdminDb } from "@/lib/supabase/admin";
import { loadAdminTenantDetails } from "@/server/queries/admin.queries";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendEmail } from "@/lib/email";
import { deleteTenantFiles } from "@/lib/storage";
import { RiskCategory } from "@prisma/client";
import { getBindingPrice } from "@/lib/subscription";
import { provisionIndustryPackage } from "@/server/actions/industry-provision.actions";
import {
  getIndustryPackage,
  getIndustryLabel,
  isSupportedIndustry,
  normalizeIndustryValue,
} from "@/lib/industry-packages";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRiskAnalysis } from "@/lib/ai";

// Valideringsskjemaer
const updateTenantSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(2, "Navn må være minst 2 tegn"),
  slug: z.string().min(2, "Slug må være minst 2 tegn").regex(/^[a-z0-9-]+$/, "Slug kan kun inneholde små bokstaver, tall og bindestrek"),
  orgNumber: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email("Ugyldig e-postadresse").optional(),
  contactPhone: z.string().optional(),
  employeeCount: z.number().int().positive("Antall ansatte må være positivt").optional(),
  industry: z
    .string()
    .optional()
    .refine((value) => !value || isSupportedIndustry(value), "Ugyldig bransje"),
  notes: z.string().optional(),
  hmsAnnualPlanEnabled: z.boolean().optional(),
  managementReviewFrequencyMonths: z
    .number()
    .int()
    .min(1, "Frekvens må være minst 1 måned")
    .max(24, "Frekvens kan ikke være mer enn 24 måneder")
    .optional(),
});

const updateAdminEmailSchema = z.object({
  tenantId: z.string(),
  oldEmail: z.string().email(),
  newEmail: z.string().email("Ugyldig e-postadresse"),
});

const resendActivationSchema = z.object({
  tenantId: z.string(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8, "Passord må være minst 8 tegn"),
});

const createTenantSchema = z.object({
  name: z.string().min(2, "Bedriftsnavn må være minst 2 tegn"),
  orgNumber: z.string().optional(),
  contactPerson: z.string().min(2, "Kontaktperson er påkrevd"),
  contactEmail: z.string().email("Ugyldig e-postadresse"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  employeeCount: z.number().int().positive("Antall ansatte må være positivt"),
  industry: z
    .string()
    .optional()
    .refine((value) => !value || isSupportedIndustry(value), "Ugyldig bransje"),
  notes: z.string().optional(),
  pricingTier: z.enum(["MICRO", "SMALL", "MEDIUM", "LARGE"]),
  salesRep: z.string().optional(),
  createInFiken: z.boolean().optional(),
  // Fremtidig: her kan vi senere åpne for å spesifisere HMS-oppsett ved opprettelse
});

const createTenantActivitySchema = z.object({
  tenantId: z.string(),
  type: z.enum(["CONTACT", "FOLLOW_UP", "OFFER_SENT", "MEETING", "OTHER"]),
  channel: z.enum(["PHONE", "EMAIL", "MEETING", "OTHER"]),
  note: z.string().min(2, "Notat må være minst 2 tegn"),
});

const createTenantOfferSchema = z.object({
  tenantId: z.string(),
  setupPrice: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

async function requirePrivilegedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const { data: user, error } = await getAdminDb()
    .from("User")
    .select("id, isSuperAdmin, isSupport")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error || !user || (!user.isSuperAdmin && !user.isSupport)) {
    return null;
  }

  return user as { id: string; isSuperAdmin: boolean; isSupport: boolean };
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const { data: user, error } = await getAdminDb()
    .from("User")
    .select("id, isSuperAdmin")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error || !user?.isSuperAdmin) return null;
  return user as { id: string; isSuperAdmin: boolean };
}

function mapAiSeverityToValues(
  severity: string
): { likelihood: number; consequence: number } {
  const normalizedSeverity = severity.trim().toUpperCase();
  if (normalizedSeverity === "HIGH") {
    return { likelihood: 3, consequence: 4 };
  }
  if (normalizedSeverity === "MEDIUM") {
    return { likelihood: 2, consequence: 3 };
  }
  return { likelihood: 1, consequence: 2 };
}

function mapAiCategoryToRiskCategory(category: string): RiskCategory {
  const normalizedCategory = category.trim().toLowerCase();
  if (normalizedCategory.includes("ergonomi")) {
    return "ERGONOMIC";
  }
  if (normalizedCategory.includes("sikker")) {
    return "SAFETY";
  }
  if (normalizedCategory.includes("psyk")) {
    return "PSYCHOSOCIAL";
  }
  if (normalizedCategory.includes("kjem")) {
    return "HEALTH";
  }
  if (normalizedCategory.includes("fysisk")) {
    return "PHYSICAL";
  }
  if (normalizedCategory.includes("milj")) {
    return "ENVIRONMENTAL";
  }
  if (normalizedCategory.includes("jurid")) {
    return "LEGAL";
  }
  return "OPERATIONAL";
}

export async function getTenantIndustryPackageStatus(tenantId: string) {
  try {
    const privilegedUser = await requirePrivilegedUser();
    if (!privilegedUser) {
      return { success: false, error: "Access denied" };
    }

    const db = getAdminDb();
    const { data: tenant, error: tenantError } = await db
      .from("Tenant")
      .select("id, industry, simpleMenuItems")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantError || !tenant) {
      return { success: false, error: "Organisation not found" };
    }

    const industryPackage = getIndustryPackage(tenant.industry as string | null);
    if (!industryPackage) {
      return {
        success: true,
        data: {
          hasPackage: false,
          industry: (tenant.industry as string | null) || null,
          industryLabel: tenant.industry ? getIndustryLabel(tenant.industry as string) : null,
        },
      };
    }

    const expectedRiskTitles = industryPackage.risks.map((item) => item.title);
    const expectedSjaTemplates = industryPackage.sjaTemplates.map((item) => item.name);
    const expectedInspectionTemplates = industryPackage.inspectionTemplates.map((item) => item.name);
    const expectedCourseKeys = industryPackage.courseTemplates.map((item) => item.courseKey);

    const empty = "__none__";
    const [riskRes, sjaRes, inspectionRes, courseRes, legalRes] = await Promise.all([
      db.from("Risk").select("title").eq("tenantId", tenantId).in("title", expectedRiskTitles.length ? expectedRiskTitles : [empty]),
      db.from("SjaTemplate").select("name").eq("tenantId", tenantId).eq("isActive", true).in("name", expectedSjaTemplates.length ? expectedSjaTemplates : [empty]),
      db.from("InspectionTemplate").select("name").eq("tenantId", tenantId).in("name", expectedInspectionTemplates.length ? expectedInspectionTemplates : [empty]),
      db.from("CourseTemplate").select("courseKey").eq("tenantId", tenantId).eq("isActive", true).in("courseKey", expectedCourseKeys.length ? expectedCourseKeys : [empty]),
      db.from("LegalReference").select("title, paragraphRef, industries").order("sortOrder", { ascending: true }),
    ]);

    const riskMatches = riskRes.data ?? [];
    const sjaMatches = sjaRes.data ?? [];
    const inspectionMatches = inspectionRes.data ?? [];
    const courseMatches = courseRes.data ?? [];
    const allLegalReferences = legalRes.data ?? [];

    const legalReferencesForIndustry = allLegalReferences.filter((reference) => {
      const industries = Array.isArray(reference.industries)
        ? (reference.industries as string[])
        : [];
      const normalized = industries.map((item) => item.toLowerCase());
      return normalized.includes(industryPackage.industry) || normalized.includes("all");
    });

    const expectedLegalReferenceKeys = industryPackage.legalReferences.map(
      (reference) => `${reference.title}::${reference.paragraphRef}`
    );
    const existingLegalReferenceKeys = new Set(
      legalReferencesForIndustry.map((reference) => `${reference.title}::${reference.paragraphRef || ""}`)
    );

    const existingRiskTitles = new Set(riskMatches.map((item) => String(item.title)));
    const existingSjaTemplateNames = new Set(sjaMatches.map((item) => String(item.name)));
    const existingInspectionTemplateNames = new Set(inspectionMatches.map((item) => String(item.name)));
    const existingCourseKeys = new Set(courseMatches.map((item) => String(item.courseKey)));
    const selectedSimpleMenuItems = Array.isArray(tenant.simpleMenuItems)
      ? (tenant.simpleMenuItems as string[])
      : [];

    const missingRiskTitles = expectedRiskTitles.filter((item) => !existingRiskTitles.has(item));
    const missingSjaTemplates = expectedSjaTemplates.filter((item) => !existingSjaTemplateNames.has(item));
    const missingInspectionTemplates = expectedInspectionTemplates.filter(
      (item) => !existingInspectionTemplateNames.has(item)
    );
    const missingCourseKeys = expectedCourseKeys.filter((item) => !existingCourseKeys.has(item));
    const missingLegalReferences = expectedLegalReferenceKeys.filter(
      (key) => !existingLegalReferenceKeys.has(key)
    );
    const missingSimpleMenuItems = industryPackage.simpleMenuHrefs.filter(
      (href) => !selectedSimpleMenuItems.includes(href)
    );

    return {
      success: true,
      data: {
        hasPackage: true,
        industry: industryPackage.industry,
        industryLabel: industryPackage.displayName,
        sections: {
          risks: {
            expected: expectedRiskTitles.length,
            existing: expectedRiskTitles.length - missingRiskTitles.length,
            missing: missingRiskTitles,
          },
          sjaTemplates: {
            expected: expectedSjaTemplates.length,
            existing: expectedSjaTemplates.length - missingSjaTemplates.length,
            missing: missingSjaTemplates,
          },
          inspectionTemplates: {
            expected: expectedInspectionTemplates.length,
            existing: expectedInspectionTemplates.length - missingInspectionTemplates.length,
            missing: missingInspectionTemplates,
          },
          courses: {
            expected: expectedCourseKeys.length,
            existing: expectedCourseKeys.length - missingCourseKeys.length,
            missing: missingCourseKeys,
          },
          legalReferences: {
            expected: expectedLegalReferenceKeys.length,
            existing: expectedLegalReferenceKeys.length - missingLegalReferences.length,
            missing: missingLegalReferences,
          },
          simpleMenu: {
            expected: industryPackage.simpleMenuHrefs.length,
            existing: industryPackage.simpleMenuHrefs.length - missingSimpleMenuItems.length,
            missing: missingSimpleMenuItems,
          },
        },
      },
    };
  } catch (error: any) {
    console.error("Get tenant industry package status error:", error);
    return { success: false, error: error.message || "Could not fetch industry package status" };
  }
}

export async function reprovisionTenantIndustryPackage(tenantId: string) {
  try {
    const privilegedUser = await requirePrivilegedUser();
    if (!privilegedUser) {
      return { success: false, error: "Access denied" };
    }

    const result = await provisionIndustryPackage(tenantId);
    if (!result.success) {
      return { success: false, error: result.error || "Could not reprovision industry package" };
    }

    revalidatePath(`/admin/tenants/${tenantId}`);
    revalidatePath("/admin/tenants");
    return { success: true };
  } catch (error: any) {
    console.error("Reprovision tenant industry package error:", error);
    return { success: false, error: error.message || "Could not reprovision industry package" };
  }
}

export async function generateAiRiskSuggestionsForTenant(tenantId: string) {
  try {
    const privilegedUser = await requirePrivilegedUser();
    if (!privilegedUser) {
      return { success: false, error: "Access denied" };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        industry: true,
        employeeCount: true,
      },
    });

    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }

    const industryLabel = tenant.industry?.trim()
      ? getIndustryLabel(tenant.industry)
      : "Annet";

    const ownerCandidate = await prisma.userTenant.findFirst({
      where: {
        tenantId,
        role: { in: ["ADMIN", "HMS", "LEDER"] },
      },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });

    if (!ownerCandidate) {
      return { success: false, error: "No responsible user found for new risk suggestions" };
    }

    const [existingRisks, existingIncidents] = await Promise.all([
      prisma.risk.findMany({
        where: { tenantId },
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.incident.findMany({
        where: { tenantId },
        select: { title: true },
        orderBy: { occurredAt: "desc" },
        take: 50,
      }),
    ]);

    const analysis = await generateRiskAnalysis(
      industryLabel,
      tenant.employeeCount || 1,
      existingRisks.map((risk) => risk.title),
      existingIncidents.map((incident) => incident.title),
      {
        cacheScope: `tenant:${tenantId}:riskSuggestions`,
        rateLimitScope: `tenant:${tenantId}`,
        budgetScope: `tenant:${tenantId}`,
      }
    );

    if (!analysis.suggestedRisks.length) {
      return {
        success: true,
        data: { created: 0, skipped: 0, message: "AI returned no new suggestions" },
      };
    }

    const currentYear = new Date().getFullYear();
    const assessmentTitle = `Risikovurdering ${currentYear}`;
    let createdCount = 0;
    let skippedCount = 0;

    await prisma.$transaction(async (tx) => {
      let assessment = await tx.riskAssessment.findFirst({
        where: {
          tenantId,
          title: assessmentTitle,
          assessmentYear: currentYear,
        },
        select: { id: true },
      });

      if (!assessment) {
        assessment = await tx.riskAssessment.create({
          data: {
            tenantId,
            title: assessmentTitle,
            assessmentYear: currentYear,
          },
          select: { id: true },
        });
      }

      for (const suggestion of analysis.suggestedRisks) {
        const suggestionTitle = suggestion.risk.trim();
        if (!suggestionTitle) {
          skippedCount += 1;
          continue;
        }

        const existingRisk = await tx.risk.findFirst({
          where: {
            tenantId,
            title: suggestionTitle,
          },
          select: { id: true },
        });

        if (existingRisk) {
          skippedCount += 1;
          continue;
        }

        const severityValues = mapAiSeverityToValues(suggestion.severity);
        await tx.risk.create({
          data: {
            tenantId,
            riskAssessmentId: assessment.id,
            title: suggestionTitle,
            context: `AI-forslag for ${industryLabel}: ${suggestionTitle}`,
            likelihood: severityValues.likelihood,
            consequence: severityValues.consequence,
            score: severityValues.likelihood * severityValues.consequence,
            ownerId: ownerCandidate.userId,
            category: mapAiCategoryToRiskCategory(suggestion.category || ""),
            description: `Automatisk forslag basert på bransje, eksisterende risiko og hendelseshistorikk.`,
            existingControls: "Vurder tiltak via SJA, vernerunde og opplæringsplan.",
            riskStatement: suggestionTitle,
          },
        });
        createdCount += 1;
      }
    });

    revalidatePath(`/admin/tenants/${tenantId}`);
    revalidatePath("/dashboard/risks");

    return {
      success: true,
      data: {
        created: createdCount,
        skipped: skippedCount,
      },
    };
  } catch (error: any) {
    console.error("Generate AI risk suggestions error:", error);
    return {
      success: false,
      error: error.message || "Could not generate AI risk suggestions",
    };
  }
}

const applyAiSuggestionsSchema = z.object({
  tenantId: z.string().cuid(),
  assessmentTitle: z.string().trim().min(2).max(200).optional(),
  suggestions: z
    .array(
      z.object({
        title: z.string().min(2),
        severity: z.string().min(1),
        category: z.string().min(1),
      })
    )
    .min(1),
});

export async function previewAiRiskSuggestionsForTenant(tenantId: string) {
  try {
    const privilegedUser = await requirePrivilegedUser();
    if (!privilegedUser) {
      return { success: false, error: "Access denied" };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        industry: true,
        employeeCount: true,
      },
    });

    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }

    const industryLabel = tenant.industry?.trim()
      ? getIndustryLabel(tenant.industry)
      : "Annet";

    const [existingRisks, existingIncidents] = await Promise.all([
      prisma.risk.findMany({
        where: { tenantId },
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.incident.findMany({
        where: { tenantId },
        select: { title: true },
        orderBy: { occurredAt: "desc" },
        take: 100,
      }),
    ]);

    const analysis = await generateRiskAnalysis(
      industryLabel,
      tenant.employeeCount || 1,
      existingRisks.map((risk) => risk.title),
      existingIncidents.map((incident) => incident.title),
      {
        cacheScope: `tenant:${tenantId}:riskSuggestions`,
        rateLimitScope: `tenant:${tenantId}`,
        budgetScope: `tenant:${tenantId}`,
      }
    );

    const existingRiskTitles = new Set(
      existingRisks.map((risk) => risk.title.trim().toLowerCase())
    );

    const suggestions = analysis.suggestedRisks
      .map((suggestion) => {
        const title = suggestion.risk.trim();
        const severity = suggestion.severity.trim().toUpperCase();
        const category = suggestion.category.trim();
        const rationale = (suggestion.rationale || "").trim();
        return {
          title,
          severity,
          category,
          rationale,
          isDuplicate: existingRiskTitles.has(title.toLowerCase()),
        };
      })
      .filter((suggestion) => suggestion.title.length > 0);

    return {
      success: true,
      data: {
        suggestions,
      },
    };
  } catch (error: any) {
    console.error("Preview AI risk suggestions error:", error);
    return {
      success: false,
      error: error.message || "Could not preview AI risk suggestions",
    };
  }
}

export async function applyAiRiskSuggestionsForTenant(input: {
  tenantId: string;
  assessmentTitle?: string;
  suggestions: Array<{ title: string; severity: string; category: string }>;
}) {
  try {
    const privilegedUser = await requirePrivilegedUser();
    if (!privilegedUser) {
      return { success: false, error: "Access denied" };
    }

    const validated = applyAiSuggestionsSchema.parse(input);

    const tenant = await prisma.tenant.findUnique({
      where: { id: validated.tenantId },
      select: {
        id: true,
        industry: true,
      },
    });

    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }

    const industryLabel = tenant.industry?.trim()
      ? getIndustryLabel(tenant.industry)
      : "Annet";

    const ownerCandidate = await prisma.userTenant.findFirst({
      where: {
        tenantId: validated.tenantId,
        role: { in: ["ADMIN", "HMS", "LEDER"] },
      },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });

    if (!ownerCandidate) {
      return { success: false, error: "No responsible user found for new risk suggestions" };
    }

    const currentYear = new Date().getFullYear();
    const assessmentTitle =
      validated.assessmentTitle?.trim() || `Risikovurdering ${currentYear}`;
    let createdCount = 0;
    let skippedCount = 0;

    await prisma.$transaction(async (tx) => {
      let assessment = await tx.riskAssessment.findFirst({
        where: {
          tenantId: validated.tenantId,
          title: assessmentTitle,
          assessmentYear: currentYear,
        },
        select: { id: true },
      });

      if (!assessment) {
        assessment = await tx.riskAssessment.create({
          data: {
            tenantId: validated.tenantId,
            title: assessmentTitle,
            assessmentYear: currentYear,
          },
          select: { id: true },
        });
      }

      for (const suggestion of validated.suggestions) {
        const suggestionTitle = suggestion.title.trim();
        if (!suggestionTitle) {
          skippedCount += 1;
          continue;
        }

        const existingRisk = await tx.risk.findFirst({
          where: {
            tenantId: validated.tenantId,
            title: suggestionTitle,
          },
          select: { id: true },
        });

        if (existingRisk) {
          skippedCount += 1;
          continue;
        }

        const severityValues = mapAiSeverityToValues(suggestion.severity);
        await tx.risk.create({
          data: {
            tenantId: validated.tenantId,
            riskAssessmentId: assessment.id,
            title: suggestionTitle,
            context: `AI-forslag for ${industryLabel}: ${suggestionTitle}`,
            likelihood: severityValues.likelihood,
            consequence: severityValues.consequence,
            score: severityValues.likelihood * severityValues.consequence,
            ownerId: ownerCandidate.userId,
            category: mapAiCategoryToRiskCategory(suggestion.category || ""),
            description: "Manuelt godkjent AI-forslag basert på bransjedata og historikk.",
            existingControls: "Vurder tiltak via SJA, vernerunde og opplæringsplan.",
            riskStatement: suggestionTitle,
          },
        });
        createdCount += 1;
      }
    });

    revalidatePath(`/admin/tenants/${validated.tenantId}`);
    revalidatePath("/dashboard/risks");

    return {
      success: true,
      data: {
        created: createdCount,
        skipped: skippedCount,
      },
    };
  } catch (error: any) {
    console.error("Apply AI risk suggestions error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message || "Ugyldig input" };
    }
    return {
      success: false,
      error: error.message || "Could not save AI risk suggestions",
    };
  }
}

/**
 * Hent detaljert tenant-informasjon
 */
export async function getTenantDetails(tenantId: string) {
  try {
    const tenant = await loadAdminTenantDetails(tenantId);
    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }
    return { success: true, data: tenant };
  } catch {
    return { success: false, error: "Could not fetch organisation details" };
  }
}

export async function createTenantOffer(input: z.infer<typeof createTenantOfferSchema>) {
  try {
    const validated = createTenantOfferSchema.parse(input);

    const tenant = await prisma.tenant.findUnique({
      where: { id: validated.tenantId },
    });

    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }

    const binding = getBindingPrice("1year");
    const yearlyPrice = binding.yearlyPrice;
    const token = randomUUID();

    const offer = await prisma.tenantOffer.create({
      data: {
        tenantId: tenant.id,
        status: "SENT",
        token,
        yearlyPrice,
        bindingMonths: 12,
        noticeMonths: 3,
        setupPrice: validated.setupPrice,
        notes: validated.notes,
        sentAt: new Date(),
      },
    });

    const toEmail = tenant.invoiceEmail || tenant.contactEmail;

    if (toEmail && process.env.RESEND_API_KEY) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const offerUrl = `${appUrl}/tilbud/${offer.token}`;
      const companyName = tenant.name;

      await sendEmail({
        to: toEmail,
        subject: `Quotation from HSEQ Nova – ${companyName}`,
        html: `
          <h1>HSEQ Nova Quotation</h1>
          <p>Dear${tenant.contactPerson ? ` ${tenant.contactPerson}` : ""},</p>
          <p>Thank you for your interest in HSEQ Nova. We have prepared a quotation based on standard pricing with a 12-month contract and 3-month notice period.</p>
          <ul>
            <li>Annual price: <strong>£${yearlyPrice.toLocaleString("en-GB")}/year</strong></li>
            <li>Contract term: <strong>12 months</strong></li>
            <li>Notice period: <strong>3 months after contract end</strong></li>
            ${
              validated.setupPrice != null
                ? `<li>Setup / health &amp; safety policy configuration: <strong>£${validated.setupPrice.toLocaleString(
                    "en-GB",
                  )}</strong></li>`
                : ""
            }
          </ul>
          <p>You can review and accept the full contract here:</p>
          <p><a href="${offerUrl}">${offerUrl}</a></p>
          <p>Please do not hesitate to contact us if you have any questions.</p>
          <p>Kind regards,<br/>HSEQ Nova</p>
        `,
      });
    }

    revalidatePath(`/admin/tenants/${tenant.id}`);

    return { success: true, data: offer };
  } catch (error) {
    console.error("Create tenant offer error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Could not create offer" };
  }
}

export async function acceptTenantOffer(token: string) {
  try {
    const offer = await prisma.tenantOffer.findUnique({
      where: { token },
      include: {
        tenant: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!offer || offer.status !== "SENT") {
      return { success: false, error: "This offer is no longer valid" };
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime());
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    await prisma.$transaction(async (tx) => {
      await tx.tenantOffer.update({
        where: { id: offer.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
        },
      });

      if (offer.tenant.subscription) {
        await tx.subscription.update({
          where: { tenantId: offer.tenantId },
          data: {
            plan:
              offer.tenant.pricingTier === "MICRO"
                ? "STARTER"
                : offer.tenant.pricingTier === "SMALL"
                ? "PROFESSIONAL"
                : "ENTERPRISE",
            price: offer.yearlyPrice,
            billingInterval: "YEARLY",
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            tenantId: offer.tenantId,
            plan:
              offer.tenant.pricingTier === "MICRO"
                ? "STARTER"
                : offer.tenant.pricingTier === "SMALL"
                ? "PROFESSIONAL"
                : "ENTERPRISE",
            price: offer.yearlyPrice,
            billingInterval: "YEARLY",
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      await tx.tenant.update({
        where: { id: offer.tenantId },
        data: {
          status: "ACTIVE",
          onboardingStatus: "COMPLETED",
          onboardingCompletedAt: now,
          trialEndsAt: null,
        },
      });

      await tx.tenantActivity.create({
        data: {
          tenantId: offer.tenantId,
          type: "OTHER",
          channel: "OTHER",
          note: "Contract accepted by the customer via offer link. Tenant activated.",
        },
      });
    });

    revalidatePath(`/admin/tenants/${offer.tenantId}`);

    return { success: true, data: { tenantId: offer.tenantId } };
  } catch (error) {
    console.error("Accept tenant offer error:", error);
    return { success: false, error: "Could not accept offer" };
  }
}

export async function createTenantActivity(input: z.infer<typeof createTenantActivitySchema>) {
  try {
    const validated = createTenantActivitySchema.parse(input);

    const activity = await prisma.tenantActivity.create({
      data: {
        tenantId: validated.tenantId,
        type: validated.type,
        channel: validated.channel,
        note: validated.note,
      },
    });

    revalidatePath(`/admin/tenants/${validated.tenantId}`);

    return { success: true, data: activity };
  } catch (error) {
    console.error("Create tenant activity error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Could not create activity" };
  }
}

/**
 * Oppdater tenant-informasjon
 */
export async function updateTenant(input: z.infer<typeof updateTenantSchema>) {
  try {
    const superAdmin = await requireSuperAdmin();
    if (!superAdmin) return { success: false, error: "Only superadmin has access" };

    const validated = updateTenantSchema.parse(input);

    // Sjekk at slug er unik (unntatt for denne tenanten)
    const existingSlug = await prisma.tenant.findFirst({
      where: {
        slug: validated.slug,
        id: {
          not: validated.tenantId,
        },
      },
    });

    if (existingSlug) {
      return { success: false, error: "This slug is already in use" };
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { id: validated.tenantId },
      select: { industry: true },
    });

    if (!existingTenant) {
      return { success: false, error: "Organisation not found" };
    }

    const normalizedIndustry = validated.industry
      ? normalizeIndustryValue(validated.industry)
      : undefined;

    const updatedTenant = await prisma.tenant.update({
      where: { id: validated.tenantId },
      data: {
        name: validated.name,
        slug: validated.slug,
        orgNumber: validated.orgNumber,
        address: validated.address,
        postalCode: validated.postalCode,
        city: validated.city,
        contactPerson: validated.contactPerson,
        contactEmail: validated.contactEmail,
        contactPhone: validated.contactPhone,
        employeeCount: validated.employeeCount,
        industry: normalizedIndustry,
        notes: validated.notes,
        hmsAnnualPlanEnabled:
          typeof validated.hmsAnnualPlanEnabled === "boolean"
            ? validated.hmsAnnualPlanEnabled
            : undefined,
        managementReviewFrequencyMonths:
          typeof validated.managementReviewFrequencyMonths === "number"
            ? validated.managementReviewFrequencyMonths
            : undefined,
      },
    });

    const previousIndustry = normalizeIndustryValue(existingTenant.industry);
    const nextIndustry = normalizeIndustryValue(updatedTenant.industry);
    if (nextIndustry && previousIndustry !== nextIndustry) {
      await provisionIndustryPackage(updatedTenant.id);
    }

    revalidatePath(`/admin/tenants/${validated.tenantId}`);
    revalidatePath("/admin/tenants");

    return { success: true, data: updatedTenant };
  } catch (error) {
    console.error("Update tenant error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Could not update organisation details" };
  }
}

/**
 * Oppdater admin-brukerens e-post
 */
export async function updateTenantAdminEmail(input: z.infer<typeof updateAdminEmailSchema>) {
  try {
    const superAdmin = await requireSuperAdmin();
    if (!superAdmin) return { success: false, error: "Only superadmin has access" };

    const validated = updateAdminEmailSchema.parse(input);

    // Finn admin-brukeren
    const userTenant = await prisma.userTenant.findFirst({
      where: {
        tenantId: validated.tenantId,
        role: "ADMIN",
        user: {
          email: validated.oldEmail,
        },
      },
      include: {
        user: true,
      },
    });

    if (!userTenant) {
      return { success: false, error: "Admin user not found" };
    }

    // Sjekk at ny e-post ikke er i bruk
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.newEmail },
    });

    if (existingUser && existingUser.id !== userTenant.userId) {
      return { success: false, error: "This email address is already in use by another user" };
    }

    // Oppdater e-post
    const updatedUser = await prisma.user.update({
      where: { id: userTenant.userId },
      data: {
        email: validated.newEmail,
        emailVerified: new Date(), // Automatisk verifiser admin
      },
    });

    // Send bekreftelse på e-post
    await sendEmail({
      to: validated.newEmail,
      subject: "Email address updated — HSEQ Nova",
      html: `
        <h1>Email address updated</h1>
        <p>Dear ${updatedUser.name},</p>
        <p>Your email address for HSEQ Nova has been updated to: <strong>${validated.newEmail}</strong></p>
        <p>You can now sign in using this email address.</p>
        <br>
        <p>Kind regards,<br/>The HSEQ Nova Team</p>
      `,
    });

    revalidatePath(`/admin/tenants/${validated.tenantId}`);

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Update admin email error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Could not update email address" };
  }
}

/**
 * Send aktivering på nytt
 */
export async function resendActivationEmail(input: z.infer<typeof resendActivationSchema>) {
  try {
    const validated = resendActivationSchema.parse(input);

    const tenant = await prisma.tenant.findUnique({
      where: { id: validated.tenantId },
    });

    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }

    // Finn eller opprett admin-bruker
    let user = await prisma.user.findUnique({
      where: { email: validated.adminEmail },
      include: {
        tenants: {
          where: {
            tenantId: validated.tenantId,
          },
        },
      },
    });

    const hashedPassword = await bcrypt.hash(validated.adminPassword, 10);

    if (!user) {
      // Opprett ny bruker
      user = await prisma.user.create({
        data: {
          email: validated.adminEmail,
          name: tenant.contactPerson || "Admin",
          password: hashedPassword,
          emailVerified: new Date(),
          tenants: {
            create: {
              tenantId: validated.tenantId,
              role: "ADMIN",
            },
          },
        },
        include: {
          tenants: {
            where: {
              tenantId: validated.tenantId,
            },
          },
        },
      });
    } else if (user.tenants.length === 0) {
      // Koble eksisterende bruker til tenant
      await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: validated.tenantId,
          role: "ADMIN",
        },
      });

      // Oppdater passord
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });
    } else {
      // Oppdater eksisterende bruker
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });
    }

    // Send aktiverings-e-post med klartekst-passord
    await sendEmail({
      to: validated.adminEmail,
      subject: `Welcome to HSEQ Nova — ${tenant.name}`,
      html: `
        <h1>Welcome to HSEQ Nova!</h1>
        <p>Your organisation, <strong>${tenant.name}</strong>, is now active.</p>
        
        <h2>Sign-in details</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;">
            <strong>URL:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a>
          </p>
          <p style="margin: 0 0 10px 0;">
            <strong>Email:</strong> ${validated.adminEmail}
          </p>
          <p style="margin: 0;">
            <strong>Password:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${validated.adminPassword}</code>
          </p>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            <strong>⚠️ Important:</strong> We recommend that you change this password after your first sign-in. 
            You can do this under "My Profile" once signed in.
          </p>
        </div>

        <p>You now have access to the system and can start using HSEQ Nova.</p>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Sign in now
          </a>
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          If you have any questions, contact us at support@hseqnova.com
        </p>
        
        <p>Kind regards,<br/>The HSEQ Nova Team</p>
      `,
    });

    revalidatePath(`/admin/tenants/${validated.tenantId}`);

    return { success: true };
  } catch (error) {
    console.error("Resend activation error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Could not send activation email" };
  }
}

/**
 * Sync users from an HSEQ Nova tenant to Bransjekurs.no.
 * Kun mulig for tenants med bransjekursEnabled = true.
 */
export async function syncTenantToBransjekurs(_tenantId: string) {
  return { success: false, error: "Bransjekurs.no is not available in HSEQ Nova UK.", data: { synced: 0, created: 0, updated: 0 } };
}

export async function toggleBransjekursAvtale(_tenantId: string, _enabled: boolean) {
  return { success: false, error: "Bransjekurs.no is not available in HSEQ Nova UK.", data: { synced: 0, created: 0, updated: 0 } };
}

/**
 * Endre tenant-status
 */
export async function toggleTenantStatus(tenantId: string, newStatus: "ACTIVE" | "SUSPENDED" | "CANCELLED") {
  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: newStatus },
    });

    revalidatePath(`/admin/tenants/${tenantId}`);
    revalidatePath("/admin/tenants");

    return { success: true, data: updatedTenant };
  } catch (error) {
    console.error("Toggle tenant status error:", error);
    return { success: false, error: "Could not change status" };
  }
}

/**
 * Opprett ny tenant (CRM/Onboarding)
 */
export async function createTenant(input: z.infer<typeof createTenantSchema>) {
  try {
    const validated = createTenantSchema.parse(input);

    // Generer slug fra navn
    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Sjekk at slug er unik
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return { 
        success: false, 
        error: `An organisation with slug "${slug}" already exists. Please change the name slightly.` 
      };
    }

    // Opprett tenant med subscription
    const normalizedIndustry = validated.industry
      ? normalizeIndustryValue(validated.industry)
      : undefined;

    const tenant = await prisma.tenant.create({
      data: {
        name: validated.name,
        slug,
        orgNumber: validated.orgNumber,
        address: validated.address,
        postalCode: validated.postalCode,
        city: validated.city,
        contactPerson: validated.contactPerson,
        contactEmail: validated.contactEmail,
        contactPhone: validated.contactPhone,
        employeeCount: validated.employeeCount,
        industry: normalizedIndustry,
        notes: validated.notes,
        pricingTier: validated.pricingTier,
        salesRep: validated.salesRep,
        status: "TRIAL",
        onboardingStatus: "NOT_STARTED",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dager
        // Standard HMS-oppsett
        hmsAnnualPlanEnabled: true,
        managementReviewFrequencyMonths: 12,
        // Subscription opprettes når tenant aktiveres
      },
    });

    await provisionIndustryPackage(tenant.id);

    revalidatePath("/admin/tenants");
    revalidatePath("/admin/registrations");

    return { 
      success: true, 
      data: tenant,
      message: "Organisation created. You can now activate it by sending login details to the admin." 
    };
  } catch (error) {
    console.error("Create tenant error:", error);
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Could not create organisation" };
  }
}

/**
 * Slett tenant permanent (inkludert alle filer i R2 Cloud)
 * ADVARSEL: Denne operasjonen kan ikke angres!
 */
export async function deleteTenant(tenantId: string, confirmationText: string) {
  try {
    const privilegedUser = await requireSuperAdmin();
    if (!privilegedUser) {
      return { success: false, error: "Only superadmin can delete organisations" };
    }

    // Hent tenant først for å verifisere navn
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            incidents: true,
            risks: true,
            trainings: true,
            audits: true,
            goals: true,
            chemicals: true,
            formTemplates: true,
            invoices: true,
          },
        },
      },
    });

    if (!tenant) {
      return { success: false, error: "Organisation not found" };
    }

    // SIKKERHET: Verifiser at confirmationText matcher tenant.name
    if (confirmationText !== tenant.name) {
      return { 
        success: false, 
        error: `Confirmation failed. Enter the organisation name exactly: "${tenant.name}"` 
      };
    }

    // SIKKERHET: Bare tillat sletting hvis status er CANCELLED eller SUSPENDED
    if (tenant.status === "ACTIVE" || tenant.status === "TRIAL") {
      return {
        success: false,
        error: "Cannot delete an active organisation. Change status to CANCELLED or SUSPENDED first.",
      };
    }

    console.log(`[DELETE TENANT] Starter sletting av tenant: ${tenant.name} (${tenantId})`);
    console.log(`[DELETE TENANT] Antall relaterte records:`, tenant._count);

    const tenantUserLinks = await prisma.userTenant.findMany({
      where: { tenantId },
      select: { userId: true },
    });
    const candidateUserIds = Array.from(new Set(tenantUserLinks.map((link) => link.userId)));

    // Steg 1: Slett alle filer i R2 Cloud
    console.log(`[DELETE TENANT] Sletter filer fra R2 Cloud...`);
    const fileResult = await deleteTenantFiles(tenantId);
    console.log(`[DELETE TENANT] R2 Cloud: ${fileResult.deleted} filer slettet, ${fileResult.errors} feil`);

    // Steg 2: Slett tenant + opprydding av bruker-kontoer som blir stående uten tenant
    console.log(`[DELETE TENANT] Sletter tenant fra database...`);
    const deleteResult = await prisma.$transaction(async (tx) => {
      await tx.tenant.delete({
        where: { id: tenantId },
      });

      if (candidateUserIds.length === 0) {
        return { deletedUsers: 0 };
      }

      const deletedUsers = await tx.user.deleteMany({
        where: {
          id: { in: candidateUserIds },
          isSuperAdmin: false,
          isSupport: false,
          tenants: {
            none: {},
          },
        },
      });

      return { deletedUsers: deletedUsers.count };
    });

    console.log(`[DELETE TENANT] ✅ Tenant slettet: ${tenant.name}`);
    console.log(`[DELETE TENANT] ✅ Slettet ${deleteResult.deletedUsers} fristilte brukerkontoer`);

    revalidatePath("/admin/tenants");
    revalidatePath("/admin/registrations");

    return {
      success: true,
      message: `Organisation "${tenant.name}" and all associated data has been permanently deleted. ${fileResult.deleted} files removed from R2 Cloud. ${deleteResult.deletedUsers} user accounts were also deleted.`,
      filesDeleted: fileResult.deleted,
      fileErrors: fileResult.errors,
      usersDeleted: deleteResult.deletedUsers,
    };
  } catch (error) {
    console.error("Delete tenant error:", error);
    return { 
      success: false, 
      error: "Could not delete organisation. See server log for details." 
    };
  }
}
