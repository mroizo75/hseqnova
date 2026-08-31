import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import type { WhistleblowMessage, Whistleblowing } from "@prisma/client";

export type WhistleblowingListItem = Whistleblowing;
export type WhistleblowingDetail = Whistleblowing & {
  messages: WhistleblowMessage[];
};

function asReport(row: Record<string, unknown>): Whistleblowing {
  return row as unknown as Whistleblowing;
}

function asMessage(row: Record<string, unknown>): WhistleblowMessage {
  return row as unknown as WhistleblowMessage;
}

export function nextWhistleblowingCaseNumber(latest: string | null | undefined, year: number): string {
  const prefix = `WB-${year}-`;
  const parsed = latest?.startsWith(prefix) ? Number.parseInt(latest.slice(prefix.length), 10) : Number.NaN;
  const nextSeq = Number.isFinite(parsed) && parsed > 0 ? parsed + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

export async function loadWhistleblowingList(tenantId: string): Promise<WhistleblowingListItem[]> {
  const { data, error } = await getAdminDb()
    .from("Whistleblowing")
    .select("*")
    .eq("tenantId", tenantId)
    .order("receivedAt", { ascending: false });

  if (error) {
    throw { code: "WHISTLEBLOWING_LIST_FAILED", message: error.message };
  }

  return ((data ?? []) as Record<string, unknown>[]).map(asReport);
}

async function loadMessages(
  whistleblowingId: string,
  opts?: { publicOnly?: boolean },
): Promise<WhistleblowMessage[]> {
  let query = getAdminDb()
    .from("WhistleblowMessage")
    .select("*")
    .eq("whistleblowingId", whistleblowingId)
    .order("createdAt", { ascending: true });

  if (opts?.publicOnly) {
    query = query.eq("isInternal", false);
  }

  const { data, error } = await query;
  if (error) {
    throw { code: "WHISTLEBLOWING_MESSAGES_FAILED", message: error.message };
  }
  return ((data ?? []) as Record<string, unknown>[]).map(asMessage);
}

export async function loadWhistleblowingDetail(
  tenantId: string,
  id: string,
): Promise<WhistleblowingDetail | null> {
  const { data, error } = await getAdminDb()
    .from("Whistleblowing")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "WHISTLEBLOWING_DETAIL_FAILED", message: error.message };
  }
  if (!data) return null;

  return {
    ...asReport(data as Record<string, unknown>),
    messages: await loadMessages(id),
  };
}

export async function loadWhistleblowingByCase(input: {
  caseNumber: string;
  accessCode: string;
}): Promise<WhistleblowingDetail | null> {
  const { data, error } = await getAdminDb()
    .from("Whistleblowing")
    .select("*")
    .eq("caseNumber", input.caseNumber)
    .eq("accessCode", input.accessCode)
    .maybeSingle();

  if (error) {
    throw { code: "WHISTLEBLOWING_TRACK_FAILED", message: error.message };
  }
  if (!data) return null;

  const report = asReport(data as Record<string, unknown>);
  return {
    ...report,
    messages: await loadMessages(report.id, { publicOnly: true }),
  };
}

export async function markWhistleblowMessagesReadByReporter(whistleblowingId: string): Promise<void> {
  await getAdminDb()
    .from("WhistleblowMessage")
    .update({ readByReporter: true })
    .eq("whistleblowingId", whistleblowingId)
    .eq("readByReporter", false);
}

export async function createWhistleblowingReport(input: {
  tenantId: string;
  accessCode: string;
  category: string;
  title: string;
  description: string;
  occurredAt?: string | null;
  location?: string | null;
  involvedPersons?: string | null;
  witnesses?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  isAnonymous: boolean;
}): Promise<Whistleblowing> {
  const db = getAdminDb();
  const year = new Date().getFullYear();
  const prefix = `WB-${year}-`;
  const now = new Date().toISOString();

  const { data: latest } = await db
    .from("Whistleblowing")
    .select("caseNumber")
    .eq("tenantId", input.tenantId)
    .like("caseNumber", `${prefix}%`)
    .order("caseNumber", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNumber = nextWhistleblowingCaseNumber(
    (latest?.caseNumber as string | null | undefined) ?? null,
    year,
  );

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = createId();
    const { data, error } = await db
      .from("Whistleblowing")
      .insert({
        id,
        tenantId: input.tenantId,
        caseNumber: nextNumber,
        accessCode: input.accessCode,
        category: input.category,
        title: input.title,
        description: input.description,
        occurredAt: input.occurredAt ?? null,
        location: input.location ?? null,
        involvedPersons: input.involvedPersons ?? null,
        witnesses: input.witnesses ?? null,
        reporterName: input.reporterName ?? null,
        reporterEmail: input.reporterEmail ?? null,
        reporterPhone: input.reporterPhone ?? null,
        isAnonymous: input.isAnonymous,
        status: "RECEIVED",
        severity: "MEDIUM",
        receivedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .select("*")
      .single();

    if (!error && data) {
      await db.from("WhistleblowMessage").insert({
        id: createId(),
        whistleblowingId: id,
        sender: "SYSTEM",
        message: `Report received with case number ${nextNumber}. Use your access code to follow up.`,
        isInternal: false,
        readByReporter: false,
        createdAt: now,
      });
      return asReport(data as Record<string, unknown>);
    }

    if (error?.code === "23505") {
      const seq = Number.parseInt(nextNumber.slice(prefix.length), 10) + 1;
      nextNumber = `${prefix}${String(seq).padStart(3, "0")}`;
      continue;
    }

    throw { code: "WHISTLEBLOWING_CREATE_FAILED", message: error?.message ?? "Could not create the report" };
  }

  throw { code: "WHISTLEBLOWING_CREATE_FAILED", message: "Could not generate a unique case number" };
}

export async function updateWhistleblowingReport(input: {
  id: string;
  tenantId: string;
  patch: Record<string, unknown>;
}): Promise<WhistleblowingDetail | null> {
  const existing = await loadWhistleblowingDetail(input.tenantId, input.id);
  if (!existing) return null;

  const { error } = await getAdminDb()
    .from("Whistleblowing")
    .update({ ...input.patch, updatedAt: new Date().toISOString() })
    .eq("id", input.id)
    .eq("tenantId", input.tenantId);

  if (error) {
    throw { code: "WHISTLEBLOWING_UPDATE_FAILED", message: error.message };
  }

  return loadWhistleblowingDetail(input.tenantId, input.id);
}

export async function createWhistleblowMessage(input: {
  whistleblowingId: string;
  sender: "REPORTER" | "HANDLER" | "SYSTEM";
  senderUserId?: string | null;
  message: string;
  isInternal?: boolean;
}): Promise<WhistleblowMessage> {
  const now = new Date().toISOString();
  const { data, error } = await getAdminDb()
    .from("WhistleblowMessage")
    .insert({
      id: createId(),
      whistleblowingId: input.whistleblowingId,
      sender: input.sender,
      senderUserId: input.senderUserId ?? null,
      message: input.message,
      isInternal: input.isInternal ?? false,
      readByReporter: false,
      createdAt: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw { code: "WHISTLEBLOWING_MESSAGE_FAILED", message: error?.message ?? "Could not add the message" };
  }

  return asMessage(data as Record<string, unknown>);
}
