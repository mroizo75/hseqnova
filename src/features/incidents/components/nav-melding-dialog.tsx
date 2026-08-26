"use client";

/**
 * RIDDOR / HSE report pack – summary PDF from an incident record.
 *
 * Legal basis: RIDDOR 2013; HSWA 1974 s.2.
 * Official reporting is via HSE (not an in-app HSE API):
 * https://www.hse.gov.uk/riddor/
 *
 * Death: report without delay. Specified injury: 10 days.
 * Over-seven-day injury: 15 days. Occupational disease / listed dangerous occurrence: as RIDDOR.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Send, FileText, Loader2, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { getIncidentTypeLabel } from "@/features/incidents/schemas/incident.schema";
import type { IncidentType } from "@prisma/client";

interface IncidentForNav {
  id: string;
  avviksnummer?: string | null;
  type: string;
  title: string;
  description: string;
  occurredAt: Date | string;
  location?: string | null;
  injuryType?: string | null;
  injuryDescription?: string | null;
  isFatal: boolean;
  isLostTimeIncident: boolean;
  lostWorkdays?: number | null;
  medicalAttentionRequired: boolean;
  witnessName?: string | null;
  immediateAction?: string | null;
  reportedForUserName?: string | null;
}

interface TenantInfo {
  name: string;
  orgNumber?: string | null;
  address?: string | null;
  contactPhone?: string | null;
}

interface NavMeldingDialogProps {
  incident: IncidentForNav;
  tenant: TenantInfo;
}

const HSE_RIDDOR_URL = "https://www.hse.gov.uk/riddor/";

export function NavMeldingDialog({ incident, tenant }: NavMeldingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporterNavn, setEksporterNavn] = useState("");
  const [eksporterTittel, setEksporterTittel] = useState("");
  const [tilleggsInfo, setTilleggsInfo] = useState("");
  const { toast } = useToast();

  const isReportable =
    incident.isFatal ||
    incident.type === "ULYKKE" ||
    incident.type === "YRKESSYKDOM" ||
    incident.type === "FARLIG_SITUASJON";

  async function handleDownloadPdf() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        incidentId: incident.id,
        exporterNavn,
        eksporterTittel,
        tilleggsInfo,
      });
      const res = await fetch(`/api/nav-melding?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to generate");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RIDDOR-HSE-report-pack-${incident.avviksnummer ?? incident.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "PDF generated",
        description: "The RIDDOR / HSE report pack is ready. Submit the official report on the HSE website.",
      });
      setOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Could not generate the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isReportable) return null;

  const occurredDate = format(new Date(incident.occurredAt), "d MMMM yyyy", { locale: enGB });
  const typeLabel = getIncidentTypeLabel(incident.type as IncidentType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
          <Send className="h-4 w-4" />
          RIDDOR / HSE report pack
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            RIDDOR / HSE report pack
          </DialogTitle>
          <DialogDescription>
            RIDDOR 2013: reportable deaths, specified injuries, over-seven-day injuries, occupational disease and listed dangerous occurrences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Generate a summary PDF from this accident book entry. Official reporting is made on the HSE website — this product does not submit to HSE.{" "}
              <a href={HSE_RIDDOR_URL} target="_blank" rel="noreferrer" className="underline font-medium">
                hse.gov.uk/riddor
              </a>
            </AlertDescription>
          </Alert>

          {incident.isFatal && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800 font-medium">
                Death — report to HSE without delay (RIDDOR 2013). Also notify the police where required.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Prefill from incident record
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Incident type</p>
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  {typeLabel}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Record number</p>
                <p className="font-medium">{incident.avviksnummer ?? "–"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{occurredDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{incident.location ?? "–"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Organisation</p>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Company number</p>
                <p className="font-medium">{tenant.orgNumber ?? "–"}</p>
              </div>
              {incident.reportedForUserName && (
                <div className="col-span-2 space-y-1">
                  <p className="text-muted-foreground">Injured person</p>
                  <p className="font-medium">{incident.reportedForUserName}</p>
                </div>
              )}
              {incident.injuryType && (
                <div className="col-span-2 space-y-1">
                  <p className="text-muted-foreground">Injury type</p>
                  <p className="font-medium">{incident.injuryType}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Complete for PDF
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exporterNavn">Reporter — name</Label>
                <Input
                  id="exporterNavn"
                  value={exporterNavn}
                  onChange={(e) => setEksporterNavn(e.target.value)}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eksporterTittel">Reporter — job title</Label>
                <Input
                  id="eksporterTittel"
                  value={eksporterTittel}
                  onChange={(e) => setEksporterTittel(e.target.value)}
                  placeholder="e.g. Competent person"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tilleggsInfo">Additional information for HSE (optional)</Label>
              <Textarea
                id="tilleggsInfo"
                value={tilleggsInfo}
                onChange={(e) => setTilleggsInfo(e.target.value)}
                placeholder="Any extra information that is not already in the incident record..."
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <a href={HSE_RIDDOR_URL} target="_blank" rel="noreferrer">
              Open HSE RIDDOR
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button onClick={handleDownloadPdf} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
