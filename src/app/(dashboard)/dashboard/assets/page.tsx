import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  LIFTING_EQUIPMENT: "Lifting equipment",
  PRESSURE_EQUIPMENT: "Pressure equipment",
  ELECTRICAL: "Electrical",
  VEHICLES: "Vehicles",
  POWER_TOOLS: "Power tools",
  HAND_TOOLS: "Hand tools",
  PPE: "PPE",
  FIRE_EQUIPMENT: "Fire equipment",
  SCAFFOLDING: "Scaffolding",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  OUT_OF_SERVICE: "Out of service",
  UNDER_REPAIR: "Under repair",
  DECOMMISSIONED: "Decommissioned",
  DISPOSED: "Disposed",
};

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  OUT_OF_SERVICE: "bg-red-100 text-red-800",
  UNDER_REPAIR: "bg-yellow-100 text-yellow-800",
  DECOMMISSIONED: "bg-gray-100 text-gray-800",
  DISPOSED: "bg-gray-100 text-gray-800",
};

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  let query = getAdminDb().from("Asset").select("*").eq("tenantId", tenantId);
  if (params?.category) {
    query = query.eq("category", params.category);
  }
  if (params?.status) {
    query = query.eq("status", params.status);
  }
  const { data: assets } = await query.order("createdAt", { ascending: false });
  const allAssets = assets ?? [];

  const now = new Date();
  const stats = {
    total: allAssets.length,
    overdueInspections: allAssets.filter(
      (a) => a.nextInspectionDue && new Date(a.nextInspectionDue) < now && a.status === "ACTIVE",
    ).length,
    expiredCerts: allAssets.filter(
      (a) => a.certificationExpiry && new Date(a.certificationExpiry) < now && a.status === "ACTIVE",
    ).length,
    thoroughExamDue: allAssets.filter(
      (a) => a.thoroughExamDue && new Date(a.thoroughExamDue) < now && a.status === "ACTIVE",
    ).length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Asset Register</h1>
          <p className="text-sm text-muted-foreground">
            Equipment and asset management — PUWER 1998 &amp; LOLER 1998 compliance
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/assets/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New asset
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-2">Legal requirements</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>PUWER 1998 reg. 5 — maintain work equipment in efficient working order</li>
                <li>PUWER 1998 reg. 6 — inspection of work equipment at suitable intervals</li>
                <li>LOLER 1998 reg. 9 — thorough examination of lifting equipment every 6 or 12 months</li>
                <li>LOLER 1998 reg. 10 — reports of thorough examination retained</li>
                <li>Pressure Systems Safety Regulations 2000 — written scheme of examination</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total assets</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue inspections</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueInspections}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired certificates</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiredCerts}</div>
            <p className="text-xs text-muted-foreground">Require renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thorough exam due</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.thoroughExamDue}</div>
            <p className="text-xs text-muted-foreground">LOLER reg. 9</p>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Equipment list</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/dashboard/assets">
              <Badge variant={!params?.category && !params?.status ? "default" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </Link>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Link key={key} href={`/dashboard/assets?category=${key}`}>
                <Badge variant={params?.category === key ? "default" : "outline"} className="cursor-pointer">
                  {label}
                </Badge>
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          {allAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No assets registered</p>
              <p className="text-sm mt-1">Add your first piece of equipment to get started.</p>
              <Link href="/dashboard/assets/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Register asset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium whitespace-nowrap">Asset tag</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Name</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Category</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Location</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Status</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Next inspection</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allAssets.map((asset) => {
                    const isOverdue =
                      asset.nextInspectionDue && new Date(asset.nextInspectionDue) < now;
                    return (
                      <tr key={asset.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-mono text-xs">{asset.assetTag || "—"}</td>
                        <td className="py-2">
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="font-medium hover:underline"
                          >
                            {asset.name}
                          </Link>
                        </td>
                        <td className="py-2">{CATEGORY_LABELS[asset.category] || asset.category}</td>
                        <td className="py-2">{asset.location || "—"}</td>
                        <td className="py-2">
                          <Badge className={STATUS_COLOURS[asset.status] || ""} variant="outline">
                            {STATUS_LABELS[asset.status] || asset.status}
                          </Badge>
                        </td>
                        <td className={`py-2 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                          {asset.nextInspectionDue
                            ? new Date(asset.nextInspectionDue).toLocaleDateString("en-GB")
                            : "—"}
                        </td>
                        <td className="py-2">
                          <Link href={`/dashboard/assets/${asset.id}`}>
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
