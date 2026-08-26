import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Download, CheckCircle, AlertTriangle, Calendar, MapPin, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { normalizePpeFile } from "@/lib/pictograms";
import { IsocyanateWarning } from "@/components/isocyanate-warning";
import { ChemicalRiskSuggestions } from "@/components/chemical-risk-suggestions";
import { ExposureRegisterWarning } from "@/components/exposure-register-warning";
import { countActiveExposuresForChemical, loadChemicalById } from "@/server/queries/chemicals.queries";
import { isChemicalReviewOverdue } from "@/features/chemicals/lib/chemical-review";

export default async function ChemicalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const [chemical, exposureCount] = await Promise.all([
    loadChemicalById(id, tenantId),
    countActiveExposuresForChemical(id, tenantId),
  ]);

  if (!chemical) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 border-green-200">In use</Badge>;
      case "PHASED_OUT":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Being phased out</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isOverdue = isChemicalReviewOverdue(chemical.nextReviewDate);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/chemicals">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to COSHH
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{chemical.productName}</h1>
              {getStatusBadge(chemical.status)}
            </div>
            {chemical.supplier && (
              <p className="text-muted-foreground">Supplier: {chemical.supplier}</p>
            )}
          </div>
          <Link href={`/dashboard/chemicals/${chemical.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {isOverdue && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Review overdue</p>
                <p className="text-sm text-red-800">
                  This COSHH assessment is past its review date. Review the assessment and
                  update the safety data sheet if it is no longer valid.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {chemical.containsIsocyanates && (
        <IsocyanateWarning details={chemical.aiExtractedData ? (() => {
          try {
            const data = JSON.parse(chemical.aiExtractedData) as { isocyanateDetails?: string };
            return data.isocyanateDetails;
          } catch {
            return undefined;
          }
        })() : undefined} />
      )}

      <ExposureRegisterWarning
        chemicalId={chemical.id}
        chemicalName={chemical.productName}
        hazardStatements={chemical.hazardStatements}
        isCMR={chemical.isCMR}
        existingEntryCount={exposureCount}
      />

      <ChemicalRiskSuggestions
        chemicalId={chemical.id}
        chemicalName={chemical.productName}
        isCMR={chemical.isCMR}
        isSVHC={chemical.isSVHC}
        containsIsocyanates={chemical.containsIsocyanates}
        hazardLevel={chemical.hazardLevel}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product information</CardTitle>
            <CardDescription>Product details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chemical.casNumber && (
              <div>
                <p className="text-sm text-muted-foreground">CAS number</p>
                <p className="font-medium font-mono">{chemical.casNumber}</p>
              </div>
            )}

            {chemical.ecNumber && (
              <div>
                <p className="text-sm text-muted-foreground">EC number (ECHA)</p>
                <p className="font-medium font-mono">{chemical.ecNumber}</p>
              </div>
            )}

            {chemical.hazardClass && (
              <div>
                <p className="text-sm text-muted-foreground">Hazard class (GHS/CLP)</p>
                <p className="font-medium">{chemical.hazardClass}</p>
              </div>
            )}

            {chemical.location && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Storage location
                </p>
                <p className="font-medium">{chemical.location}</p>
              </div>
            )}

            {chemical.quantity && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Quantity
                </p>
                <p className="font-medium">
                  {chemical.quantity} {chemical.unit || ""}
                </p>
              </div>
            )}

            {(chemical.isCMR || chemical.isSVHC || chemical.reachStatus) && (
              <div className="space-y-1 pt-1">
                <p className="text-sm text-muted-foreground">Classification</p>
                <div className="flex flex-wrap gap-2">
                  {chemical.isCMR && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">CMR substance</Badge>
                  )}
                  {chemical.isSVHC && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">SVHC (UK REACH)</Badge>
                  )}
                  {chemical.reachStatus && (
                    <Badge variant="outline" className="text-xs">{chemical.reachStatus}</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hazard labelling</CardTitle>
            <CardDescription>GHS/CLP classification and statements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chemical.hazardStatements && (
              <div>
                <p className="text-sm text-muted-foreground">H-statements</p>
                <p className="font-medium whitespace-pre-wrap text-sm">{chemical.hazardStatements}</p>
              </div>
            )}

            {chemical.precautionaryStatements && (
              <div>
                <p className="text-sm text-muted-foreground">P-statements</p>
                <p className="font-medium whitespace-pre-wrap text-sm">{chemical.precautionaryStatements}</p>
              </div>
            )}

            {chemical.warningPictograms && (() => {
              try {
                const pictograms = JSON.parse(chemical.warningPictograms) as string[];
                return pictograms.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Hazard symbols</p>
                    <div className="flex flex-wrap gap-3">
                      {pictograms.map((file: string, idx: number) => (
                        <div key={idx} className="relative w-20 h-20 border-2 border-orange-200 rounded-lg p-1">
                          <Image
                            src={`/faremerker/${file}`}
                            alt="Hazard pictogram"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}
          </CardContent>
        </Card>
      </div>

      {chemical.requiredPPE && (() => {
        try {
          const ppeList = JSON.parse(chemical.requiredPPE) as string[];
          return ppeList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Required personal protective equipment (PPE)</CardTitle>
                <CardDescription>ISO 7010 — PPE that must be used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {ppeList.map((file: string, idx: number) => {
                    const normalizedFile = normalizePpeFile(file);
                    if (!normalizedFile) return null;
                    return (
                      <div key={idx} className="relative w-16 h-16 border-2 border-blue-200 rounded-lg p-1 bg-blue-50">
                        <Image
                          src={`/ppe/${normalizedFile}`}
                          alt="Required PPE"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null;
        } catch {
          return null;
        }
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Safety data sheet (SDS)</CardTitle>
          <CardDescription>Documentation and reviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {chemical.sdsVersion && (
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">{chemical.sdsVersion}</p>
              </div>
            )}

            {chemical.sdsDate && (
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(chemical.sdsDate).toLocaleDateString("en-GB")}
                </p>
              </div>
            )}

            {chemical.nextReviewDate && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next review
                </p>
                <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                  {new Date(chemical.nextReviewDate).toLocaleDateString("en-GB")}
                  {isOverdue && " (overdue)"}
                </p>
              </div>
            )}
          </div>

          {chemical.sdsKey ? (
            <div>
              <Link href={`/api/chemicals/${chemical.id}/download-sds`} target="_blank">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download safety data sheet
                </Button>
              </Link>
            </div>
          ) : (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-800">
                  Safety data sheet missing — please upload one. COSHH 2002 requires information
                  and SDS to be available to employees.
                </p>
              </CardContent>
            </Card>
          )}

          {chemical.lastVerifiedAt && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Last verified: {new Date(chemical.lastVerifiedAt).toLocaleDateString("en-GB")}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {chemical.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional information</CardTitle>
            <CardDescription>Notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{chemical.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
