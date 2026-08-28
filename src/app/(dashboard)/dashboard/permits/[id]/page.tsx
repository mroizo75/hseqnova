import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPermitToWork } from "@/server/actions/permit-to-work.actions";
import { PermitStatusActions } from "./permit-status-actions";
import { PrintButton } from "./print-button";

const PERMIT_TYPE_LABELS: Record<string, string> = {
  HOT_WORK: "Hot Work",
  CONFINED_SPACE: "Confined Space",
  WORKING_AT_HEIGHT: "Working at Height",
  EXCAVATION: "Excavation",
  ELECTRICAL: "Electrical",
  GENERAL: "General",
};

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ISSUED: { label: "Issued", variant: "default" },
  CLOSED: { label: "Closed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

interface IsolationsData {
  description?: string;
  hazards?: string;
  controlMeasures?: string;
  isolationsRequired?: string;
  ppeRequired?: string[];
}

function parseIsolations(raw: string | null): IsolationsData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IsolationsData;
  } catch {
    return null;
  }
}

export default async function PermitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const permit = await getPermitToWork(id);
  if (!permit) {
    notFound();
  }

  const style = STATUS_STYLES[permit.status] ?? STATUS_STYLES.DRAFT;
  const data = parseIsolations(permit.isolations);

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/permits">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{permit.title}</h1>
            <p className="text-sm text-muted-foreground">
              {PERMIT_TYPE_LABELS[permit.type] ?? permit.type} permit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={style.variant} className="text-sm">
            {style.label}
          </Badge>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Permit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">
                {PERMIT_TYPE_LABELS[permit.type] ?? permit.type}
              </span>

              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{permit.location ?? "—"}</span>

              <span className="text-muted-foreground">Valid from</span>
              <span className="font-medium">
                {new Date(permit.validFrom).toLocaleString("en-GB")}
              </span>

              <span className="text-muted-foreground">Valid to</span>
              <span className="font-medium">
                {permit.validTo
                  ? new Date(permit.validTo).toLocaleString("en-GB")
                  : "—"}
              </span>

              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(permit.createdAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-1">
                  {(["DRAFT", "ISSUED", "CLOSED"] as const).map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          permit.status === s
                            ? "bg-primary"
                            : permit.status === "CANCELLED"
                              ? "bg-destructive/30"
                              : i <=
                                  ["DRAFT", "ISSUED", "CLOSED"].indexOf(permit.status)
                                ? "bg-primary/60"
                                : "bg-muted"
                        }`}
                      />
                      <span className="text-xs">{STATUS_STYLES[s]?.label}</span>
                      {i < 2 && <span className="text-muted-foreground mx-1">→</span>}
                    </div>
                  ))}
                </div>
              </div>
              <PermitStatusActions permitId={permit.id} currentStatus={permit.status} />
            </div>
          </CardContent>
        </Card>
      </div>

      {data?.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description of Work</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.description}</p>
          </CardContent>
        </Card>
      )}

      {(data?.hazards || data?.controlMeasures) && (
        <Card>
          <CardHeader>
            <CardTitle>Hazards &amp; Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.hazards && (
              <div>
                <h4 className="text-sm font-medium mb-1">Hazards Identified</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {data.hazards}
                </p>
              </div>
            )}
            {data.controlMeasures && (
              <div>
                <h4 className="text-sm font-medium mb-1">Control Measures</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {data.controlMeasures}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data?.isolationsRequired && (
        <Card>
          <CardHeader>
            <CardTitle>Isolations Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.isolationsRequired}</p>
          </CardContent>
        </Card>
      )}

      {data?.ppeRequired && data.ppeRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PPE Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.ppeRequired.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
