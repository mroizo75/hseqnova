import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeAllCrm, isSalesStaff } from "@/lib/platform-access";
import { loadCrmSalespeople } from "@/server/queries/crm.queries";
import { CrmCreateCompanyForm } from "@/features/crm/components/crm-create-company-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default async function NewCrmCompanyPage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const salespeople = canSeeAllCrm(staff) ? await loadCrmSalespeople() : [];

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/admin/crm/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to companies
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add company</h1>
        <p className="text-muted-foreground">Creates a company, primary contact and a new-lead deal</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <CrmCreateCompanyForm canAssignOwner={canSeeAllCrm(staff)} salespeople={salespeople} />
        </CardContent>
      </Card>
    </div>
  );
}
