import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { loadAdminInvoices } from "@/server/queries/admin.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInvoiceDialog } from "@/features/admin/components/create-invoice-dialog";
import { InvoiceTable } from "@/features/admin/components/invoice-table";
import { InvoiceExportPanel } from "@/features/admin/components/invoice-export-panel";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/admin");

  const { invoices, tenants, exportHistory } = await loadAdminInvoices();

  const exportedInvoiceIds = Array.from(
    new Set(
      exportHistory.flatMap((row) => {
        try {
          return JSON.parse(String(row.invoiceIds)) as string[];
        } catch {
          return [];
        }
      }),
    ),
  );

  const stats = {
    pending: invoices.filter((invoice) => invoice.status === "PENDING").length,
    sent: invoices.filter((invoice) => invoice.status === "SENT").length,
    paid: invoices.filter((invoice) => invoice.status === "PAID").length,
    overdue: invoices.filter((invoice) => invoice.status === "OVERDUE").length,
    totalUnpaid: invoices
      .filter((invoice) => invoice.status === "SENT" || invoice.status === "OVERDUE")
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0),
    totalPaid: invoices
      .filter((invoice) => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Invoicing and Excel export
          </p>
        </div>
        <CreateInvoiceDialog tenants={tenants} />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUnpaid.toLocaleString("en-GB")}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid: {stats.totalPaid.toLocaleString("en-GB")}
            </p>
          </CardContent>
        </Card>
      </div>

      <InvoiceExportPanel history={exportHistory} exportedInvoiceIds={exportedInvoiceIds} />

      <InvoiceTable invoices={invoices as never} exportedInvoiceIds={exportedInvoiceIds} />
    </div>
  );
}
