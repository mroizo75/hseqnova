import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

/**
 * Cron Execution Tracker
 *
 * Records start/completion/failure of every cron job for full auditability.
 * MHSWR 1999 reg. 5: employers must make appropriate arrangements —
 * proving that scheduled alerts actually ran is part of that duty.
 */

export interface CronTracker {
  executionId: string;
  succeed: (stats?: Record<string, unknown>) => Promise<void>;
  fail: (error: unknown) => Promise<void>;
}

export async function startCronExecution(jobName: string): Promise<CronTracker> {
  const executionId = createId();
  const startedAt = new Date().toISOString();

  await getAdminDb().from("CronExecution").insert({
    id: executionId,
    jobName,
    status: "RUNNING",
    startedAt,
  });

  const start = Date.now();

  return {
    executionId,

    async succeed(stats?: Record<string, unknown>) {
      const durationMs = Date.now() - start;
      await getAdminDb()
        .from("CronExecution")
        .update({
          status: "SUCCESS",
          completedAt: new Date().toISOString(),
          durationMs,
          stats: stats ?? null,
        })
        .eq("id", executionId);
    },

    async fail(error: unknown) {
      const durationMs = Date.now() - start;
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : JSON.stringify(error);

      await getAdminDb()
        .from("CronExecution")
        .update({
          status: "FAILED",
          completedAt: new Date().toISOString(),
          durationMs,
          error: message,
        })
        .eq("id", executionId);
    },
  };
}

export async function getCronExecutions(
  jobName?: string,
  limit = 50,
): Promise<
  Array<{
    id: string;
    jobName: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    stats: Record<string, unknown> | null;
    error: string | null;
  }>
> {
  let query = getAdminDb()
    .from("CronExecution")
    .select("*")
    .order("startedAt", { ascending: false })
    .limit(limit);

  if (jobName) query = query.eq("jobName", jobName);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to read cron executions:", error);
    return [];
  }
  return data ?? [];
}
