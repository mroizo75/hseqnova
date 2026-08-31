import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrequalificationChecklist } from "@/features/contractors/components/prequalification-checklist";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewContractorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/contractors"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to contractors
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Register Contractor</h1>
        <p className="text-sm text-muted-foreground">
          Identify the job and record the evidence you used to select this contractor.
        </p>
      </div>
      <PrequalificationChecklist />
    </div>
  );
}
