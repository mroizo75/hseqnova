import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { getEnabledModuleKeys } from "@/lib/require-tenant-module";
import { tenantHasIsoPack } from "@/lib/tenant-modules";

/** ISO 6.2 objectives — offered when the ISO 45001 & 9001 pack is on. */
export default async function GoalsLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }
  const enabled = await getEnabledModuleKeys(auth.tenantId);
  if (!tenantHasIsoPack(enabled)) {
    redirect("/dashboard");
  }
  return children;
}
