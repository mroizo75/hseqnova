import type { SupabaseClient } from "@supabase/supabase-js";

type AdminDb = Pick<SupabaseClient, "from">;

/** Personal records that should be removed with the account (UK GDPR erasure). */
export const USER_DELETE_ROW_CLEARS = [
  { table: "HandbookSignature", column: "userId" },
  { table: "EmployeeReview", column: "employeeId" },
] as const;

/**
 * Organisation records that must survive. Columns are nulled before DELETE
 * because several FKs are still ON DELETE RESTRICT until migration 0029.
 */
export const USER_DELETE_NULL_CLEARS = [
  { table: "Risk", column: "ownerId" },
  { table: "InvoiceExport", column: "exportedById" },
  { table: "BlogPost", column: "authorId" },
  { table: "SupportTicket", column: "createdById" },
  { table: "SupportMessage", column: "senderUserId" },
  { table: "Project", column: "createdById" },
  { table: "ConstructionRosterDailyCheck", column: "checkedById" },
  { table: "CrmActivity", column: "createdById" },
  { table: "CrmTask", column: "assignedToId" },
  { table: "EmployeeReview", column: "reviewerId" },
  { table: "IsoClauseAssessment", column: "responsibleUserId" },
  { table: "Measure", column: "responsibleId" },
  { table: "CustomerFeedback", column: "recordedById" },
] as const;

const CONSTRAINT_LABEL: Record<string, string> = {
  HandbookSignature_userId_fkey: "health and safety policy signatures",
  EmployeeReview_employeeId_fkey: "employee reviews",
  EmployeeReview_reviewerId_fkey: "reviews they conducted",
  Risk_ownerId_fkey: "risk assessments they own",
  InvoiceExport_exportedById_fkey: "invoice exports",
  BlogPost_authorId_fkey: "blog posts",
  SupportTicket_createdById_fkey: "support tickets",
  SupportMessage_senderUserId_fkey: "support messages",
  Project_createdById_fkey: "projects they created",
  ConstructionRosterDailyCheck_checkedById_fkey: "construction roster checks",
  CrmActivity_createdById_fkey: "CRM activity",
  CrmTask_assignedToId_fkey: "CRM tasks",
  Measure_responsibleId_fkey: "actions they own",
  CustomerFeedback_recordedById_fkey: "customer feedback",
};

export function actionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function userDeleteErrorMessage(error: unknown): string {
  const raw = actionErrorMessage(error, "Could not delete the user");
  const constraint = raw.match(/constraint ["']([^"']+)["']/i)?.[1];
  if (constraint && CONSTRAINT_LABEL[constraint]) {
    return `This user is still linked to ${CONSTRAINT_LABEL[constraint]}, so the account was not deleted.`;
  }
  if (/foreign key|violates foreign key/i.test(raw)) {
    return "This user is still linked to other records, so the account was not deleted.";
  }
  return raw;
}

function postgresCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error && typeof (error as { code: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  return undefined;
}

/** Skip missing schema objects and NOT NULL until migration 0029 is applied. */
export function isSkippableDetachError(error: unknown): boolean {
  const code = postgresCode(error);
  if (code === "23502" || code === "42P01" || code === "42703") return true;
  const message = actionErrorMessage(error, "");
  return /null value in column|does not exist/i.test(message);
}

export async function detachUserReferences(db: AdminDb, userId: string): Promise<void> {
  for (const { table, column } of USER_DELETE_ROW_CLEARS) {
    const { error } = await db.from(table).delete().eq(column, userId);
    if (error && !isSkippableDetachError(error)) {
      throw error;
    }
  }

  for (const { table, column } of USER_DELETE_NULL_CLEARS) {
    const { error } = await db.from(table).update({ [column]: null }).eq(column, userId);
    if (error && !isSkippableDetachError(error)) {
      throw error;
    }
  }
}
