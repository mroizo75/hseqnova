import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { AuditLog } from "@/lib/audit-log";
import { getAdminDb } from "@/lib/supabase/admin";

/**
 * GET /api/audit-log
 *
 * Query parameters:
 *  - resource     — filter by resource type (e.g. "Incident")
 *  - resourceId   — filter by specific resource ID
 *  - action       — filter by action (e.g. "INCIDENT_CREATED")
 *  - userId       — filter by actor
 *  - from         — ISO date lower bound
 *  - to           — ISO date upper bound
 *  - limit        — max rows (default 50, max 200)
 *  - offset       — pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const params = request.nextUrl.searchParams;

    const resource = params.get("resource") ?? undefined;
    const resourceId = params.get("resourceId") ?? undefined;
    const action = params.get("action") ?? undefined;
    const userId = params.get("userId") ?? undefined;
    const from = params.get("from") ?? undefined;
    const to = params.get("to") ?? undefined;
    const limit = Math.min(Number(params.get("limit") ?? 50), 200);
    const offset = Number(params.get("offset") ?? 0);

    if (resourceId) {
      const logs = await AuditLog.getLogsForResource(resourceId);
      const enriched = await enrichWithUserNames(logs);
      return NextResponse.json({ data: enriched });
    }

    const logs = await AuditLog.getLogsForTenant(tenantId, {
      resource,
      action,
      userId,
      from,
      to,
      limit,
      offset,
    });

    const enriched = await enrichWithUserNames(logs);
    return NextResponse.json({ data: enriched });
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

async function enrichWithUserNames(
  logs: Awaited<ReturnType<typeof AuditLog.getLogsForResource>>,
) {
  if (logs.length === 0) return [];

  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
  if (userIds.length === 0) return logs.map((l) => ({ ...l, userName: null }));

  const { data: users } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", userIds);

  const userMap = new Map(
    (users ?? []).map((u: { id: string; name: string | null; email: string }) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  return logs.map((log) => ({
    ...log,
    userName: userMap.get(log.userId) ?? null,
    parsedMetadata: log.metadata ? safeJsonParse(log.metadata) : null,
  }));
}

function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
