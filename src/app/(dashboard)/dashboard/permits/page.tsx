import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  FileKey,
} from "lucide-react";
import Link from "next/link";
import { listPermitsToWork } from "@/server/actions/permit-to-work.actions";
import { PermitToWorkStatus } from "@prisma/client";

const PERMIT_TYPE_LABELS: Record<string, string> = {
  HOT_WORK: "Hot Work",
  CONFINED_SPACE: "Confined Space",
  WORKING_AT_HEIGHT: "Working at Height",
  EXCAVATION: "Excavation",
  ELECTRICAL: "Electrical",
  GENERAL: "General",
};

const STATUS_STYLES: Record<PermitToWorkStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ISSUED: { label: "Issued", variant: "default" },
  CLOSED: { label: "Closed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const permits = await listPermitsToWork();

  const filteredPermits = permits.filter((p) => {
    if (params.status && p.status !== params.status) return false;
    if (params.type && p.type !== params.type) return false;
    return true;
  });

  const now = new Date();
  const stats = {
    active: permits.filter((p) => p.status === "ISSUED").length,
    expired: permits.filter(
      (p) => p.status === "ISSUED" && p.validTo && new Date(p.validTo) < now,
    ).length,
    draft: permits.filter((p) => p.status === "DRAFT").length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            Permits to Work
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage permits to work for high-risk activities
          </p>
        </div>
        <Link href="/dashboard/permits/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New permit
          </Button>
        </Link>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-2">
                Legal requirements
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>CDM 2015 — permits required for high-risk construction activities</li>
                <li>HSWA 1974 s.2 — duty to ensure safe systems of work</li>
                <li>MHSWR 1999 — risk assessments must inform permit conditions</li>
                <li>Permits must be time-limited and signed off before work begins</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently issued permits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Past valid-to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileKey className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Awaiting issue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Permits</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Link href="/dashboard/permits">
                <Badge variant={!params.status ? "default" : "outline"} className="cursor-pointer">
                  All
                </Badge>
              </Link>
              {Object.entries(STATUS_STYLES).map(([key, { label }]) => (
                <Link key={key} href={`/dashboard/permits?status=${key}`}>
                  <Badge
                    variant={params.status === key ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPermits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileKey className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No permits found</p>
              <Link href="/dashboard/permits/new">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create first permit
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Location</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Valid from</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Valid to</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermits.map((permit) => {
                    const style = STATUS_STYLES[permit.status];
                    return (
                      <tr key={permit.id} className="border-b last:border-0">
                        <td className="py-3">
                          <Badge variant="outline">
                            {PERMIT_TYPE_LABELS[permit.type] ?? permit.type}
                          </Badge>
                        </td>
                        <td className="py-3 font-medium">{permit.title}</td>
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">
                          {permit.location ?? "—"}
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {new Date(permit.validFrom).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {permit.validTo
                            ? new Date(permit.validTo).toLocaleDateString("en-GB")
                            : "—"}
                        </td>
                        <td className="py-3">
                          <Badge variant={style.variant}>{style.label}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/dashboard/permits/${permit.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
