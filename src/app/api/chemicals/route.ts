import { NextRequest, NextResponse } from "next/server";
import { ChemicalStatus } from "@prisma/client";

import { getAuthMembership } from "@/lib/auth-db";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { insertChemical, loadChemicalsForTenant, toIso } from "@/server/queries/chemicals.queries";

const managerRoles = new Set(["ADMIN", "LEDER", "HMS"]);
const allowedStatuses = new Set<ChemicalStatus>(["ACTIVE", "PHASED_OUT", "ARCHIVED"]);
const parseStatus = (value: string | null): ChemicalStatus | null => {
  if (!value) {
    return null;
  }
  if (!allowedStatuses.has(value as ChemicalStatus)) {
    return null;
  }
  return value as ChemicalStatus;
};

const normalizeJsonArrayField = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const normalized = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return JSON.stringify(normalized);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
        return JSON.stringify(normalized);
      }
    } catch {
      return JSON.stringify([trimmed]);
    }
  }

  return null;
};

const hasManagerRole = async (userId: string, tenantId: string): Promise<boolean> => {
  const membership = await getAuthMembership(userId, tenantId);
  return membership ? managerRoles.has(membership.role) : false;
};

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const statusParam = request.nextUrl.searchParams.get("status");
    const statusFilter = parseStatus(statusParam);

    const chemicals = await loadChemicalsForTenant(
      tenantContext.tenantId,
      statusFilter ? { status: statusFilter } : undefined,
    );

    return NextResponse.json({ chemicals }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load the COSHH register") },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getRequiredTenantContext();
    const canManage = await hasManagerRole(tenantContext.userId, tenantContext.tenantId);

    if (!canManage) {
      return NextResponse.json({ error: "You do not have permission to create a COSHH record" }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const productName = typeof payload.productName === "string" ? payload.productName.trim() : "";

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const statusValue =
      typeof payload.status === "string" ? parseStatus(payload.status) ?? "ACTIVE" : "ACTIVE";

    const chemical = await insertChemical({
      tenantId: tenantContext.tenantId,
      productName,
      supplier: typeof payload.supplier === "string" ? payload.supplier.trim() || null : null,
      casNumber: typeof payload.casNumber === "string" ? payload.casNumber.trim() || null : null,
      hazardClass: typeof payload.hazardClass === "string" ? payload.hazardClass.trim() || null : null,
      hazardStatements:
        typeof payload.hazardStatements === "string" ? payload.hazardStatements.trim() || null : null,
      precautionaryStatements:
        typeof payload.precautionaryStatements === "string"
          ? payload.precautionaryStatements.trim() || null
          : null,
      warningPictograms: normalizeJsonArrayField(payload.warningPictograms),
      requiredPPE: normalizeJsonArrayField(payload.requiredPPE),
      containsIsocyanates: payload.containsIsocyanates === true,
      isCMR: payload.isCMR === true,
      isSVHC: payload.isSVHC === true,
      sdsKey: typeof payload.sdsKey === "string" ? payload.sdsKey.trim() || null : null,
      sdsVersion: typeof payload.sdsVersion === "string" ? payload.sdsVersion.trim() || null : null,
      sdsDate: typeof payload.sdsDate === "string" && payload.sdsDate ? toIso(payload.sdsDate) : null,
      nextReviewDate:
        typeof payload.nextReviewDate === "string" && payload.nextReviewDate
          ? toIso(payload.nextReviewDate)
          : null,
      location: typeof payload.location === "string" ? payload.location.trim() || null : null,
      quantity:
        typeof payload.quantity === "number"
          ? payload.quantity
          : typeof payload.quantity === "string" && payload.quantity.trim()
            ? Number(payload.quantity)
            : null,
      unit: typeof payload.unit === "string" ? payload.unit.trim() || null : null,
      status: statusValue,
      notes: typeof payload.notes === "string" ? payload.notes.trim() || null : null,
    });

    return NextResponse.json({ chemical }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not create the COSHH record") },
      { status: 500 },
    );
  }
}
