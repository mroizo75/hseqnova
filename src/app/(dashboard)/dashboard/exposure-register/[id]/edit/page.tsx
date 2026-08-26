import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ExposureRegisterFormClient } from "../../exposure-register-form-client";
import {
  loadActiveChemicalsForSelect,
  loadEmployeesForTenant,
  loadExposureById,
  loadOpenRisksForSelect,
  loadRuhReportsForSelect,
} from "@/server/queries/exposure-register.queries";

export default async function EditExposureRegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  const [entry, employees, chemicals, ruhReports, risks] = await Promise.all([
    loadExposureById(id, tenantId, { decryptNi: true }),
    loadEmployeesForTenant(tenantId),
    loadActiveChemicalsForSelect(tenantId),
    loadRuhReportsForSelect(tenantId),
    loadOpenRisksForSelect(tenantId),
  ]);

  if (!entry) notFound();

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
        <h1 className="text-2xl font-bold">Edit exposure</h1>
        <p className="text-sm text-muted-foreground">
          {entry.employeeName} – {entry.exposureAgent}
        </p>
      </div>

      <ExposureRegisterFormClient employees={employees} chemicals={chemicals} ruhReports={ruhReports} risks={risks} existing={entry} />
    </div>
  );
}
