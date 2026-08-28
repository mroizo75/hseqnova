"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { PricingTier, OnboardingStatus } from "@prisma/client";
import { getCustomerWelcomeEmail, getAdminNotificationEmail } from "@/lib/email-templates";
import { getBindingPrice } from "@/lib/subscription";
import {
  getIndustryLabel,
  isSupportedIndustry,
  normalizeIndustryValue,
} from "@/lib/industry-packages";
import { provisionIndustryPackage } from "@/server/actions/industry-provision.actions";

const resend = new Resend(process.env.RESEND_API_KEY);

const registrationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  orgNumber: z.string().min(6, "Enter a valid Companies House number").max(8),
  employeeCount: z.enum(["1-20", "21-50", "51+"]),
  industry: z
    .string()
    .min(1, "Industry is required")
    .refine((value) => isSupportedIndustry(value), "Invalid industry"),
  contactPerson: z.string().min(2, "Contact person is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(8, "Invalid phone number"),
  farmType: z.string().optional(),
  invoiceEmail: z.string().email("Invalid invoice email").optional().or(z.literal("")),
  purchaseOrderNumber: z.string().optional().nullable(),
  billingMethod: z.enum(["INVOICE", "DIRECT_DEBIT", "CARD"]).optional(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  acceptedTerms: z.literal("true", { message: "You must accept the terms." }),
});

function calculatePricingTier(employeeCount: string): PricingTier {
  switch (employeeCount) {
    case "1-20":
      return "MICRO";
    case "21-50":
      return "SMALL";
    case "51+":
      return "MEDIUM";
    default:
      return "MICRO";
  }
}

function calculateEmployeeCount(range: string): number {
  switch (range) {
    case "1-20":
      return 10; // Average
    case "21-50":
      return 35; // Average
    case "51+":
      return 75; // Average
    default:
      return 10;
  }
}

export async function submitRegistrationRequest(formData: FormData) {
  try {
    // Parse and validate
    const data = {
      companyName: formData.get("companyName") as string,
      orgNumber: (formData.get("orgNumber") as string).replace(/\s/g, ""),
      employeeCount: formData.get("employeeCount") as string,
      industry: formData.get("industry") as string,
      contactPerson: formData.get("contactPerson") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactPhone: formData.get("contactPhone") as string,
      farmType: (formData.get("farmType") as string) || undefined,
      invoiceEmail: formData.get("invoiceEmail") as string,
      purchaseOrderNumber: formData.get("purchaseOrderNumber") as string | null,
      billingMethod: (formData.get("billingMethod") as string) || "INVOICE",
      address: formData.get("address") as string | null,
      postalCode: formData.get("postalCode") as string | null,
      city: formData.get("city") as string | null,
      notes: formData.get("notes") as string | null,
      acceptedTerms: formData.get("acceptedTerms") as string,
    };

    const validated = registrationSchema.parse(data);
    const normalizedIndustry = normalizeIndustryValue(validated.industry);
    const farmTypeNote =
      normalizedIndustry === "agriculture" && validated.farmType
        ? `Farm type: ${validated.farmType}`
        : undefined;
    const mergedNotes = [validated.notes || "", farmTypeNote || ""]
      .filter((part) => part.trim().length > 0)
      .join("\n");

    // Check if org number already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        orgNumber: validated.orgNumber,
      },
    });

    if (existingTenant) {
      return {
        success: false,
        error: "This organisation is already registered. Please contact us if you have forgotten your login details.",
      };
    }

    // Generate slug from company name
    const baseSlug = validated.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug exists, if so add timestamp
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug: baseSlug },
    });

    const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

    // Calculate pricing
    const pricingTier = calculatePricingTier(validated.employeeCount);
    const employeeCount = calculateEmployeeCount(validated.employeeCount);

    // Create only a "pending" tenant — no subscription or users until approved
    const tenant = await prisma.tenant.create({
      data: {
        name: validated.companyName,
        slug,
        orgNumber: validated.orgNumber,
        companyNumber: validated.orgNumber,
        status: "TRIAL",
        trialEndsAt: null,
        contactEmail: validated.contactEmail,
        contactPhone: validated.contactPhone,
        contactPerson: validated.contactPerson,
        address: validated.address || undefined,
        postalCode: validated.postalCode || undefined,
        city: validated.city || undefined,
        invoiceEmail: validated.invoiceEmail || validated.contactEmail,
        purchaseOrderNumber: validated.purchaseOrderNumber || undefined,
        billingMethod: validated.billingMethod ?? "INVOICE",
        invoiceAddress: validated.address || undefined,
        invoicePostalCode: validated.postalCode || undefined,
        invoiceCity: validated.city || undefined,
        // Organisation details
        employeeCount,
        pricingTier,
        industry: normalizedIndustry,
        notes: mergedNotes || undefined,
        onboardingStatus: "NOT_STARTED", // Awaiting approval
        // Contract acceptance — timestamps for legal documentation
        termsAcceptedAt: new Date(),
        // Subscription created only when superadmin activates
        // Users created only when superadmin activates
      },
    });

    // Provision industry package idempotently (at registration time)
    await provisionIndustryPackage(tenant.id);

    // Get pricing info for email (1-year contract as standard)
    const yearlyPrice = getBindingPrice("1year").yearlyPrice;

    // Send confirmation email to customer
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "HSEQ Nova <noreply@hseqnova.com>",
          to: validated.contactEmail,
          subject: "Welcome to HSEQ Nova — Your application has been received",
          html: getCustomerWelcomeEmail({
            contactPerson: validated.contactPerson,
            companyName: validated.companyName,
            orgNumber: validated.orgNumber,
            employeeCount: validated.employeeCount,
            pricingTier,
            yearlyPrice,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the registration if email fails
      }
    }

    // Send notification to admin/support
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "HSEQ Nova <hello@hseqnova.co.uk>",
          to: "kenneth@kksas.no",
          subject: `New registration: ${validated.companyName}`,
          html: getAdminNotificationEmail({
            companyName: validated.companyName,
            orgNumber: validated.orgNumber,
            employeeCount: validated.employeeCount,
            industry: getIndustryLabel(normalizedIndustry),
            pricingTier,
            yearlyPrice,
            contactPerson: validated.contactPerson,
            contactEmail: validated.contactEmail,
            contactPhone: validated.contactPhone,
            useEHF: false,
            invoiceEmail: validated.invoiceEmail,
            address: validated.address || undefined,
            postalCode: validated.postalCode || undefined,
            city: validated.city || undefined,
            notes: mergedNotes || undefined,
            tenantId: tenant.id,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }
    }

    return { success: true, data: { tenantId: tenant.id } };
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}

