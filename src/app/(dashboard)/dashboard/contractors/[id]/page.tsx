import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getContractor } from "@/server/actions/contractor.actions";
import { PrequalificationReview } from "@/features/contractors/components/prequalification-review";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const contractor = await getContractor(id);
  if (!contractor) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl w-full min-w-0">
      <div>
        <Link
          href="/dashboard/contractors"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to contractors
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Pre-Qualification Review</h1>
        <p className="text-sm text-muted-foreground">
          Review contractor details and approve or reject pre-qualification.
        </p>
      </div>
      <PrequalificationReview contractor={contractor} />
    </div>
  );
}
