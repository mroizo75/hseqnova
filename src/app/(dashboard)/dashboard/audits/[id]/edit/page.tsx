import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { loadAudit, loadTenantAuditUsers } from "@/server/queries/audits.queries";
import { Button } from "@/components/ui/button";
import { AuditForm } from "@/features/audits/components/audit-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const audit = await loadAudit(id, auth.tenantId);
  if (!audit) {
    return <div>Audit not found</div>;
  }

  const tenantUsers = await loadTenantAuditUsers(auth.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/audits/${audit.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to audit
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit audit</h1>
        <p className="text-muted-foreground">{audit.title}</p>
      </div>

      <AuditForm tenantId={auth.tenantId} users={tenantUsers} audit={audit} mode="edit" />
    </div>
  );
}
