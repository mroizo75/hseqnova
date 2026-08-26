import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Building2, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function EmployeeHSPolicyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const [tenant, documents, orgChart] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true,
        hmsContactName: true,
        hmsContactEmail: true,
        hmsContactPhone: true,
      },
    }),
    prisma.document.findMany({
      where: {
        tenantId: session.user.tenantId,
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
    prisma.orgChartNode.findMany({
      where: { tenantId: session.user.tenantId, parentId: null },
      select: { id: true, title: true, name: true, department: true },
      take: 10,
    }),
  ]);

  if (!tenant) {
    redirect("/ansatt");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-teal-600" />
          Health &amp; Safety Policy
        </h1>
        <p className="text-muted-foreground text-sm">
          Your employer&rsquo;s written health and safety policy as required by
          HSWA 1974 s.2(3). This covers the general policy, organisation, and
          arrangements.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {tenant.hmsContactName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Competent person (MHSWR reg.7)</span>
                <span className="font-medium">{tenant.hmsContactName}</span>
              </div>
            )}
            {tenant.hmsContactEmail && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <a
                  href={`mailto:${tenant.hmsContactEmail}`}
                  className="text-primary underline"
                >
                  {tenant.hmsContactEmail}
                </a>
              </div>
            )}
            {tenant.hmsContactPhone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <a
                  href={`tel:${tenant.hmsContactPhone}`}
                  className="text-primary font-medium"
                >
                  {tenant.hmsContactPhone}
                </a>
              </div>
            )}
          </div>
          {orgChart.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Key roles</p>
              <div className="flex flex-wrap gap-2">
                {orgChart.map((node) => (
                  <Badge key={node.id} variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {node.title}{node.name ? ` — ${node.name}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
                      {format(new Date(doc.updatedAt), "d MMM yyyy")}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Your rights:</strong> Under HSWA s.2, your employer must
            ensure your health, safety, and welfare at work so far as is
            reasonably practicable. This includes providing safe systems of work,
            adequate training, and a safe working environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
