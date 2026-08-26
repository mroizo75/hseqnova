import { getAdminDb } from "@/lib/supabase/admin";
import {
  resolveProjectIdFromReference,
  type ProjectReferenceLookups,
} from "@/lib/incident-project-reference";

/**
 * Lookup is locked to one tenant so a reference cannot hit a project in another
 * organisation (UK GDPR / DPA 2018). Matches the typed reference and the form
 * without separators so similar codes or order numbers can still link.
 */
export function createProjectReferenceLookups(tenantId: string): ProjectReferenceLookups {
  return {
    async findProjectsByReference(reference) {
      const withoutSeparators = reference.replace(/[\s\-_/.]/g, "");
      const values = Array.from(new Set([reference, withoutSeparators]));
      const db = getAdminDb();

      const [{ data: byCode }, { data: byOrder }] = await Promise.all([
        db
          .from("Project")
          .select("id, code, orderNumber")
          .eq("tenantId", tenantId)
          .in("code", values)
          .limit(5),
        db
          .from("Project")
          .select("id, code, orderNumber")
          .eq("tenantId", tenantId)
          .in("orderNumber", values)
          .limit(5),
      ]);

      const merged = new Map<string, { id: string; code: string | null; orderNumber: string | null }>();
      for (const row of [...(byCode ?? []), ...(byOrder ?? [])]) {
        merged.set(row.id as string, {
          id: row.id as string,
          code: (row.code as string | null) ?? null,
          orderNumber: (row.orderNumber as string | null) ?? null,
        });
      }
      return Array.from(merged.values()).slice(0, 5);
    },
  };
}

export async function resolveIncidentProjectId(input: {
  tenantId: string;
  projectId: string | null;
  projectReference: string | null;
}): Promise<string | null> {
  if (input.projectId) return input.projectId;

  return resolveProjectIdFromReference(
    input.projectReference,
    createProjectReferenceLookups(input.tenantId)
  );
}
