"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { updatePreQualificationStatus } from "@/server/actions/contractor.actions";
import type { PreQualStatus } from "@prisma/client";
import { ContractorLegalNote } from "@/features/contractors/components/contractor-legal-note";
import { Checkbox } from "@/components/ui/checkbox";

interface ContractorData {
  id: string;
  companyName: string;
  companyNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  tradeCategory: string | null;
  workToBeDone: string | null;
  hostInformationProvided: boolean;
  hostInformationProvidedAt: Date | null;
  hasPublicLiabilityInsurance: boolean | null;
  publicLiabilityAmount: string | null;
  publicLiabilityExpiry: Date | null;
  hasEmployersLiabilityInsurance: boolean | null;
  employersLiabilityAmount: string | null;
  employersLiabilityExpiry: Date | null;
  hasHealthSafetyPolicy: boolean | null;
  healthSafetyPolicyFile: string | null;
  hasRiskAssessments: boolean | null;
  hasMethodStatements: boolean | null;
  safetyAccreditations: string | null;
  previousEnforcementAction: boolean | null;
  enforcementDetails: string | null;
  preQualificationStatus: PreQualStatus;
  preQualificationNotes: string | null;
  preQualifiedAt: Date | null;
  createdAt: Date;
}

interface Props {
  contractor: ContractorData;
}

const STATUS_CONFIG: Record<
  PreQualStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  PENDING: { label: "Pending Review", variant: "secondary", icon: <Clock className="h-4 w-4" /> },
  APPROVED: { label: "Approved", variant: "default", icon: <ShieldCheck className="h-4 w-4" /> },
  CONDITIONALLY_APPROVED: { label: "Conditionally Approved", variant: "outline", icon: <Shield className="h-4 w-4" /> },
  REJECTED: { label: "Rejected", variant: "destructive", icon: <ShieldX className="h-4 w-4" /> },
  EXPIRED: { label: "Expired", variant: "secondary", icon: <ShieldAlert className="h-4 w-4" /> },
};

const ACCREDITATION_LABELS: Record<string, string> = {
  CHAS: "CHAS",
  SAFE_CONTRACTOR: "SafeContractor",
  CONSTRUCTIONLINE: "Constructionline",
  SSIP: "SSIP",
  ISO_45001: "ISO 45001",
  ISO_14001: "ISO 14001",
  ISO_9001: "ISO 9001",
};

function parseAccreditations(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function isExpiringSoon(date: Date | null): boolean {
  if (!date) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return new Date(date).getTime() - Date.now() < thirtyDays;
}

function isExpired(date: Date | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

function InsuranceRow({
  label,
  hasInsurance,
  amount,
  expiry,
  legalRef,
}: {
  label: string;
  hasInsurance: boolean | null;
  amount: string | null;
  expiry: Date | null;
  legalRef: string;
}) {
  const expired = isExpired(expiry);
  const expiring = isExpiringSoon(expiry);

  return (
    <div className="flex flex-col gap-2 py-3 border-b last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{legalRef}</p>
        {amount && <p className="text-sm">Cover: {amount}</p>}
        {expiry && (
          <p className={`text-xs ${expired ? "text-red-600 font-semibold" : expiring ? "text-amber-600" : "text-muted-foreground"}`}>
            {expired ? "Expired" : expiring ? "Expiring soon" : "Expires"}: {new Date(expiry).toLocaleDateString("en-GB")}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {hasInsurance === true ? (
          expired ? (
            <Badge variant="destructive">Expired</Badge>
          ) : expiring ? (
            <Badge variant="outline" className="border-amber-500 text-amber-600">Expiring</Badge>
          ) : (
            <Badge variant="default">Valid</Badge>
          )
        ) : hasInsurance === false ? (
          <Badge variant="destructive">Not held</Badge>
        ) : (
          <Badge variant="secondary">Not provided</Badge>
        )}
      </div>
    </div>
  );
}

export function PrequalificationReview({ contractor }: Props) {
  const [notes, setNotes] = useState(contractor.preQualificationNotes ?? "");
  const [workToBeDone, setWorkToBeDone] = useState(contractor.workToBeDone ?? "");
  const [hostInformationProvided, setHostInformationProvided] = useState(
    contractor.hostInformationProvided,
  );
  const [saving, setSaving] = useState(false);
  const accreditations = parseAccreditations(contractor.safetyAccreditations);
  const statusConf = STATUS_CONFIG[contractor.preQualificationStatus];

  async function handleStatusChange(status: PreQualStatus) {
    setSaving(true);
    try {
      await updatePreQualificationStatus(contractor.id, status, notes, {
        workToBeDone,
        hostInformationProvided,
      });
      toast.success(`Contractor ${status === "APPROVED" ? "approved" : status === "REJECTED" ? "rejected" : "updated"}`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ContractorLegalNote />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold break-words">{contractor.companyName}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            {contractor.tradeCategory ?? "No trade specified"}
            {contractor.companyNumber && <span>· Co. {contractor.companyNumber}</span>}
          </div>
        </div>
        <Badge variant={statusConf.variant} className="flex items-center gap-1 shrink-0 w-fit">
          {statusConf.icon}
          {statusConf.label}
        </Badge>
      </div>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Name:</span> {contractor.contactName}</p>
          <p><span className="text-muted-foreground">Email:</span> {contractor.contactEmail}</p>
          {contractor.contactPhone && (
            <p><span className="text-muted-foreground">Phone:</span> {contractor.contactPhone}</p>
          )}
          {contractor.address && (
            <p><span className="text-muted-foreground">Address:</span> {contractor.address}</p>
          )}
        </CardContent>
      </Card>

      {/* Insurance — CDM 2015, Employers' Liability Act 1969 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Insurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InsuranceRow
            label="Public Liability Insurance"
            hasInsurance={contractor.hasPublicLiabilityInsurance}
            amount={contractor.publicLiabilityAmount}
            expiry={contractor.publicLiabilityExpiry}
            legalRef="Not required by health and safety law — commercial check only"
          />
          <InsuranceRow
            label="Employers' Liability Insurance"
            hasInsurance={contractor.hasEmployersLiabilityInsurance}
            amount={contractor.employersLiabilityAmount}
            expiry={contractor.employersLiabilityExpiry}
            legalRef="Contractor's duty if they have employees (ELCIA 1969) — not a named client form"
          />
        </CardContent>
      </Card>

      {/* H&S Competence — CDM 2015, MHSWR 1999 reg.7 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Health and safety competence
          </CardTitle>
          <p className="text-xs text-muted-foreground">INDG368 — evidence they can do this job safely. SSIP is optional.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckItem label="Health and safety policy" checked={contractor.hasHealthSafetyPolicy} fileKey={contractor.healthSafetyPolicyFile} />
          <CheckItem label="Risk assessments in place" checked={contractor.hasRiskAssessments} />
          <CheckItem label="Method statements available" checked={contractor.hasMethodStatements} />
        </CardContent>
      </Card>

      {/* Accreditations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Safety Accreditations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accreditations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {accreditations.map((acc) => (
                <Badge key={acc} variant="outline" className="text-xs">
                  {ACCREDITATION_LABELS[acc] ?? acc}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No accreditations declared</p>
          )}
        </CardContent>
      </Card>

      {/* Enforcement History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Enforcement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractor.previousEnforcementAction === true ? (
            <div className="space-y-2">
              <Badge variant="destructive">Previous enforcement action declared</Badge>
              {contractor.enforcementDetails && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contractor.enforcementDetails}</p>
              )}
            </div>
          ) : contractor.previousEnforcementAction === false ? (
            <p className="text-sm text-green-700">No previous enforcement action</p>
          ) : (
            <p className="text-sm text-muted-foreground">Not declared</p>
          )}
        </CardContent>
      </Card>

      {/* Review Decision */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pre-Qualification Decision</CardTitle>
          <p className="text-xs text-muted-foreground">
            Identify the job and record that host information has been given before they are
            approved to work (INDG368; MHSWR 1999 regs 11 and 12). SSIP is not a legal requirement.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Work they will do</Label>
            <Textarea
              value={workToBeDone}
              onChange={(e) => setWorkToBeDone(e.target.value)}
              placeholder="Describe the job this contractor is engaged to do"
              rows={3}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="host-info-review"
              checked={hostInformationProvided}
              onCheckedChange={(checked) => setHostInformationProvided(checked === true)}
            />
            <Label htmlFor="host-info-review" className="font-normal leading-snug">
              Site risks, our controls and emergency arrangements have been given to this
              contractor (MHSWR 1999 regs 11 and 12)
            </Label>
          </div>
          {contractor.hostInformationProvidedAt ? (
            <p className="text-xs text-muted-foreground">
              Information recorded:{" "}
              {new Date(contractor.hostInformationProvidedAt).toLocaleDateString("en-GB")}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label>Review Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this contractor's pre-qualification..."
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              onClick={() => handleStatusChange("APPROVED")}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => handleStatusChange("CONDITIONALLY_APPROVED")}
              disabled={saving}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Shield className="h-4 w-4 mr-1" />
              Conditionally Approve
            </Button>
            <Button
              onClick={() => handleStatusChange("REJECTED")}
              disabled={saving}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
          {contractor.preQualifiedAt && (
            <p className="text-xs text-muted-foreground">
              Last reviewed: {new Date(contractor.preQualifiedAt).toLocaleDateString("en-GB")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckItem({
  label,
  checked,
  fileKey,
}: {
  label: string;
  checked: boolean | null;
  fileKey?: string | null;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {fileKey && (
          <Badge variant="outline" className="text-xs">
            File attached
          </Badge>
        )}
        {checked === true ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : checked === false ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
