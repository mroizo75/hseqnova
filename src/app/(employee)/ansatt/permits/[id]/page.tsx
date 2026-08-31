import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPermitToWork } from "@/server/actions/permit-to-work.actions";
import {
  isPermitLiveForWorkforce,
  parsePermitPayload,
  permitTypeLabel,
} from "@/lib/permit-uk";

export const dynamic = "force-dynamic";

export default async function EmployeePermitDetailPage({
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
  if (!permit || !isPermitLiveForWorkforce(permit.status)) {
    notFound();
  }

  const data = parsePermitPayload(permit.isolations);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/ansatt/permits">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to permits
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{permit.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your copy of this permit (MHSWR 1999 reg.10). It is not sent to the HSE.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{permitTypeLabel(permit.type)}</Badge>
        <Badge variant={permit.status === "ISSUED" ? "default" : "outline"}>
          {permit.status === "ISSUED" ? "Live" : "Closed"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Location: </span>
            {permit.location ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Valid from: </span>
            {new Date(permit.validFrom).toLocaleString("en-GB")}
          </p>
          <p>
            <span className="text-muted-foreground">Valid to: </span>
            {permit.validTo ? new Date(permit.validTo).toLocaleString("en-GB") : "—"}
          </p>
          {data.issuerName && (
            <p>
              <span className="text-muted-foreground">Issued by: </span>
              {data.issuerName}
            </p>
          )}
          {data.acceptorName && (
            <p>
              <span className="text-muted-foreground">Person in charge: </span>
              {data.acceptorName}
            </p>
          )}
        </CardContent>
      </Card>

      {data.description && (
        <Card>
          <CardHeader>
            <CardTitle>Work to be done</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hazards and controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Hazards</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{data.hazards || "—"}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Control measures</p>
            <p className="whitespace-pre-wrap">{data.controlMeasures || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {data.emergencyArrangements && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency and rescue arrangements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.emergencyArrangements}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
