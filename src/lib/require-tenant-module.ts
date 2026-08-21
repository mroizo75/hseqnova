import { getRequiredTenantContext } from "@/lib/tenant-context";
import { prisma } from "@/lib/db";
import { isCoreModule, tenantHasModule } from "@/lib/tenant-modules";

export class ModuleNotEntitledError extends Error {
  readonly code = "MODULE_NOT_ENTITLED";
  constructor(moduleKey: string) {
    super(`This company does not have the ${moduleKey} module. Contact HSEQ Nova to add it.`);
    this.name = "ModuleNotEntitledError";
  }
}

export async function requireTenantModule(moduleKey: string): Promise<void> {
  if (isCoreModule(moduleKey)) {
    return;
  }

  const { tenantId } = await getRequiredTenantContext();
  const rows = await prisma.tenantModule.findMany({
    where: { tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
    select: { moduleKey: true },
  });
  const enabled = rows.map((row) => row.moduleKey);
  if (!tenantHasModule(enabled, moduleKey)) {
    throw new ModuleNotEntitledError(moduleKey);
  }
}

export async function getEnabledModuleKeys(tenantId: string): Promise<string[]> {
  const rows = await prisma.tenantModule.findMany({
    where: { tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
    select: { moduleKey: true },
  });
  return rows.map((row) => row.moduleKey);
}
