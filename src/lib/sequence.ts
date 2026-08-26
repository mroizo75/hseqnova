import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

/** Prefix and display format for sequence types */
const SEQUENCE_CONFIG: Record<
  string,
  { prefix: string; format: (year: number, num: number) => string }
> = {
  AVVIK: {
    prefix: "AV",
    format: (year, num) => `AV-${year}-${String(num).padStart(3, "0")}`,
  },
  "FORM:SKJ": {
    prefix: "SKJ",
    format: (year, num) => `SKJ-${year}-${String(num).padStart(3, "0")}`,
  },
  RUH: {
    prefix: "RUH",
    format: (year, num) => `RUH-${year}-${String(num).padStart(3, "0")}`,
  },
  SJA: {
    prefix: "RAMS",
    format: (year, num) => `RAMS-${year}-${String(num).padStart(3, "0")}`,
  },
  "FORM:RUH": {
    prefix: "RUH",
    format: (year, num) => `RUH-${year}-${String(num).padStart(3, "0")}`,
  },
};

function getSequenceConfig(type: string): {
  prefix: string;
  format: (year: number, num: number) => string;
} {
  const config = SEQUENCE_CONFIG[type];
  if (config) return config;
  const prefix = type.startsWith("FORM:") ? type.replace("FORM:", "") : type;
  return {
    prefix: prefix.toUpperCase().slice(0, 6),
    format: (year, num) =>
      `${prefix.toUpperCase().slice(0, 6)}-${year}-${String(num).padStart(3, "0")}`,
  };
}

/**
 * Next unique reference number for a tenant.
 */
export async function generateSequenceNumber(
  tenantId: string,
  sequenceType: string,
  year?: number
): Promise<string> {
  const y = year ?? new Date().getFullYear();
  const config = getSequenceConfig(sequenceType);
  const db = getAdminDb();
  const now = new Date().toISOString();

  const { data: existing, error: readError } = await db
    .from("TenantSequence")
    .select("id, lastNumber")
    .eq("tenantId", tenantId)
    .eq("sequenceType", sequenceType)
    .eq("year", y)
    .maybeSingle();

  if (readError) {
    throw { code: "SEQUENCE_READ_FAILED", message: readError.message };
  }

  const nextNumber = ((existing?.lastNumber as number | undefined) ?? 0) + 1;

  if (existing?.id) {
    const { error: updateError } = await db
      .from("TenantSequence")
      .update({ lastNumber: nextNumber, updatedAt: now })
      .eq("id", existing.id);
    if (updateError) {
      throw { code: "SEQUENCE_UPDATE_FAILED", message: updateError.message };
    }
  } else {
    const { error: insertError } = await db.from("TenantSequence").insert({
      id: createId(),
      tenantId,
      sequenceType,
      year: y,
      lastNumber: nextNumber,
      updatedAt: now,
    });
    if (insertError) {
      throw { code: "SEQUENCE_INSERT_FAILED", message: insertError.message };
    }
  }

  return config.format(y, nextNumber);
}

export function getFormSequenceType(numberPrefix: string | null): string {
  if (!numberPrefix || numberPrefix.trim() === "") {
    return "FORM:SKJ";
  }
  const prefix = numberPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `FORM:${prefix || "SKJ"}`;
}
