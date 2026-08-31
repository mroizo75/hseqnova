import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { FormFiller } from "@/components/shared/form-filler";
import { loadInspectionFormForFill, parseParticipantIds } from "@/server/queries/inspections.queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ inspectionId: string }>;
}

export default async function FillInspectionFormPage({ params }: PageProps) {
  const { inspectionId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const filled = await loadInspectionFormForFill(session.user.tenantId, inspectionId);
  if (!filled) {
    notFound();
  }

  const participantIds = parseParticipantIds(filled.inspection.participants);
  const mayFill =
    filled.inspection.conductedBy === session.user.id ||
    participantIds.includes(session.user.id);
  if (!mayFill) {
    notFound();
  }

  return (
    <FormFiller
      form={filled.form}
      userId={session.user.id}
      tenantId={session.user.tenantId}
      inspectionId={filled.inspection.id}
      returnUrl="/ansatt/vernerunder"
    />
  );
}
