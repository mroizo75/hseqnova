import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ExposureRegisterFormClient } from "../exposure-register-form-client";
import {
  loadActiveChemicalsForSelect,
  loadEmployeesForTenant,
  loadOpenRisksForSelect,
  loadRuhReportsForSelect,
} from "@/server/queries/exposure-register.queries";

export default async function NewExposureRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ chemicalId?: string }>;
}) {
  const { chemicalId: preselectedChemicalId } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  const [employees, chemicals, ruhReports, risks] = await Promise.all([
    loadEmployeesForTenant(tenantId),
    loadActiveChemicalsForSelect(tenantId),
    loadRuhReportsForSelect(tenantId),
    loadOpenRisksForSelect(tenantId),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/exposure-register"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to health records
        </Link>
        <h1 className="text-2xl font-bold">Record a new exposure</h1>
        <p className="text-sm text-muted-foreground">
          Complete all required fields (*). National Insurance numbers are stored encrypted.
        </p>
      </div>

      <ExposureRegisterFormClient
        employees={employees}
        chemicals={chemicals}
        ruhReports={ruhReports}
        risks={risks}
        preselectedChemicalId={preselectedChemicalId}
      />
    </div>
  );
}
