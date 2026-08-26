import { z } from "zod";

export const CDM_APPOINTMENT_ROLES = [
  "CLIENT",
  "PRINCIPAL_DESIGNER",
  "PRINCIPAL_CONTRACTOR",
] as const;

export const CDM_ADDITIONAL_ROLES = ["DESIGNER", "CONTRACTOR"] as const;

export const CDM_DUTY_HOLDER_ROLES = [
  ...CDM_APPOINTMENT_ROLES,
  ...CDM_ADDITIONAL_ROLES,
] as const;

export type CdmDutyHolderRoleKey = (typeof CDM_DUTY_HOLDER_ROLES)[number];

export const CDM_DUTY_HOLDER_LABELS: Record<CdmDutyHolderRoleKey, string> = {
  CLIENT: "Client",
  PRINCIPAL_DESIGNER: "Principal Designer",
  PRINCIPAL_CONTRACTOR: "Principal Contractor",
  DESIGNER: "Designer",
  CONTRACTOR: "Contractor",
};

export type CdmDutyHolderInput = {
  id?: string;
  role: CdmDutyHolderRoleKey;
  organisationName: string;
  companyNumber?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export const cdmDutyHolderSchema = z.object({
  id: z.string().optional(),
  role: z.enum(CDM_DUTY_HOLDER_ROLES),
  organisationName: z.string().trim(),
  companyNumber: z.string().trim().optional().nullable(),
  contactName: z.string().trim().optional().nullable(),
  contactEmail: z.string().trim().optional().nullable(),
  contactPhone: z.string().trim().optional().nullable(),
});

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function emptyDutyHolder(role: CdmDutyHolderRoleKey, id?: string): CdmDutyHolderInput {
  return {
    id,
    role,
    organisationName: "",
    companyNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  };
}

export function emptyAppointmentHolders(clientName?: string | null): CdmDutyHolderInput[] {
  return CDM_APPOINTMENT_ROLES.map((role) =>
    emptyDutyHolder(role, undefined),
  ).map((holder) =>
    holder.role === "CLIENT"
      ? { ...holder, organisationName: clientName?.trim() ?? "" }
      : holder,
  );
}

export function isAppointmentRole(role: string): role is (typeof CDM_APPOINTMENT_ROLES)[number] {
  return (CDM_APPOINTMENT_ROLES as readonly string[]).includes(role);
}

export function normalizeDutyHolders(input: CdmDutyHolderInput[]): CdmDutyHolderInput[] {
  const normalized: CdmDutyHolderInput[] = [];
  const seenAppointments = new Set<CdmDutyHolderRoleKey>();

  for (const row of input) {
    const organisationName = row.organisationName.trim();
    if (!organisationName) continue;
    if (isAppointmentRole(row.role)) {
      if (seenAppointments.has(row.role)) continue;
      seenAppointments.add(row.role);
    }
    normalized.push({
      id: row.id,
      role: row.role,
      organisationName,
      companyNumber: blank(row.companyNumber),
      contactName: blank(row.contactName),
      contactEmail: blank(row.contactEmail),
      contactPhone: blank(row.contactPhone),
    });
  }

  return normalized;
}

export function validateDutyHolders(input: CdmDutyHolderInput[]): {
  ok: boolean;
  message: string | null;
  holders: CdmDutyHolderInput[];
} {
  const holders = normalizeDutyHolders(input);
  const invalidEmail = holders.find(
    (holder) => holder.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holder.contactEmail),
  );
  if (invalidEmail) {
    return { ok: false, message: "Enter a valid contact email address.", holders };
  }
  const client = holders.find((holder) => holder.role === "CLIENT");
  if (!client) {
    return {
      ok: false,
      message: "Client organisation is required (CDM 2015 — the person for whom the project is carried out).",
      holders,
    };
  }
  return { ok: true, message: null, holders };
}

export function clientNameFromDutyHolders(input: CdmDutyHolderInput[]): string | null {
  return normalizeDutyHolders(input).find((holder) => holder.role === "CLIENT")?.organisationName ?? null;
}

export function mergeDutyHoldersForForm(
  existing: CdmDutyHolderInput[],
  fallbackClientName?: string | null,
): CdmDutyHolderInput[] {
  const byAppointment = new Map<CdmDutyHolderRoleKey, CdmDutyHolderInput>();
  const extras: CdmDutyHolderInput[] = [];
  for (const row of existing) {
    if (isAppointmentRole(row.role) && !byAppointment.has(row.role)) {
      byAppointment.set(row.role, row);
    } else if (!isAppointmentRole(row.role)) {
      extras.push(row);
    }
  }
  const appointments = emptyAppointmentHolders(fallbackClientName).map((holder) => {
    const saved = byAppointment.get(holder.role);
    return saved ?? holder;
  });
  return [...appointments, ...extras];
}

