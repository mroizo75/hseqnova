import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TenantOnboardingForm } from "@/features/admin/components/tenant-onboarding-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { canProvisionEnterprise } from "@/lib/platform-access";

export default async function NewTenantPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser;

  if (!user?.isSuperAdmin && !user?.isSupport && !user?.isSalesManager) {
    redirect("/admin/crm");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tenants">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to organisations
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Register organisation</h1>
        <p className="text-muted-foreground">
          Create a company HSEQ workspace and add it to the sales pipeline. This is not a group or insurer portal.
        </p>
        {canProvisionEnterprise(user) ? (
          <p className="mt-2 text-sm">
            To create a corporate group, insurer or network, use{" "}
            <Link className="underline" href="/admin/enterprises">
              Enterprise organisations
            </Link>
            .
          </p>
        ) : null}
      </div>

      <TenantOnboardingForm salesRep={session?.user?.name || session?.user?.email || "HSEQ Nova"} />
    </div>
  );
}
