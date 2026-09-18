import { getAuthContext } from "@/lib/server-authorization";
import { getEnabledModuleKeys } from "@/lib/require-tenant-module";
import { tenantHasIsoPack } from "@/lib/tenant-modules";

export async function IsoWhenEnabled({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) return null;
  const keys = await getEnabledModuleKeys(auth.tenantId);
  if (!tenantHasIsoPack(keys)) return null;
  return <>{children}</>;
}
