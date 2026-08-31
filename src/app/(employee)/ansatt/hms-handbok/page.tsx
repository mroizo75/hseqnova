import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { getHandbookData } from "@/server/actions/hms-handbok.actions";
import { HandbokViewer } from "@/features/hms-handbok/components/handbok-viewer";
import { getAdminDb } from "@/lib/supabase/admin";
import { loadOrgChartNodes } from "@/server/queries/org-chart.queries";
import { OrgHsDutyBoard } from "@/features/organization/components/org-hs-duty-board";

export const dynamic = "force-dynamic";

export default async function EmployeeHSPolicyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId || !session.user.id) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const [tenant, documents, handbookResult, modulesRes, orgNodes] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        orgNumber: true,
        companyNumber: true,
        industry: true,
        hmsContactName: true,
        hmsContactEmail: true,
        hmsContactPhone: true,
      },
    }),
    prisma.document.findMany({
      where: {
        tenantId,
        status: "APPROVED",
        kind: { in: ["PROCEDURE", "PLAN", "LAW"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        kind: true,
        version: true,
        updatedAt: true,
      },
    }),
    getHandbookData(tenantId, { publishedOnly: true }),
    getAdminDb()
      .from("TenantModule")
      .select("moduleKey")
      .eq("tenantId", tenantId)
      .in("status", ["ACTIVE", "TRIAL"]),
    loadOrgChartNodes(tenantId),
  ]);

  if (!tenant) {
    redirect("/ansatt");
  }

  const enabledModules = (modulesRes.data ?? []).map((row) => row.moduleKey as string);
  const emptyHandbook = {
    id: "",
    tenantId,
    lastReviewedAt: null,
    reviewedByName: null,
    currentVersion: null,
    signatures: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const emptyStats = {
    activeRiskAssessments: 0,
    activeRoutines: 0,
    openIncidentsLast30d: 0,
    activeTrainings: 0,
    lastIncidentAt: null,
    lastRiskReviewAt: null,
    lastRoutineReviewAt: null,
    annualPlanProgress: null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-teal-600" />
          Health and safety policy
        </h1>
        <p className="text-muted-foreground text-sm">
          The written policy your employer must bring to your notice under HSWA 1974 s.2(3):
          statement of intent, organisation and arrangements. Confirm you have been notified
          after you have read it.
        </p>
      </div>

      {handbookResult.success ? (
        <HandbokViewer
          tenantId={tenantId}
          tenantName={tenant.name}
          orgNumber={tenant.orgNumber ?? tenant.companyNumber}
          industry={tenant.industry}
          hmsContactName={tenant.hmsContactName}
          hmsContactPhone={tenant.hmsContactPhone}
          handbook={handbookResult.handbook}
          stats={handbookResult.stats}
          currentUserId={session.user.id}
          canManage={false}
          canApprove={false}
          enabledModules={enabledModules}
          audience="employee"
        />
      ) : (
        <HandbokViewer
          tenantId={tenantId}
          tenantName={tenant.name}
          orgNumber={tenant.orgNumber ?? tenant.companyNumber}
          industry={tenant.industry}
          hmsContactName={tenant.hmsContactName}
          hmsContactPhone={tenant.hmsContactPhone}
          handbook={emptyHandbook}
          stats={emptyStats}
          currentUserId={session.user.id}
          canManage={false}
          canApprove={false}
          enabledModules={enabledModules}
          audience="employee"
        />
      )}

      <OrgHsDutyBoard
        nodes={orgNodes.map((n) => ({
          id: n.id,
          parentId: n.parentId,
          title: n.title,
          name: n.name,
          department: n.department,
          hsDutyKey: n.hsDutyKey ?? null,
          hsDuty: n.hsDuty ?? null,
          sortOrder: n.sortOrder,
        }))}
      />

      {documents.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">Supporting procedures</p>
            <p className="text-xs text-muted-foreground">
              Controlled documents that sit alongside the written policy. They are not a substitute
              for the statement of intent, organisation and arrangements above.
            </p>
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/ansatt/dokumenter/${doc.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.kind} &middot; v{doc.version} &middot;{" "}
                    {format(new Date(doc.updatedAt), "d MMM yyyy", { locale: enGB })}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Your rights:</strong> Under HSWA s.2, your employer must ensure your health,
            safety and welfare at work so far as is reasonably practicable. That includes safe
            systems of work, information, instruction, training and a safe working environment.
            {tenant.hmsContactEmail && (
              <>
                {" "}
                Questions:{" "}
                <a href={`mailto:${tenant.hmsContactEmail}`} className="underline">
                  {tenant.hmsContactEmail}
                </a>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
