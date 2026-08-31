import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FormFiller } from "@/components/shared/form-filler";
import { loadInspectionFormForFill } from "@/server/queries/inspections.queries";

export const dynamic = "force-dynamic";

export default async function FillDashboardInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.user.tenantId) {
    redirect("/login");
  }

  const filled = await loadInspectionFormForFill(session.user.tenantId, id);
  if (!filled) {
    notFound();
  }

  return (
    <FormFiller
      form={filled.form}
      userId={session.user.id}
      tenantId={session.user.tenantId}
      inspectionId={filled.inspection.id}
      returnUrl={`/dashboard/inspections/${id}`}
    />
  );
}
