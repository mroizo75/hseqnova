import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase/admin";
import { AssetInspectionForm } from "./inspection-form";
import { AssetMaintenanceForm } from "./maintenance-form";

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

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  ROUTINE: "Routine",
  THOROUGH_EXAMINATION: "Thorough examination",
  PRE_USE: "Pre-use check",
  POST_INCIDENT: "Post-incident",
  RETURN_TO_SERVICE: "Return to service",
};

const RESULT_LABELS: Record<string, string> = {
  PASS: "Pass",
  CONDITIONAL_PASS: "Conditional pass",
  FAIL: "Fail",
  REQUIRES_REPAIR: "Requires repair",
};

const RESULT_COLOURS: Record<string, string> = {
  PASS: "bg-green-100 text-green-800",
  CONDITIONAL_PASS: "bg-yellow-100 text-yellow-800",
  FAIL: "bg-red-100 text-red-800",
  REQUIRES_REPAIR: "bg-orange-100 text-orange-800",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const { data: asset } = await getAdminDb()
    .from("Asset")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();

  if (!asset) {
    notFound();
  }

  const { data: inspections } = await getAdminDb()
    .from("AssetInspection")
    .select("*")
    .eq("assetId", id)
    .eq("tenantId", tenantId)
    .order("inspectionDate", { ascending: false });

  const { data: maintenance } = await getAdminDb()
    .from("AssetMaintenance")
    .select("*")
    .eq("assetId", id)
    .eq("tenantId", tenantId)
    .order("maintenanceDate", { ascending: false });

  const now = new Date();
  const isInspectionOverdue = asset.nextInspectionDue && new Date(asset.nextInspectionDue) < now;
  const isCertExpired = asset.certificationExpiry && new Date(asset.certificationExpiry) < now;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/assets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Asset Register
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{asset.name}</h1>
          <Badge variant="outline">
            {STATUS_LABELS[asset.status] || asset.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {CATEGORY_LABELS[asset.category] || asset.category}
          {asset.assetTag && ` — ${asset.assetTag}`}
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Manufacturer</dt>
              <dd>{asset.manufacturer || "—"}</dd>
              <dt className="text-muted-foreground">Model</dt>
              <dd>{asset.model || "—"}</dd>
              <dt className="text-muted-foreground">Serial number</dt>
              <dd className="font-mono">{asset.serialNumber || "—"}</dd>
              <dt className="text-muted-foreground">Location</dt>
              <dd>{asset.location || "—"}</dd>
              <dt className="text-muted-foreground">Department</dt>
              <dd>{asset.department || "—"}</dd>
              <dt className="text-muted-foreground">Purchase date</dt>
              <dd>{formatDate(asset.purchaseDate)}</dd>
              <dt className="text-muted-foreground">Commission date</dt>
              <dd>{formatDate(asset.commissionDate)}</dd>
              {asset.notes && (
                <>
                  <dt className="text-muted-foreground col-span-2 mt-2">Notes</dt>
                  <dd className="col-span-2 whitespace-pre-wrap">{asset.notes}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspection &amp; certification</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Inspection frequency</dt>
              <dd>{asset.inspectionFrequency || "—"}</dd>
              <dt className="text-muted-foreground">Last inspection</dt>
              <dd>{formatDate(asset.lastInspectionDate)}</dd>
              <dt className="text-muted-foreground">Next inspection due</dt>
              <dd className={isInspectionOverdue ? "text-red-600 font-medium" : ""}>
                {formatDate(asset.nextInspectionDue)}
                {isInspectionOverdue && " (overdue)"}
              </dd>
              <dt className="text-muted-foreground">Inspection provider</dt>
              <dd>{asset.inspectionProvider || "—"}</dd>
              <dt className="text-muted-foreground">Safe working load</dt>
              <dd>{asset.safeWorkingLoad || "—"}</dd>
              <dt className="text-muted-foreground">Last thorough exam</dt>
              <dd>{formatDate(asset.lastThoroughExam)}</dd>
              <dt className="text-muted-foreground">Thorough exam due</dt>
              <dd>{formatDate(asset.thoroughExamDue)}</dd>
              <dt className="text-muted-foreground">Certification expiry</dt>
              <dd className={isCertExpired ? "text-red-600 font-medium" : ""}>
                {formatDate(asset.certificationExpiry)}
                {isCertExpired && " (expired)"}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Inspection history</CardTitle>
          <AssetInspectionForm assetId={asset.id} />
        </CardHeader>
        <CardContent>
          {(!inspections || inspections.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No inspections recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium whitespace-nowrap">Date</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Type</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Inspected by</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Result</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((ins) => (
                    <tr key={ins.id} className="border-b">
                      <td className="py-2">{formatDate(ins.inspectionDate)}</td>
                      <td className="py-2">{INSPECTION_TYPE_LABELS[ins.inspectionType] || ins.inspectionType}</td>
                      <td className="py-2">{ins.inspectedBy}</td>
                      <td className="py-2">
                        <Badge className={RESULT_COLOURS[ins.result] || ""} variant="outline">
                          {RESULT_LABELS[ins.result] || ins.result}
                        </Badge>
                      </td>
                      <td className="py-2 max-w-[200px] truncate">{ins.findings || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Maintenance history</CardTitle>
          <AssetMaintenanceForm assetId={asset.id} />
        </CardHeader>
        <CardContent>
          {(!maintenance || maintenance.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No maintenance records yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium whitespace-nowrap">Date</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Performed by</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Description</th>
                    <th className="pb-2 font-medium whitespace-nowrap">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2">{formatDate(m.maintenanceDate)}</td>
                      <td className="py-2">{m.performedBy}</td>
                      <td className="py-2 max-w-[300px] truncate">{m.description}</td>
                      <td className="py-2">{m.cost ? `£${Number(m.cost).toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
