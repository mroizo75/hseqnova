import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CreateDemoOrganisationForm } from "@/features/admin/components/create-demo-organisation-form";
import { SessionUser } from "@/types";

export const metadata = {
  title: "Create demo workspace | HSEQ Nova Admin",
};

export default async function CreateDemoPage() {
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
        <h1 className="text-3xl font-bold">Create demo workspace</h1>
        <p className="text-muted-foreground">
          Only staff in /admin can create demos. Choose the packs the company should try. After the demo they
          subscribe and pay in Stripe if they want to keep the workspace.
        </p>
      </div>
      <CreateDemoOrganisationForm />
    </div>
  );
}
