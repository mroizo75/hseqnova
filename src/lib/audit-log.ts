import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

/**
 * Audit Log Utility
 *
 * Centralised logging of all changes for ISO 9001 / ISO 45001 compliance.
 * Every change is documented with:
 * - Who:   userId
 * - What:  action (e.g. "DOCUMENT_CREATED")
 * - Where: resource (e.g. "Document:abc123")
 * - When:  timestamp (automatic)
 * - Detail: metadata (JSON)
 *
 * All read and write operations go through Supabase REST API.
 */

export type AuditAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "APPROVED"
  | "COMPLETED"
  | "CLOSED"
  | "REOPENED"
  | "SUBMITTED"
  | "SIGNED"
  | "EVALUATED"
  | "ASSIGNED"
  | "STATUS_CHANGED"
  | string;

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export class AuditLog {
  static async log(
    tenantId: string,
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await getAdminDb().from("AuditLog").insert({
        id: createId(),
        tenantId,
        userId,
        action,
        resource: `${resource}:${resourceId}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  static async getLogsForTenant(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
      userId?: string;
      resource?: string;
      from?: string;
      to?: string;
    },
  ): Promise<AuditLogEntry[]> {
    let query = getAdminDb()
      .from("AuditLog")
      .select("*")
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false })
      .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 100) - 1);

    if (options?.action) query = query.eq("action", options.action);
    if (options?.userId) query = query.eq("userId", options.userId);
    if (options?.resource) query = query.ilike("resource", `%${options.resource}%`);
    if (options?.from) query = query.gte("createdAt", options.from);
    if (options?.to) query = query.lte("createdAt", options.to);

    const { data, error } = await query;
    if (error) {
      console.error("Failed to read audit logs:", error);
      return [];
    }
    return (data ?? []) as AuditLogEntry[];
  }

  static async getLogsForResource(resourceId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await getAdminDb()
      .from("AuditLog")
      .select("*")
      .ilike("resource", `%${resourceId}%`)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Failed to read resource audit logs:", error);
      return [];
    }
    return (data ?? []) as AuditLogEntry[];
  }

  static async getLogsForUser(userId: string, limit = 100): Promise<AuditLogEntry[]> {
    const { data, error } = await getAdminDb()
      .from("AuditLog")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to read user audit logs:", error);
      return [];
    }
    return (data ?? []) as AuditLogEntry[];
  }

  /**
   * Delete old logs (UK GDPR compliance).
   * ISO 9001: documented information shall be retained but may be purged.
   */
  static async deleteOldLogs(daysToKeep = 365): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const { error } = await getAdminDb()
      .from("AuditLog")
      .delete()
      .lt("createdAt", cutoff.toISOString());

    if (error) console.error("Failed to delete old audit logs:", error);
  }
}

/**
 * withAuditLog — fire-and-forget audit wrapper for server actions / API routes.
 *
 * Usage:
 *   await withAuditLog(tenantId, userId, "Measure", measureId, "CREATED", { title });
 *   await withAuditLog(tenantId, userId, "Incident", id, "UPDATED", { changedFields });
 */
export async function withAuditLog(
  tenantId: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  action: AuditAction,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const fullAction = `${resourceType.toUpperCase()}_${action}`;
  await AuditLog.log(tenantId, userId, fullAction, resourceType, resourceId, metadata);
}
