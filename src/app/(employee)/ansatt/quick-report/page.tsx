import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuickNearMissForm } from "@/features/incidents/components/quick-near-miss-form";

export default async function QuickReportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Link
            href="/ansatt"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Report a near miss</h1>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <QuickNearMissForm
          tenantId={session.user.tenantId}
          reportedBy={session.user.id}
        />
      </main>
    </div>
  );
}
