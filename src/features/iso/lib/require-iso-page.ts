import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { getEnabledModuleKeys } from "@/lib/require-tenant-module";
import { tenantHasIsoPack } from "@/lib/tenant-modules";

export async function requireIsoPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }
  const enabledModules = await getEnabledModuleKeys(auth.tenantId);
  if (!tenantHasIsoPack(enabledModules)) {
    redirect("/dashboard/settings");
  }
  return { auth, enabledModules };
}
