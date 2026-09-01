import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeAllCrm, isSalesStaff } from "@/lib/platform-access";
import { loadCrmDealDetail, loadCrmSalespeople } from "@/server/queries/crm.queries";
import { CrmActivityForm } from "@/features/crm/components/crm-activity-form";
import { CrmAssignOwnerForm } from "@/features/crm/components/crm-assign-owner-form";
import { CrmDealControls } from "@/features/crm/components/crm-deal-controls";
import { CrmSendEmailForm } from "@/features/crm/components/crm-send-email-form";
import { CrmCompleteTaskButton, CrmTaskForm } from "@/features/crm/components/crm-task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { CRM_STAGE_LABELS } from "@/features/crm/lib/labels";
import type { CrmDealStage } from "@/features/crm/lib/types";
import { crmReplyToAddress } from "@/features/crm/lib/scope";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

export default async function CrmDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const { id } = await params;
  const detail = await loadCrmDealDetail(staff, id);
  if (!detail) {
    notFound();
  }
  const salespeople = canSeeAllCrm(staff) ? await loadCrmSalespeople() : [];
  const deal = detail.deal as Record<string, unknown>;
  const org = detail.organisation as Record<string, unknown>;
  const primaryContact = detail.contacts.find((contact) => contact.isPrimary) ?? detail.contacts[0];
  const dealOwner = detail.deals.find((item) => String(item.id) === id)?.owner ?? null;
  const replyToLabel = crmReplyToAddress({
    owner: dealOwner,
    staff: { name: staff.name, email: staff.email },
  });

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/admin/crm/pipeline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to pipeline
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{String(deal.title)}</h1>
        <p className="text-muted-foreground">
          <Link href={`/admin/crm/companies/${org.id}`} className="hover:underline">
            {String(org.name)}
          </Link>
          {" · "}
          {CRM_STAGE_LABELS[String(deal.stage) as CrmDealStage]}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal</CardTitle>
        </CardHeader>
        <CardContent>
          <CrmDealControls
            dealId={id}
            stage={deal.stage as CrmDealStage}
            valueGbp={Number(deal.valueGbp ?? 0)}
            expectedCloseAt={(deal.expectedCloseAt as string | null) ?? null}
            title={String(deal.title)}
          />
        </CardContent>
      </Card>

      {canSeeAllCrm(staff) && (
        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <CrmAssignOwnerForm
              organisationId={String(org.id)}
              dealId={id}
              currentOwnerId={(deal.ownerId as string | null) ?? null}
              salespeople={salespeople}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent>
          <CrmSendEmailForm
            dealId={id}
            defaultTo={primaryContact?.email ? String(primaryContact.email) : ""}
            replyToLabel={replyToLabel}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CrmTaskForm organisationId={String(org.id)} dealId={id} />
          {detail.tasks.map((task) => (
            <div key={String(task.id)} className="flex items-center justify-between gap-3 border-b py-2">
              <div>
                <p className="text-sm font-medium">{String(task.title)}</p>
                <p className="text-xs text-muted-foreground">
                  {task.dueAt
                    ? format(new Date(String(task.dueAt)), "d MMM yyyy", { locale: enGB })
                    : "No due date"}
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
          <CrmActivityForm organisationId={String(org.id)} dealId={id} />
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
