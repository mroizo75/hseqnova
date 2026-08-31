"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, FileText, AlertTriangle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { registerContractor } from "@/server/actions/contractor.actions";
import { useRouter } from "next/navigation";
import { ContractorLegalNote } from "@/features/contractors/components/contractor-legal-note";

const TRADE_CATEGORIES = [
  "General Building",
  "Civil Engineering",
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Scaffolding",
  "Demolition",
  "Groundworks",
  "Roofing",
  "Painting & Decorating",
  "Plastering",
  "Steelwork",
  "Fire Protection",
  "Asbestos Removal",
  "Other",
] as const;

const ACCREDITATION_OPTIONS = [
  { id: "CHAS", label: "CHAS (Contractors Health and Safety Assessment Scheme)" },
  { id: "SAFE_CONTRACTOR", label: "SafeContractor" },
  { id: "CONSTRUCTIONLINE", label: "Constructionline" },
  { id: "SSIP", label: "SSIP (Safety Schemes in Procurement)" },
  { id: "ISO_45001", label: "ISO 45001 (Occupational H&S)" },
  { id: "ISO_14001", label: "ISO 14001 (Environmental)" },
  { id: "ISO_9001", label: "ISO 9001 (Quality)" },
] as const;

interface FormState {
  companyName: string;
  companyNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  tradeCategory: string;
  workToBeDone: string;
  hostInformationProvided: boolean;
  hasPublicLiabilityInsurance: boolean;
  publicLiabilityAmount: string;
  publicLiabilityExpiry: string;
  hasEmployersLiabilityInsurance: boolean;
  employersLiabilityAmount: string;
  employersLiabilityExpiry: string;
  hasHealthSafetyPolicy: boolean;
  hasRiskAssessments: boolean;
  hasMethodStatements: boolean;
  accreditations: string[];
  previousEnforcementAction: boolean;
  enforcementDetails: string;
}

export function PrequalificationChecklist() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    companyName: "",
    companyNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    tradeCategory: "",
    workToBeDone: "",
    hostInformationProvided: false,
    hasPublicLiabilityInsurance: false,
    publicLiabilityAmount: "",
    publicLiabilityExpiry: "",
    hasEmployersLiabilityInsurance: false,
    employersLiabilityAmount: "",
    employersLiabilityExpiry: "",
    hasHealthSafetyPolicy: false,
    hasRiskAssessments: false,
    hasMethodStatements: false,
    accreditations: [],
    previousEnforcementAction: false,
    enforcementDetails: "",
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAccreditation(id: string) {
    setForm((prev) => ({
      ...prev,
      accreditations: prev.accreditations.includes(id)
        ? prev.accreditations.filter((a) => a !== id)
        : [...prev.accreditations, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.companyName.trim()) return toast.error("Company name is required");
    if (!form.contactName.trim()) return toast.error("Contact name is required");
    if (!form.contactEmail.trim()) return toast.error("Contact email is required");
    if (form.workToBeDone.trim().length < 10) {
      return toast.error("Describe the work they will do (at least 10 characters)");
    }

    setSubmitting(true);
    try {
      await registerContractor({
        companyName: form.companyName,
        companyNumber: form.companyNumber || undefined,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
        tradeCategory: form.tradeCategory || undefined,
        workToBeDone: form.workToBeDone,
        hostInformationProvided: form.hostInformationProvided,
        hasPublicLiabilityInsurance: form.hasPublicLiabilityInsurance,
        publicLiabilityAmount: form.publicLiabilityAmount || undefined,
        publicLiabilityExpiry: form.publicLiabilityExpiry ? new Date(form.publicLiabilityExpiry) : undefined,
        hasEmployersLiabilityInsurance: form.hasEmployersLiabilityInsurance,
        employersLiabilityAmount: form.employersLiabilityAmount || undefined,
        employersLiabilityExpiry: form.employersLiabilityExpiry ? new Date(form.employersLiabilityExpiry) : undefined,
        hasHealthSafetyPolicy: form.hasHealthSafetyPolicy,
        hasRiskAssessments: form.hasRiskAssessments,
        hasMethodStatements: form.hasMethodStatements,
        safetyAccreditations: form.accreditations.length > 0 ? JSON.stringify(form.accreditations) : undefined,
        previousEnforcementAction: form.previousEnforcementAction,
        enforcementDetails: form.enforcementDetails || undefined,
      });
      toast.success("Contractor registered — pending pre-qualification review");
      router.push("/dashboard/contractors");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to register contractor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <ContractorLegalNote />
      {/* Company Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                value={form.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="e.g. ABC Contractors Ltd"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Companies House Number</Label>
              <Input
                value={form.companyNumber}
                onChange={(e) => updateField("companyNumber", e.target.value)}
                placeholder="e.g. 12345678"
                maxLength={8}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contact Name *</Label>
              <Input
                value={form.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email *</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
                placeholder="email@company.co.uk"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="e.g. 07700 900000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trade Category</Label>
              <Select value={form.tradeCategory} onValueChange={(v) => updateField("tradeCategory", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Work they will do *</Label>
            <Textarea
              value={form.workToBeDone}
              onChange={(e) => updateField("workToBeDone", e.target.value)}
              placeholder="e.g. Annual boiler service and gas-safe repairs on the Manchester depot"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              INDG368 — identify the job before you select a contractor.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Registered office address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance — Employers' Liability (Compulsory Insurance) Act 1969 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Insurance Details
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            If the contractor has employees they must hold employers&apos; liability insurance
            (Employers&apos; Liability (Compulsory Insurance) Act 1969). Checking a certificate
            is good practice — it is their duty, not a named client form. Public liability is
            not required by health and safety law.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="pli"
                checked={form.hasPublicLiabilityInsurance}
                onCheckedChange={(c) => updateField("hasPublicLiabilityInsurance", !!c)}
              />
              <Label htmlFor="pli" className="font-medium">Public Liability Insurance</Label>
            </div>
            {form.hasPublicLiabilityInsurance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                <div className="space-y-1.5">
                  <Label>Cover Amount</Label>
                  <Input
                    value={form.publicLiabilityAmount}
                    onChange={(e) => updateField("publicLiabilityAmount", e.target.value)}
                    placeholder="e.g. £5,000,000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={form.publicLiabilityExpiry}
                    onChange={(e) => updateField("publicLiabilityExpiry", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="eli"
                checked={form.hasEmployersLiabilityInsurance}
                onCheckedChange={(c) => updateField("hasEmployersLiabilityInsurance", !!c)}
              />
              <Label htmlFor="eli" className="font-medium">
                Employers&apos; liability insurance (contractor&apos;s duty if they have employees)
              </Label>
            </div>
            {form.hasEmployersLiabilityInsurance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                <div className="space-y-1.5">
                  <Label>Cover Amount</Label>
                  <Input
                    value={form.employersLiabilityAmount}
                    onChange={(e) => updateField("employersLiabilityAmount", e.target.value)}
                    placeholder="Minimum £5,000,000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={form.employersLiabilityExpiry}
                    onChange={(e) => updateField("employersLiabilityExpiry", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* H&S competence — INDG368; CDM 2015 reg.8 only for construction */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Health and safety competence
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Ask whether they can do this job safely (INDG368). A written policy is only
            required if they have five or more employees (HSWA 1974 s.2(3)). Method
            statements are industry practice, not a named statutory form.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hsp"
              checked={form.hasHealthSafetyPolicy}
              onCheckedChange={(c) => updateField("hasHealthSafetyPolicy", !!c)}
            />
            <Label htmlFor="hsp">Company has a written health and safety policy</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ra"
              checked={form.hasRiskAssessments}
              onCheckedChange={(c) => updateField("hasRiskAssessments", !!c)}
            />
            <Label htmlFor="ra">Risk assessments are carried out for all work activities</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ms"
              checked={form.hasMethodStatements}
              onCheckedChange={(c) => updateField("hasMethodStatements", !!c)}
            />
            <Label htmlFor="ms">Method statements / safe systems of work are available</Label>
          </div>
        </CardContent>
      </Card>

      {/* Accreditations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Safety Accreditations
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Optional. The law does not require conformity assessment (HSE). SSIP is one way
            to show organisational capability for construction work — not proof they can
            manage this job.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {ACCREDITATION_OPTIONS.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <Checkbox
                id={`acc-${opt.id}`}
                checked={form.accreditations.includes(opt.id)}
                onCheckedChange={() => toggleAccreditation(opt.id)}
              />
              <Label htmlFor={`acc-${opt.id}`}>{opt.label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Enforcement History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Enforcement History Declaration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enf"
              checked={form.previousEnforcementAction}
              onCheckedChange={(c) => updateField("previousEnforcementAction", !!c)}
            />
            <Label htmlFor="enf">
              This organisation has been subject to enforcement action by the HSE or a local authority
            </Label>
          </div>
          {form.previousEnforcementAction && (
            <div className="space-y-1.5 pl-6">
              <Label>Details of enforcement action</Label>
              <Textarea
                value={form.enforcementDetails}
                onChange={(e) => updateField("enforcementDetails", e.target.value)}
                placeholder="Provide details including dates, nature of enforcement and remedial actions taken..."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Information from this undertaking (MHSWR regs 11 and 12)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Give them comprehensible information on the risks from your work, the measures
            you have taken, and emergency arrangements before they work on your site.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2">
            <Checkbox
              id="host-info"
              checked={form.hostInformationProvided}
              onCheckedChange={(c) => updateField("hostInformationProvided", !!c)}
            />
            <Label htmlFor="host-info" className="font-normal leading-snug">
              Site risks, our controls and emergency arrangements have been given to this
              contractor
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Submitting..." : "Submit for Pre-Qualification"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  );
}
