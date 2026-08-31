"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExposureType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createExposureRegister, updateExposureRegister } from "@/server/actions/exposure-register.actions";
import type { CreateExposureRegisterInput } from "@/server/actions/exposure-register.actions";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { Search, X, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { isValidNiNumber, niNumberStatus, normalizeNiNumber } from "@/features/exposure-register/lib/ni-number";
import { HealthRecordLegalNote } from "@/features/exposure-register/components/health-record-legal-note";
import {
  FITNESS_FOR_WORK,
  type FitnessForWork,
} from "@/lib/health-record-uk";

const EXPOSURE_TYPE_OPTIONS: { value: ExposureType; label: string }[] = [
  { value: "INHALATION", label: "Inhalation" },
  { value: "SKIN", label: "Skin contact" },
  { value: "NOISE", label: "Noise" },
  { value: "VIBRATION", label: "Vibration" },
  { value: "BIOLOGICAL", label: "Biological" },
  { value: "RADIATION", label: "Radiation" },
  { value: "OTHER", label: "Other" },
];

type Employee = {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  employeeNumber: string | null;
};

type Chemical = {
  id: string;
  productName: string;
  casNumber: string | null;
};

type RuhReport = {
  id: string;
  ruhNummer: string | null;
  title: string;
  occurredAt: Date;
};

type Risk = {
  id: string;
  title: string;
  score: number;
  likelihood: number;
  consequence: number;
  status: string;
  riskAssessment: { title: string; assessmentYear: number } | null;
};

type ExistingEntry = {
  id: string;
  employeeId: string | null;
  employeeName: string;
  employeeBirthNumber: string;
  homeAddress: string | null;
  department: string | null;
  jobTitle: string;
  workLocation: string;
  employmentStartDate: Date | null;
  employmentEndDate: Date | null;
  chemicalId: string | null;
  exposureAgent: string;
  casNumber: string | null;
  exposureType: ExposureType;
  exposureStartDate: Date;
  exposureEndDate: Date | null;
  duration: string | null;
  ppeUsed: string | null;
  riskAssessmentDone: boolean;
  healthCheckRequired: boolean;
  healthCheckDone: boolean;
  healthCheckDate: Date | null;
  fitnessForWork: string | null;
  retentionYears: number;
  ruhReportId: string | null;
  riskId: string | null;
  comment: string | null;
};

interface Props {
  employees: Employee[];
  chemicals: Chemical[];
  ruhReports?: RuhReport[];
  risks?: Risk[];
  existing?: ExistingEntry;
  preselectedChemicalId?: string;
}

function toDateInput(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function ExposureRegisterForm({ employees, chemicals, ruhReports = [], risks = [], existing, preselectedChemicalId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState(existing?.employeeId ?? "");
  const [employeeName, setEmployeeName] = useState(existing?.employeeName ?? "");
  const [employeeBirthNumber, setEmployeeBirthNumber] = useState(existing?.employeeBirthNumber ?? "");
  const [birthNumberConfirm, setBirthNumberConfirm] = useState(existing?.employeeBirthNumber ?? "");
  const [homeAddress, setHomeAddress] = useState(existing?.homeAddress ?? "");
  const [internalEmployeeNumber, setInternalEmployeeNumber] = useState(() => {
    if (existing?.employeeId) {
      return employees.find((e) => e.id === existing.employeeId)?.employeeNumber ?? "";
    }
    return "";
  });
  const [department, setDepartment] = useState(existing?.department ?? "");
  const [jobTitle, setJobTitle] = useState(existing?.jobTitle ?? "");
  const [workLocation, setWorkLocation] = useState(existing?.workLocation ?? "");
  const [employmentStartDate, setEmploymentStartDate] = useState(toDateInput(existing?.employmentStartDate));
  const [employmentEndDate, setEmploymentEndDate] = useState(toDateInput(existing?.employmentEndDate));

  const [chemicalId, setChemicalId] = useState(() => {
    if (existing?.chemicalId) return existing.chemicalId;
    if (preselectedChemicalId) return preselectedChemicalId;
    return "";
  });
  const [exposureAgent, setExposureAgent] = useState(() => {
    if (existing?.exposureAgent) return existing.exposureAgent;
    if (preselectedChemicalId) {
      const c = chemicals.find((ch) => ch.id === preselectedChemicalId);
      return c?.productName ?? "";
    }
    return "";
  });
  const [casNumber, setCasNumber] = useState(() => {
    if (existing?.casNumber) return existing.casNumber;
    if (preselectedChemicalId) {
      const c = chemicals.find((ch) => ch.id === preselectedChemicalId);
      return c?.casNumber ?? "";
    }
    return "";
  });
  const [exposureType, setExposureType] = useState<ExposureType>(existing?.exposureType ?? "INHALATION");

  const [exposureStartDate, setExposureStartDate] = useState(toDateInput(existing?.exposureStartDate));
  const [exposureEndDate, setExposureEndDate] = useState(toDateInput(existing?.exposureEndDate));
  const [duration, setDuration] = useState(existing?.duration ?? "");
  const [ppeUsed, setPpeUsed] = useState(existing?.ppeUsed ?? "");
  const [riskAssessmentDone, setRiskAssessmentDone] = useState(existing?.riskAssessmentDone ?? false);

  const [healthCheckRequired, setHealthCheckRequired] = useState(existing?.healthCheckRequired ?? false);
  const [healthCheckDone, setHealthCheckDone] = useState(existing?.healthCheckDone ?? false);
  const [healthCheckDate, setHealthCheckDate] = useState(toDateInput(existing?.healthCheckDate));
  const [fitnessForWork, setFitnessForWork] = useState<FitnessForWork | "">(
    (existing?.fitnessForWork as FitnessForWork | null) ??
      (existing?.healthCheckRequired ? "PENDING" : ""),
  );

  const [retentionYears, setRetentionYears] = useState(existing?.retentionYears ?? 40);
  const [ruhReportId, setRuhReportId] = useState(existing?.ruhReportId ?? "");
  const [riskId, setRiskId] = useState(existing?.riskId ?? "");
  const [riskSearch, setRiskSearch] = useState("");
  const [ruhSearch, setRuhSearch] = useState("");
  const [comment, setComment] = useState(existing?.comment ?? "");

  function handleEmployeeSelect(id: string) {
    const val = id === "_manual" ? "" : id;
    setEmployeeId(val);
    const emp = employees.find((e) => e.id === val);
    if (emp) {
      setEmployeeName(emp.name || emp.email);
      if (emp.department) setDepartment(emp.department);
      setInternalEmployeeNumber(emp.employeeNumber ?? "");
    } else {
      setInternalEmployeeNumber("");
    }
  }

  function handleChemicalSelect(id: string) {
    const val = id === "_manual" ? "" : id;
    setChemicalId(val);
    const chem = chemicals.find((c) => c.id === val);
    if (chem) {
      setExposureAgent(chem.productName);
      if (chem.casNumber) setCasNumber(chem.casNumber);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const niUnchanged =
      Boolean(existing) &&
      normalizeNiNumber(employeeBirthNumber) === normalizeNiNumber(existing?.employeeBirthNumber ?? "");

    if (!employeeName.trim()) return setError("Employee name is required");
    if (!employeeBirthNumber.trim()) return setError("National Insurance number is required");
    if (!niUnchanged && !isValidNiNumber(employeeBirthNumber)) {
      return setError("Enter a valid National Insurance number");
    }
    if (normalizeNiNumber(employeeBirthNumber) !== normalizeNiNumber(birthNumberConfirm)) {
      return setError("The National Insurance numbers do not match");
    }
    if (!jobTitle.trim()) return setError("Job title is required");
    if (!workLocation.trim()) return setError("Workplace is required");
    if (!homeAddress.trim()) return setError("Home address is required");
    if (!exposureAgent.trim()) return setError("Substance or agent is required");
    if (!exposureStartDate) return setError("Exposure start date is required");
    if (!duration.trim()) return setError("Say how often they are exposed");
    if (!ppeUsed.trim()) return setError("Record the protective measures provided");
    if (healthCheckRequired && !fitnessForWork) {
      return setError("Record the fitness-for-work statement");
    }

    const input: CreateExposureRegisterInput = {
      employeeId: employeeId || undefined,
      employeeName: employeeName.trim(),
      employeeBirthNumber: employeeBirthNumber.trim(),
      homeAddress: homeAddress.trim(),
      department: department.trim() || undefined,
      jobTitle: jobTitle.trim(),
      workLocation: workLocation.trim(),
      employmentStartDate: employmentStartDate ? new Date(employmentStartDate) : undefined,
      employmentEndDate: employmentEndDate ? new Date(employmentEndDate) : undefined,
      chemicalId: chemicalId || undefined,
      exposureAgent: exposureAgent.trim(),
      casNumber: casNumber.trim() || undefined,
      exposureType,
      exposureStartDate: new Date(exposureStartDate),
      exposureEndDate: exposureEndDate ? new Date(exposureEndDate) : undefined,
      duration: duration.trim() || undefined,
      ppeUsed: ppeUsed.trim() || undefined,
      riskAssessmentDone,
      healthCheckRequired,
      healthCheckDone,
      healthCheckDate: healthCheckDate ? new Date(healthCheckDate) : undefined,
      fitnessForWork: healthCheckRequired ? fitnessForWork || undefined : undefined,
      retentionYears,
      ruhReportId: ruhReportId || undefined,
      riskId: riskId || undefined,
      comment: comment.trim() || undefined,
    };

    startTransition(async () => {
      const result = existing
        ? await updateExposureRegister(existing.id, input)
        : await createExposureRegister(input);

      if (result.success) {
        router.push("/dashboard/exposure-register");
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  const niStatus = niNumberStatus(employeeBirthNumber);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <HealthRecordLegalNote />
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {employees.length > 0 && (
            <div className="space-y-2">
              <Label>Select employee from the organisation (optional — fills in the name)</Label>
              <Select value={employeeId || "_manual"} onValueChange={handleEmployeeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_manual">– Enter manually –</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name || emp.email}
                      {emp.department && ` (${emp.department})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Full name *</Label>
              <Input
                id="employeeName"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Alex Taylor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalEmployeeNumber">Employee ID (internal no.)</Label>
              <Input
                id="internalEmployeeNumber"
                value={internalEmployeeNumber}
                onChange={(e) => setInternalEmployeeNumber(e.target.value)}
                placeholder="e.g. A-0042"
                className="font-mono"
              />
              {employeeId && !internalEmployeeNumber && (
                <p className="text-xs text-amber-600">
                  No employee number is set for this person — it can be added under Settings → Users.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeBirthNumber">National Insurance number *</Label>
              <div className="relative">
                <Input
                  id="employeeBirthNumber"
                  value={employeeBirthNumber}
                  onChange={(e) => setEmployeeBirthNumber(e.target.value.toUpperCase())}
                  placeholder="AB123456C"
                  maxLength={13}
                  className={`pr-9 font-mono ${
                    niStatus === "valid" ? "border-green-500 focus-visible:ring-green-500" :
                    niStatus === "invalid" ? "border-red-400 focus-visible:ring-red-400" : ""
                  }`}
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {niStatus === "valid" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {niStatus === "invalid" && <XCircle className="h-4 w-4 text-red-400" />}
                  {niStatus === "incomplete" && employeeBirthNumber.length > 0 && (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  )}
                </span>
              </div>
              {niStatus === "valid" && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Valid National Insurance number
                </p>
              )}
              {niStatus === "invalid" && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Use the HMRC format (two letters, six digits, one letter)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthNumberConfirm">Confirm National Insurance number *</Label>
              {(() => {
                const matches =
                  birthNumberConfirm.length > 0 &&
                  normalizeNiNumber(birthNumberConfirm) === normalizeNiNumber(employeeBirthNumber);
                const mismatch =
                  birthNumberConfirm.length > 0 &&
                  normalizeNiNumber(birthNumberConfirm).length === normalizeNiNumber(employeeBirthNumber).length &&
                  !matches;
                return (
                  <>
                    <div className="relative">
                      <Input
                        id="birthNumberConfirm"
                        value={birthNumberConfirm}
                        onChange={(e) => setBirthNumberConfirm(e.target.value.toUpperCase())}
                        placeholder="Type again"
                        maxLength={13}
                        onPaste={(e) => e.preventDefault()}
                        className={`pr-9 font-mono ${
                          matches ? "border-green-500 focus-visible:ring-green-500" :
                          mismatch ? "border-red-400 focus-visible:ring-red-400" : ""
                        }`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        {matches && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {mismatch && <XCircle className="h-4 w-4 text-red-400" />}
                      </span>
                    </div>
                    {matches && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> The numbers match
                      </p>
                    )}
                    {mismatch && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> They do not match — check again
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Paste is disabled — type it in to confirm</p>
                  </>
                );
              })()}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="homeAddress">Home address *</Label>
              <Textarea
                id="homeAddress"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="House number, street, town, postcode"
                rows={2}
                required
              />
              <p className="text-xs text-muted-foreground">
                HSE health-record particular — name, home address and National Insurance number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Production"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title / role *</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Operator"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workLocation">Workplace / location *</Label>
              <Input
                id="workLocation"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="Factory A, building 2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employmentStartDate">Employment start date</Label>
              <Input
                id="employmentStartDate"
                type="date"
                value={employmentStartDate}
                onChange={(e) => setEmploymentStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentEndDate">Employment end date</Label>
              <Input
                id="employmentEndDate"
                type="date"
                value={employmentEndDate}
                onChange={(e) => setEmploymentEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Substance / agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {chemicals.length > 0 && (
            <div className="space-y-2">
              <Label>Select from the COSHH register (fills in name and CAS)</Label>
              <Select value={chemicalId || "_manual"} onValueChange={handleChemicalSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a chemical from the COSHH register..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_manual">– Enter manually –</SelectItem>
                  {chemicals.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.productName}
                      {c.casNumber && ` (CAS: ${c.casNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exposureAgent">Substance or agent *</Label>
              <Input
                id="exposureAgent"
                value={exposureAgent}
                onChange={(e) => setExposureAgent(e.target.value)}
                placeholder="Toluene, silica dust, welding fume..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="casNumber">CAS number</Label>
              <Input
                id="casNumber"
                value={casNumber}
                onChange={(e) => setCasNumber(e.target.value)}
                placeholder="108-88-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exposureType">Type of exposure *</Label>
              <Select
                value={exposureType}
                onValueChange={(v) => setExposureType(v as ExposureType)}
              >
                <SelectTrigger id="exposureType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPOSURE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exposure period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exposureStartDate">Start date *</Label>
              <Input
                id="exposureStartDate"
                type="date"
                value={exposureStartDate}
                onChange={(e) => setExposureStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exposureEndDate">End date</Label>
              <Input
                id="exposureEndDate"
                type="date"
                value={exposureEndDate}
                onChange={(e) => setExposureEndDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank if exposure is ongoing</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">How often (hours / days / weeks) *</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3 days/week, 2 hours/day"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ppeUsed">Protective measures provided *</Label>
            <Input
              id="ppeUsed"
              value={ppeUsed}
              onChange={(e) => setPpeUsed(e.target.value)}
              placeholder="e.g. local exhaust ventilation, nitrile gloves, P3 respirator"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="healthCheckRequired"
                checked={healthCheckRequired}
                onCheckedChange={(v) => {
                  const required = Boolean(v);
                  setHealthCheckRequired(required);
                  if (required && !fitnessForWork) setFitnessForWork("PENDING");
                  if (!required) {
                    setFitnessForWork("");
                    setHealthCheckDone(false);
                  }
                }}
              />
              <Label htmlFor="healthCheckRequired" className="cursor-pointer">
                Health surveillance required (COSHH 2002)
              </Label>
            </div>

            {healthCheckRequired && (
              <div className="ml-7 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fitnessForWork">Fitness for work *</Label>
                  <Select
                    value={fitnessForWork || "PENDING"}
                    onValueChange={(value) => setFitnessForWork(value as FitnessForWork)}
                  >
                    <SelectTrigger id="fitnessForWork">
                      <SelectValue placeholder="Select the occupational health conclusion" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FITNESS_FOR_WORK) as FitnessForWork[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {FITNESS_FOR_WORK[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Record the conclusion only. Do not store spirometry, blood results or other clinical notes.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="healthCheckDone"
                    checked={healthCheckDone}
                    onCheckedChange={(v) => setHealthCheckDone(Boolean(v))}
                  />
                  <Label htmlFor="healthCheckDone" className="cursor-pointer">
                    Health surveillance completed
                  </Label>
                </div>

                {healthCheckDone && (
                  <div className="space-y-2">
                    <Label htmlFor="healthCheckDate">Date of health surveillance</Label>
                    <Input
                      id="healthCheckDate"
                      type="date"
                      value={healthCheckDate}
                      onChange={(e) => setHealthCheckDate(e.target.value)}
                      className="max-w-[220px]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link to accident book</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ruhReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accident book entries yet.</p>
          ) : ruhReportId ? (
            (() => {
              const selected = ruhReports.find((r) => r.id === ruhReportId);
              return selected ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/40">
                  <div>
                    <span className="font-medium text-sm">
                      {selected.ruhNummer ?? "No number"}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">– {selected.title}</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(selected.occurredAt), "dd MMM yyyy", { locale: enGB })}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => { setRuhReportId(""); setRuhSearch(""); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null;
            })()
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accident book number or title..."
                  value={ruhSearch}
                  onChange={(e) => setRuhSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {ruhSearch.trim() && (
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {ruhReports
                    .filter((r) => {
                      const q = ruhSearch.toLowerCase();
                      return (
                        r.title.toLowerCase().includes(q) ||
                        (r.ruhNummer?.toLowerCase().includes(q) ?? false)
                      );
                    })
                    .slice(0, 10)
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                        onClick={() => { setRuhReportId(r.id); setRuhSearch(""); }}
                      >
                        <div className="flex items-center gap-2">
                          {r.ruhNummer && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {r.ruhNummer}
                            </Badge>
                          )}
                          <span className="text-sm truncate">{r.title}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(r.occurredAt), "dd MMM yyyy", { locale: enGB })}
                        </div>
                      </button>
                    ))}
                  {ruhReports.filter((r) => {
                    const q = ruhSearch.toLowerCase();
                    return r.title.toLowerCase().includes(q) || (r.ruhNummer?.toLowerCase().includes(q) ?? false);
                  }).length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No matches
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Optional — link if the exposure arose from an incident</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link to risk assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open risk assessments yet.</p>
          ) : riskId ? (
            (() => {
              const selected = risks.find((r) => r.id === riskId);
              return selected ? (
                <div className="flex items-start justify-between rounded-md border px-3 py-2 bg-muted/40">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{selected.title}</div>
                    {selected.riskAssessment && (
                      <div className="text-xs text-muted-foreground">
                        {selected.riskAssessment.title} ({selected.riskAssessment.assessmentYear})
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Score: {selected.score}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Likelihood {selected.likelihood} × Consequence {selected.consequence}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 mt-0.5"
                    onClick={() => { setRiskId(""); setRiskSearch(""); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null;
            })()
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search risk title or assessment..."
                  value={riskSearch}
                  onChange={(e) => setRiskSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {riskSearch.trim() && (
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {risks
                    .filter((r) => {
                      const q = riskSearch.toLowerCase();
                      return (
                        r.title.toLowerCase().includes(q) ||
                        (r.riskAssessment?.title.toLowerCase().includes(q) ?? false)
                      );
                    })
                    .slice(0, 10)
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                        onClick={() => { setRiskId(r.id); setRiskSearch(""); }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${r.score >= 12 ? "border-red-300 text-red-700" : r.score >= 6 ? "border-yellow-300 text-yellow-700" : "border-green-300 text-green-700"}`}
                          >
                            {r.score}
                          </Badge>
                          <span className="text-sm truncate">{r.title}</span>
                        </div>
                        {r.riskAssessment && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {r.riskAssessment.title} ({r.riskAssessment.assessmentYear})
                          </div>
                        )}
                      </button>
                    ))}
                  {risks.filter((r) => {
                    const q = riskSearch.toLowerCase();
                    return r.title.toLowerCase().includes(q) || (r.riskAssessment?.title.toLowerCase().includes(q) ?? false);
                  }).length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">No matches</div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Link the risk assessment that covers this exposure</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention and notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retentionYears">Retention period (years)</Label>
            <Select
              value={String(retentionYears)}
              onValueChange={(v) => setRetentionYears(Number(v))}
            >
              <SelectTrigger id="retentionYears" className="max-w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="40">40 years (COSHH 2002 health records)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              COSHH 2002 requires health records to be kept for 40 years
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Notes</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Further details about the work. Do not record clinical test results."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : existing ? "Save changes" : "Record exposure"}
        </Button>
      </div>
    </form>
  );
}
