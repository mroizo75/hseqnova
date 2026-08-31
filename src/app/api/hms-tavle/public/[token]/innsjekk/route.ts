import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from "@/lib/validations/api";
import { z } from "zod";
import { emitTavleUpdate } from "@/lib/tavle-events";
import { normalizeOrgNr } from "@/features/hms-tavle/lib/oversiktsliste-config";

/**
 * Operational site check-in / check-out.
 * Not a CDM 2015 duty. Used for access control on the board.
 */
const checkinSchema = z.object({
  name: z.string().min(2, "Name is required"),
  employer: z.string().optional(),
  employerOrgNr: z.string().optional(),
  hmsCardNr: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
});

const checkoutSchema = z.object({
  checkinId: z.string().min(1, "Check-in id is required"),
});

async function loadPublicBoard(token: string) {
  const db = getAdminDb();
  const { data: tavle } = await db
    .from("HmsTavle")
    .select("*")
    .eq("publicToken", token)
    .maybeSingle();
  if (!tavle || !tavle.isPublic) {
    return { error: createErrorResponse(ErrorCodes.NOT_FOUND, "Board not found", 404) };
  }

  const { data: subscription } = await db
    .from("HmsTavleSubscription")
    .select("*")
    .eq("tenantId", tavle.tenantId)
    .maybeSingle();

  if (!subscription || subscription.status === "EXPIRED") {
    return {
      error: createErrorResponse("SUBSCRIPTION_EXPIRED", "The digital safety board subscription has expired", 402),
    };
  }

  if (subscription.plan === "ENKEL") {
    return {
      error: createErrorResponse(
        ErrorCodes.FORBIDDEN,
        "QR check-in requires the Standard plan or higher",
        403
      ),
    };
  }

  return { tavle };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { tavle, error } = await loadPublicBoard(token);
    if (error) return error;

    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse(ErrorCodes.VALIDATION_ERROR, parsed.error.issues[0].message, 400);

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const { data: checkin, error: insertError } = await getAdminDb()
      .from("TavleCheckin")
      .insert({
        id: createId(),
        tavleId: tavle.id,
        name: parsed.data.name,
        employer: parsed.data.employer ?? null,
        employerOrgNr: normalizeOrgNr(parsed.data.employerOrgNr),
        hmsCardNr: parsed.data.hmsCardNr ?? null,
        birthDate: parsed.data.birthDate ?? null,
        phone: parsed.data.phone ?? null,
        date: today,
        checkedInAt: now,
      })
      .select("*")
      .single();

    if (insertError) {
      throw { code: "CHECKIN_FAILED", message: insertError.message };
    }

    emitTavleUpdate(token);

    return createSuccessResponse({ checkin }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { tavle, error } = await loadPublicBoard(token);
    if (error) return error;

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse(ErrorCodes.VALIDATION_ERROR, parsed.error.issues[0].message, 400);

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await getAdminDb()
      .from("TavleCheckin")
      .select("id, checkedOutAt")
      .eq("id", parsed.data.checkinId)
      .eq("tavleId", tavle.id)
      .eq("date", today)
      .maybeSingle();

    if (!existing) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "No check-in found for today", 404);
    }

    if (existing.checkedOutAt) {
      return createSuccessResponse({ alreadyCheckedOut: true });
    }

    const { data: checkin, error: updateError } = await getAdminDb()
      .from("TavleCheckin")
      .update({ checkedOutAt: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError) {
      throw { code: "CHECKOUT_FAILED", message: updateError.message };
    }

    emitTavleUpdate(token);

    return createSuccessResponse({ checkin });
  } catch (error) {
    return handleApiError(error);
  }
}
