import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, MapPin, Calendar, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  loadInspectionDetail,
  loadInspectionPeople,
  parseParticipantIds,
} from "@/server/queries/inspections.queries";
import { inspectionTypeLabel, legalBasisLabel } from "@/lib/inspection-uk";

export const dynamic = "force-dynamic";

export default async function EmployeeInspectionRecordPage({
  params,
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const { inspectionId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const inspection = await loadInspectionDetail(session.user.tenantId, inspectionId);
  if (!inspection) {
    notFound();
  }

  const participantIds = parseParticipantIds(inspection.participants);
  const mayView =
    inspection.conductedBy === session.user.id ||
    participantIds.includes(session.user.id);
  if (!mayView) {
    notFound();
  }

  const people = await loadInspectionPeople([inspection.conductedBy, ...participantIds]);
  const inspector = people.find((person) => person.id === inspection.conductedBy);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/ansatt/vernerunder">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to inspections
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{inspection.title}</h1>
            <p className="text-sm text-muted-foreground">
              Your copy of the inspection record (HSE F2534). It is not sent to the HSE.
            </p>
          </div>
          <Link href={`/api/inspections/${inspection.id}/report`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Download record
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{inspectionTypeLabel(inspection.type)}</Badge>
            <Badge variant="secondary">{inspection.status}</Badge>
          </div>
          <p>
            <span className="font-medium">Reason: </span>
            {legalBasisLabel(inspection.legalBasis, inspection.type)}
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {format(new Date(inspection.scheduledDate), "d MMMM yyyy, HH:mm", { locale: enGB })}
          </p>
          {inspection.location ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {inspection.location}
            </p>
          ) : null}
          <p className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {inspector?.name || inspector?.email || "Inspector"}
          </p>
          <p className="text-xs text-muted-foreground">
            This record does not imply that conditions are safe and healthy or that
            welfare arrangements are satisfactory.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Findings notified to the employer (HSE F2533)</CardTitle>
        </CardHeader>
        <CardContent>
          {inspection.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unsafe or unhealthy conditions were recorded.</p>
          ) : (
            <ul className="space-y-4">
              {inspection.findings.map((finding) => (
                <li key={finding.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium">{finding.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {finding.status}
                    {finding.dueDate
                      ? ` · Due ${format(new Date(finding.dueDate), "d MMM yyyy", { locale: enGB })}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
