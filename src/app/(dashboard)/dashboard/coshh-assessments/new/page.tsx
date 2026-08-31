import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadChemicalsForTenant } from "@/server/queries/chemicals.queries";
import { CoshhAssessmentForm } from "@/features/chemicals/components/coshh-assessment-form";

export default async function NewCoshhAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ chemicalId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const params = await searchParams;
  const chemicals = await loadChemicalsForTenant(session.user.tenantId, {
    status: "ACTIVE",
  });
  const options = chemicals
    .slice()
    .sort((a, b) => a.productName.localeCompare(b.productName, "en-GB"))
    .map((row) => ({ id: row.id, productName: row.productName }));
  const initialChemicalId = options.some((row) => row.id === params.chemicalId)
    ? params.chemicalId
    : undefined;

  return (
    <CoshhAssessmentForm chemicals={options} initialChemicalId={initialChemicalId} />
  );
}
