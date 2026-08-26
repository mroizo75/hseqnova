import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getAdminDb } from "@/lib/supabase/admin";
import { isCoreModule, tenantHasModule } from "@/lib/tenant-modules";

export class ModuleNotEntitledError extends Error {
  readonly code = "MODULE_NOT_ENTITLED";
  constructor(moduleKey: string) {
    super(`This company does not have the ${moduleKey} module. Contact HSEQ Nova to add it.`);
    this.name = "ModuleNotEntitledError";
  }
}

async function loadEnabledModuleKeys(tenantId: string): Promise<string[]> {
  const { data, error } = await getAdminDb()
    .from("TenantModule")
    .select("moduleKey")
    .eq("tenantId", tenantId)
    .in("status", ["ACTIVE", "TRIAL"]);
  if (error) {
    throw { code: "MODULE_LOOKUP_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => String(row.moduleKey));
}

export async function requireTenantModule(moduleKey: string): Promise<void> {
  if (isCoreModule(moduleKey)) {
    return;
  }

  const { tenantId } = await getRequiredTenantContext();
  const enabled = await loadEnabledModuleKeys(tenantId);
  if (!tenantHasModule(enabled, moduleKey)) {
    throw new ModuleNotEntitledError(moduleKey);
  }
}

export async function getEnabledModuleKeys(tenantId: string): Promise<string[]> {
  return loadEnabledModuleKeys(tenantId);
}
