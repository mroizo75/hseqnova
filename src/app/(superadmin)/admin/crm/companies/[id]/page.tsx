import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeAllCrm, canSeeOrganisations, isSalesStaff } from "@/lib/platform-access";
import { loadCrmCompanyDetail, loadCrmSalespeople } from "@/server/queries/crm.queries";
import { CrmActivityForm } from "@/features/crm/components/crm-activity-form";
import { CrmAssignOwnerForm } from "@/features/crm/components/crm-assign-owner-form";
import { CrmCompleteTaskButton, CrmTaskForm } from "@/features/crm/components/crm-task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { CRM_SOURCE_LABELS, CRM_STAGE_LABELS, formatGbp } from "@/features/crm/lib/labels";
import type { CrmDealStage, CrmSource } from "@/features/crm/lib/types";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

export default async function CrmCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const { id } = await params;
  const detail = await loadCrmCompanyDetail(staff, id);
  if (!detail) {
    notFound();
  }
  const salespeople = canSeeAllCrm(staff) ? await loadCrmSalespeople() : [];
  const org = detail.organisation as Record<string, unknown>;
  const openDeal = detail.deals.find((deal) =>
    ["NEW", "QUALIFIED", "DEMO", "PROPOSAL", "NEGOTIATION"].includes(String(deal.stage)),
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/admin/crm/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to companies
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{String(org.name)}</h1>
            <p className="text-muted-foreground">
              {CRM_SOURCE_LABELS[String(org.source) as CrmSource] ?? String(org.source)}
              {org.companyNumber ? ` · ${org.companyNumber}` : ""}
            </p>
          </div>
          {org.tenantId && canSeeOrganisations(staff) ? (
            <Button asChild variant="outline" className="bg-transparent">
              <Link href={`/admin/tenants/${org.tenantId}`}>Open organisation</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {canSeeAllCrm(staff) && (
        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <CrmAssignOwnerForm
              organisationId={id}
              dealId={openDeal ? String(openDeal.id) : undefined}
              currentOwnerId={(org.ownerId as string | null) ?? null}
              salespeople={salespeople}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals</p>
            ) : (
              detail.deals.map((deal) => (
                <Link
                  key={String(deal.id)}
                  href={`/admin/crm/deals/${deal.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{String(deal.title)}</p>
                    <p className="text-xs text-muted-foreground">
                      {CRM_STAGE_LABELS[String(deal.stage) as CrmDealStage]}
                    </p>
                  </div>
                  <span className="text-sm">{formatGbp(Number(deal.valueGbp ?? 0))}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts</p>
            ) : (
              detail.contacts.map((contact) => (
                <div key={String(contact.id)}>
                  <p className="font-medium">
                    {String(contact.name)}{" "}
                    {contact.isPrimary ? <Badge variant="secondary">Primary</Badge> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contact.email ? String(contact.email) : "No email"}
                    {contact.phone ? ` · ${contact.phone}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CrmTaskForm organisationId={id} dealId={openDeal ? String(openDeal.id) : undefined} />
          {detail.tasks.map((task) => (
            <div key={String(task.id)} className="flex items-center justify-between gap-3 border-b py-2">
              <div>
                <p className="text-sm font-medium">{String(task.title)}</p>
                <p className="text-xs text-muted-foreground">
                  {task.dueAt
                    ? format(new Date(String(task.dueAt)), "d MMM yyyy", { locale: enGB })
                    : "No due date"}{" "}
                  · {task.status === "DONE" ? "Done" : "Open"}
                </p>
              </div>
              {task.status !== "DONE" && <CrmCompleteTaskButton taskId={String(task.id)} />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CrmActivityForm organisationId={id} dealId={openDeal ? String(openDeal.id) : undefined} />
          {detail.activities.map((activity) => (
            <div key={String(activity.id)} className="border-b py-3 last:border-0">
              <p className="text-sm whitespace-pre-wrap">{String(activity.note)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activity.createdBy?.name || activity.createdBy?.email || "Staff"} ·{" "}
                {format(new Date(String(activity.createdAt)), "d MMM yyyy HH:mm", { locale: enGB })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
