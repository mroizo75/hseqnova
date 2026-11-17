import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGbp } from "@/features/crm/lib/labels";
import { TrainingInvoiceForm } from "@/features/training-sales/components/training-invoice-form";
import { formatUkDate } from "@/features/training-sales/lib/follow-up";
import { defaultInvoiceDueDate } from "@/lib/invoice-lines";
import { getTrainingEngagement, getTrainingFollowUpMonths } from "@/server/queries/training-sales.queries";

const STATUS_LABEL = {
  ENQUIRY: "Enquiry",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
} as const;

export default async function TrainingBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const { id } = await params;
  const [engagement, followUpMonths] = await Promise.all([
    getTrainingEngagement(staff, id),
    getTrainingFollowUpMonths(),
  ]);
  if (!engagement) {
    notFound();
  }
  const value = engagement.unitPriceGbp ? engagement.unitPriceGbp * engagement.delegateCount : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/crm/training" className="hover:underline">Training</Link>
          </p>
          <h1 className="text-3xl font-bold">{engagement.organisationName}</h1>
          <p className="text-muted-foreground">
            {engagement.courseTitle} · {STATUS_LABEL[engagement.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/admin/crm/companies/${engagement.organisationId}`} className="underline underline-offset-4">
            Company
          </Link>
          {engagement.dealId && (
            <Link href={`/admin/crm/deals/${engagement.dealId}`} className="underline underline-offset-4">
              Deal
            </Link>
          )}
          {engagement.hostedInvoiceUrl && (
            <a href={engagement.hostedInvoiceUrl} className="underline underline-offset-4" target="_blank" rel="noreferrer">
              Stripe invoice
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">People</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{engagement.delegateCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expires</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {engagement.validUntil ? formatUkDate(engagement.validUntil) : "Set the date"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Contact from</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {engagement.followUpAt ? formatUkDate(engagement.followUpAt) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ex VAT</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{value ? formatGbp(value) : "—"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            {engagement.contactName} · {engagement.contactEmail}
            {engagement.contactPhone ? ` · ${engagement.contactPhone}` : ""}
            {engagement.preferredDate ? ` · preferred ${formatUkDate(engagement.preferredDate)}` : ""}
          </CardDescription>
        </CardHeader>
        {engagement.siteNotes && (
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{engagement.siteNotes}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date, competence period and invoice</CardTitle>
          <CardDescription>
            Saving the course date writes the expiry into the CRM and opens a task {followUpMonths} months before it.
            The invoice is sent by Stripe, with VAT added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingInvoiceForm
            engagement={engagement}
            followUpMonths={followUpMonths}
            defaultDueDate={defaultInvoiceDueDate()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
