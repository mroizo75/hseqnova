import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGbp } from "@/features/crm/lib/labels";
import { TrainingFollowUpSettingForm } from "@/features/training-sales/components/training-follow-up-setting-form";
import { formatUkDate } from "@/features/training-sales/lib/follow-up";
import { getTrainingFollowUpMonths, listTrainingEngagements } from "@/server/queries/training-sales.queries";

const STATUS_LABEL = {
  ENQUIRY: "Enquiry",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
} as const;

export default async function TrainingBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const filter = (await searchParams).filter ?? "open";
  let rows: Awaited<ReturnType<typeof listTrainingEngagements>> = [];
  let followUpMonths = 4;
  let setupMessage: string | null = null;
  try {
    [rows, followUpMonths] = await Promise.all([
      listTrainingEngagements(staff),
      getTrainingFollowUpMonths(),
    ]);
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
    setupMessage = /does not exist|schema cache|TrainingEngagement|PlatformSetting/i.test(message)
      ? "Apply supabase/migrations/0035_training_sales.sql in the Supabase SQL editor, then reload this page."
      : message || "Could not load training bookings.";
  }
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const visible = rows.filter((row) => {
    if (filter === "needs-date") return row.status === "ENQUIRY" && !row.courseDate;
    if (filter === "contact") return row.status !== "CANCELLED" && Boolean(row.followUpAt && row.followUpAt <= soon);
    if (filter === "invoiced") return row.status === "INVOICED";
    if (filter === "paid") return row.status === "PAID";
    return row.status !== "CANCELLED";
  });
  const canEditSetting = Boolean(staff.isSuperAdmin || staff.isSalesManager);
  const contactDue = rows.filter((row) => row.status !== "CANCELLED" && row.followUpAt && row.followUpAt <= today).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Training</h1>
          <p className="text-muted-foreground">
            Course bookings, Stripe invoices and the contact {followUpMonths} months before competence expires.
            {contactDue > 0 ? ` ${contactDue} need a call now.` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/crm/training/new">Record a booking</Link>
        </Button>
      </div>

      {setupMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Training is not in the database yet</CardTitle>
            <CardDescription>{setupMessage}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ["open", "Open"],
          ["needs-date", "Needs a date"],
          ["contact", "Contact window"],
          ["invoiced", "Invoiced"],
          ["paid", "Paid"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={key === "open" ? "/admin/crm/training" : `/admin/crm/training?filter=${key}`}
            className={`rounded-full border px-3 py-1 ${filter === key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{visible.length} bookings</CardTitle>
          <CardDescription>Customer, course and competence period live on the company in the CRM.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings in this view.</p>
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Company</th>
                  <th className="py-2 pr-3 font-medium">Course</th>
                  <th className="py-2 pr-3 font-medium">People</th>
                  <th className="py-2 pr-3 font-medium">Course date</th>
                  <th className="py-2 pr-3 font-medium">Expires</th>
                  <th className="py-2 pr-3 font-medium">Contact from</th>
                  <th className="py-2 pr-3 font-medium">Value</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <Link href={`/admin/crm/training/${row.id}`} className="font-medium hover:underline">
                        {row.organisationName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.contactName}</p>
                    </td>
                    <td className="py-3 pr-3">{row.courseTitle}</td>
                    <td className="py-3 pr-3">{row.delegateCount}</td>
                    <td className="py-3 pr-3">{row.courseDate ? formatUkDate(row.courseDate) : "Not set"}</td>
                    <td className="py-3 pr-3">{row.validUntil ? formatUkDate(row.validUntil) : `${row.validityMonths} months`}</td>
                    <td className="py-3 pr-3">{row.followUpAt ? formatUkDate(row.followUpAt) : "Set the course date"}</td>
                    <td className="py-3 pr-3">
                      {row.unitPriceGbp ? formatGbp(row.unitPriceGbp * row.delegateCount) : "—"}
                    </td>
                    <td className="py-3">{STATUS_LABEL[row.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Renewal contact</CardTitle>
          <CardDescription>
            Sales is tasked this many months before a competence record expires. The minimum is 4 months, so there is time to book the refresher.
            {canEditSetting ? "" : " A sales manager changes this in settings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canEditSetting ? (
            <TrainingFollowUpSettingForm months={followUpMonths} />
          ) : (
            <p className="text-sm">{followUpMonths} months before expiry.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
