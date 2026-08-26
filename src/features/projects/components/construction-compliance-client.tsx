"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ComplianceData = {
  tenant?: {
    name: string;
    orgNumber: string | null;
  } | null;
  shaPlan: any | null;
  preNotification: any | null;
  rosterEntries: any[];
  rosterChecks: any[];
  availableEmployees?: Array<{
    userId: string;
    name: string;
    email: string;
    employeeNumber: string | null;
    phone: string | null;
  }>;
  isDailyCheckMissing?: boolean;
  latestCheckDate?: string | null;
  preNotificationRequirement?: {
    isRequired: boolean;
    reasons: string[];
    estimatedWorkerDays: number | null;
    workDays: number | null;
    submissionDeadline: string | null;
    isDeadlineSoon: boolean;
    isDeadlinePassed: boolean;
  };
  complianceValidation?: {
    shaReadyForActive: boolean;
    shaMissingFieldsForActive: string[];
    preNotificationReadyForSubmission: boolean;
    preNotificationMissingFieldsForSubmission: string[];
  };
  changeLogs?: Array<{
    id: string;
    action: string;
    createdAt: string;
    changedBy: string;
    changedByEmail: string | null;
    metadata: {
      changedFields?: Array<{ field: string; from: string | null; to: string | null }>;
    } | null;
  }>;
};

interface ConstructionComplianceClientProps {
  projectId: string;
  canManage: boolean;
}

const changeFieldLabels: Record<string, string> = {
  status: "Status",
  builderName: "Client",
  builderRepresentativeName: "Client contact",
  builderRepresentativeContact: "Client contact details",
  coordinatorPlanningName: "Principal Designer",
  coordinatorExecutionName: "Principal Contractor",
  organizationChart: "Organisation / duty holders",
  progressPlan: "Programme",
  specificMeasures: "Site-specific controls (CPP)",
  changeProcedure: "Arrangements for change",
  conflictAssessmentDocumented: "Competence / appointment recorded",
  availableOnSite: "Available on site",
  sentAt: "Sent date",
  submissionDate: "Submission date",
  projectAddress: "Site address",
  projectType: "Description of the project",
  builderOrgNumber: "Company number",
  builderAddress: "Client address",
  builderPhone: "Client telephone",
  builderRepresentativePhone: "Contact telephone",
  coordinators: "Principal Designer / Principal Contractor",
  designers: "Designers",
  contractors: "Contractors",
  expectedStartDate: "Start date",
  expectedEndDate: "End date",
  maxWorkersSimultaneous: "Maximum workers on site at any one time",
  plannedBusinessesCount: "Planned number of contractors",
  visibleAtSite: "Displayed on site",
};

function formatChangeValue(value: string | null): string {
  if (!value || value.trim().length === 0) return "—";
  if (value === "true") return "Yes";
  if (value === "false") return "No";
  return value;
}

export function ConstructionComplianceClient({ projectId, canManage }: ConstructionComplianceClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ComplianceData>({
    shaPlan: null,
    preNotification: null,
    rosterEntries: [],
    rosterChecks: [],
  });

  const [shaPlan, setShaPlan] = useState({
    status: "DRAFT",
    builderName: "",
    builderRepresentativeName: "",
    builderRepresentativeContact: "",
    coordinatorPlanningName: "",
    coordinatorExecutionName: "",
    organizationChart: "",
    progressPlan: "",
    specificMeasures: "",
    changeProcedure: "",
    conflictAssessmentDocumented: false,
    availableOnSite: false,
  });

  const [preNotification, setPreNotification] = useState({
    status: "DRAFT",
    projectAddress: "",
    projectType: "Construction work",
    builderName: "",
    builderOrgNumber: "",
    builderAddress: "",
    builderPhone: "",
    builderRepresentativeName: "",
    builderRepresentativePhone: "",
    expectedStartDate: "",
    expectedEndDate: "",
    maxWorkersSimultaneous: "",
    plannedBusinessesCount: "",
    coordinators: "",
    designers: "",
    contractors: "",
    visibleAtSite: false,
  });

  const [newEntry, setNewEntry] = useState({
    fullName: "",
    birthDate: "",
    employerName: "",
    employerOrgNumber: "",
    hiringCompanyName: "",
    hmsCardNumber: "",
    startedAtSiteDate: "",
    endedAtSiteDate: "",
    notes: "",
  });
  const [dailyCheckDate, setDailyCheckDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyCheckNotes, setDailyCheckNotes] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryDraft, setEntryDraft] = useState({
    fullName: "",
    birthDate: "",
    employerName: "",
    employerOrgNumber: "",
    hiringCompanyName: "",
    hmsCardNumber: "",
    startedAtSiteDate: "",
    endedAtSiteDate: "",
    notes: "",
    isActive: true,
  });

  const activeRosterCount = useMemo(
    () => data.rosterEntries.filter((entry) => entry.isActive).length,
    [data.rosterEntries]
  );
  const availableEmployees = useMemo(
    () =>
      [...(data.availableEmployees ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name, "en-GB", { sensitivity: "base" })
      ),
    [data.availableEmployees]
  );
  const activeRosterNameSet = useMemo(
    () =>
      new Set(
        data.rosterEntries
          .filter((entry) => entry.isActive)
          .map((entry) => String(entry.fullName ?? "").trim().toLowerCase())
      ),
    [data.rosterEntries]
  );

  const lastCheckLabel = useMemo(() => {
    if (!data.latestCheckDate) return "No check recorded";
    return new Date(data.latestCheckDate).toLocaleDateString("en-GB");
  }, [data.latestCheckDate]);
  const submissionDeadlineLabel = useMemo(() => {
    if (!data.preNotificationRequirement?.submissionDeadline) return null;
    return new Date(data.preNotificationRequirement.submissionDeadline).toLocaleDateString("en-GB");
  }, [data.preNotificationRequirement?.submissionDeadline]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/construction-compliance`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Could not load CDM records");
      }

      const payload = result.data as ComplianceData;
      setData(payload);

      if (payload.shaPlan) {
        setShaPlan({
          status: payload.shaPlan.status ?? "DRAFT",
          builderName: payload.shaPlan.builderName ?? "",
          builderRepresentativeName: payload.shaPlan.builderRepresentativeName ?? "",
          builderRepresentativeContact: payload.shaPlan.builderRepresentativeContact ?? "",
          coordinatorPlanningName: payload.shaPlan.coordinatorPlanningName ?? "",
          coordinatorExecutionName: payload.shaPlan.coordinatorExecutionName ?? "",
          organizationChart: payload.shaPlan.organizationChart ?? "",
          progressPlan: payload.shaPlan.progressPlan ?? "",
          specificMeasures: payload.shaPlan.specificMeasures ?? "",
          changeProcedure: payload.shaPlan.changeProcedure ?? "",
          conflictAssessmentDocumented: payload.shaPlan.conflictAssessmentDocumented ?? false,
          availableOnSite: payload.shaPlan.availableOnSite ?? false,
        });
      }

      if (payload.preNotification) {
        setPreNotification({
          status: payload.preNotification.status ?? "DRAFT",
          projectAddress: payload.preNotification.projectAddress ?? "",
          projectType: payload.preNotification.projectType ?? "Construction work",
          builderName: payload.preNotification.builderName ?? "",
          builderOrgNumber: payload.preNotification.builderOrgNumber ?? "",
          builderAddress: payload.preNotification.builderAddress ?? "",
          builderPhone: payload.preNotification.builderPhone ?? "",
          builderRepresentativeName: payload.preNotification.builderRepresentativeName ?? "",
          builderRepresentativePhone: payload.preNotification.builderRepresentativePhone ?? "",
          expectedStartDate: payload.preNotification.expectedStartDate
            ? new Date(payload.preNotification.expectedStartDate).toISOString().slice(0, 10)
            : "",
          expectedEndDate: payload.preNotification.expectedEndDate
            ? new Date(payload.preNotification.expectedEndDate).toISOString().slice(0, 10)
            : "",
          maxWorkersSimultaneous: payload.preNotification.maxWorkersSimultaneous?.toString() ?? "",
          plannedBusinessesCount: payload.preNotification.plannedBusinessesCount?.toString() ?? "",
          coordinators: payload.preNotification.coordinators ?? "",
          designers: payload.preNotification.designers ?? "",
          contractors: payload.preNotification.contractors ?? "",
          visibleAtSite: payload.preNotification.visibleAtSite ?? false,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load CDM 2015 records",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [projectId]);

  const saveCompliance = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/construction-compliance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shaPlan: {
            ...shaPlan,
            lastReviewedAt: new Date().toISOString(),
          },
          preNotification: {
            ...preNotification,
            expectedStartDate: preNotification.expectedStartDate || undefined,
            expectedEndDate: preNotification.expectedEndDate || null,
            maxWorkersSimultaneous: preNotification.maxWorkersSimultaneous
              ? Number(preNotification.maxWorkersSimultaneous)
              : null,
            plannedBusinessesCount: preNotification.plannedBusinessesCount
              ? Number(preNotification.plannedBusinessesCount)
              : null,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Could not save CDM records");
      }

      toast({
        title: "Saved",
        description: "Construction Phase Plan and F10 have been updated.",
      });
      await loadData();
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: "Check the required fields and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const addRosterEntry = async () => {
    if (!canManage) return;
    if (!newEntry.fullName || !newEntry.birthDate || !newEntry.employerName) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Name, date of birth and employer are required.",
      });
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/construction-compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ROSTER_ENTRY",
          data: {
            ...newEntry,
            isActive: !newEntry.endedAtSiteDate,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Could not add the person");
      }

      setNewEntry({
        fullName: "",
        birthDate: "",
        employerName: "",
        employerOrgNumber: "",
        hiringCompanyName: "",
        hmsCardNumber: "",
        startedAtSiteDate: "",
        endedAtSiteDate: "",
        notes: "",
      });
      toast({
        title: "Person recorded",
        description: "The site register has been updated.",
      });
      await loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the person to the site register.",
      });
    }
  };

  const fillFromEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const employee = availableEmployees.find((candidate) => candidate.userId === employeeId);
    if (!employee) return;
    setNewEntry((prev) => ({
      ...prev,
      fullName: employee.name,
      employerName: data.tenant?.name || prev.employerName,
      employerOrgNumber: data.tenant?.orgNumber || prev.employerOrgNumber,
      startedAtSiteDate: prev.startedAtSiteDate || new Date().toISOString().slice(0, 10),
    }));
  };

  const registerDailyCheck = async () => {
    if (!canManage) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/construction-compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_ROSTER_DAY",
          data: {
            checkedDate: dailyCheckDate,
            notes: dailyCheckNotes || null,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Could not record the daily check");
      }

      toast({
        title: "Daily check recorded",
        description: "The site register check has been saved.",
      });
      setDailyCheckNotes("");
      await loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not record the daily check.",
      });
    }
  };

  const startEditEntry = (entry: any) => {
    setEditingEntryId(entry.id);
    setEntryDraft({
      fullName: entry.fullName ?? "",
      birthDate: entry.birthDate ? new Date(entry.birthDate).toISOString().slice(0, 10) : "",
      employerName: entry.employerName ?? "",
      employerOrgNumber: entry.employerOrgNumber ?? "",
      hiringCompanyName: entry.hiringCompanyName ?? "",
      hmsCardNumber: entry.hmsCardNumber ?? "",
      startedAtSiteDate: entry.startedAtSiteDate
        ? new Date(entry.startedAtSiteDate).toISOString().slice(0, 10)
        : "",
      endedAtSiteDate: entry.endedAtSiteDate
        ? new Date(entry.endedAtSiteDate).toISOString().slice(0, 10)
        : "",
      notes: entry.notes ?? "",
      isActive: entry.isActive ?? true,
    });
  };

  const saveEditedEntry = async () => {
    if (!canManage) return;
    if (!editingEntryId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/construction-compliance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROSTER_ENTRY",
          rosterEntryId: editingEntryId,
          data: {
            ...entryDraft,
            employerOrgNumber: entryDraft.employerOrgNumber || null,
            hiringCompanyName: entryDraft.hiringCompanyName || null,
            hmsCardNumber: entryDraft.hmsCardNumber || null,
            startedAtSiteDate: entryDraft.startedAtSiteDate || null,
            endedAtSiteDate: entryDraft.endedAtSiteDate || null,
            notes: entryDraft.notes || null,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Could not update the site register entry");
      }
      toast({
        title: "Site register updated",
        description: "The changes have been saved.",
      });
      setEditingEntryId(null);
      await loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the site register entry.",
      });
    }
  };

  const closeRosterEntry = async (entryId: string) => {
    if (!canManage) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/construction-compliance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_ROSTER_ENTRY",
          rosterEntryId: entryId,
          endedAtSiteDate: new Date().toISOString().slice(0, 10),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Could not close the site register entry");
      }
      toast({
        title: "Entry closed",
        description: "The person is no longer active on site.",
      });
      await loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not close the site register entry.",
      });
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading CDM 2015 records...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site register</CardTitle>
          <CardDescription>
            Record everyone working on the site, including CSCS or other competence card numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
            Site attendance records are kept for 6 months after work ends
            (operational retention, not a CDM statutory period).
          </div>
          {!canManage ? (
            <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
              You have read-only access. Only HSE manager, admin, line manager or safety representative roles can edit CDM records.
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">Active on site:</span> {activeRosterCount}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={`/api/projects/${projectId}/construction-compliance?format=csv`}>
                  Export site register (CSV)
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/projects/${projectId}/construction-compliance/report`} target="_blank" rel="noreferrer">
                  Download CDM PDF
                </a>
              </Button>
            </div>
          </div>

          {data.isDailyCheckMissing ? (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Daily check is missing for today. Last recorded check: {lastCheckLabel}.
            </div>
          ) : (
            <div className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">
              Daily check is up to date. Last recorded check: {lastCheckLabel}.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Add from employees</Label>
              <Select value={selectedEmployeeId} onValueChange={fillFromEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee to pre-fill" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((employee) => (
                    <SelectItem key={employee.userId} value={employee.userId}>
                      {employee.name}
                      {employee.employeeNumber ? ` (${employee.employeeNumber})` : ""}
                      {activeRosterNameSet.has(employee.name.trim().toLowerCase()) ? " · Already active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Fills name, employer, company number and start date automatically.
              </p>
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={newEntry.fullName}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, fullName: e.target.value }))}
              />
              {selectedEmployeeId && !newEntry.birthDate ? (
                <p className="mt-1 text-xs text-amber-700">
                  Enter date of birth before recording.
                </p>
              ) : null}
            </div>
            <div>
              <Label>Date of birth *</Label>
              <Input
                type="date"
                value={newEntry.birthDate}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Employer *</Label>
              <Input
                value={newEntry.employerName}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, employerName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Employer company number</Label>
              <Input
                value={newEntry.employerOrgNumber}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, employerOrgNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Labour-hire company</Label>
              <Input
                value={newEntry.hiringCompanyName}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, hiringCompanyName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>CSCS / card number</Label>
              <Input
                value={newEntry.hmsCardNumber}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, hmsCardNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label>Start date on site</Label>
              <Input
                type="date"
                value={newEntry.startedAtSiteDate}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, startedAtSiteDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>End date on site</Label>
              <Input
                type="date"
                value={newEntry.endedAtSiteDate}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, endedAtSiteDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={newEntry.notes}
              onChange={(e) => setNewEntry((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {canManage ? <Button onClick={addRosterEntry}>Add to site register</Button> : null}

          <div className="rounded border">
            {data.rosterEntries.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No people recorded yet.</p>
            ) : (
              data.rosterEntries.map((entry) => (
                <div key={entry.id} className="border-b p-3 last:border-b-0">
                  {editingEntryId === entry.id ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 md:grid-cols-3">
                        <Input
                          value={entryDraft.fullName}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                        />
                        <Input
                          type="date"
                          value={entryDraft.birthDate}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({ ...prev, birthDate: e.target.value }))
                          }
                        />
                        <Input
                          value={entryDraft.employerName}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({ ...prev, employerName: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="CSCS / card number"
                          value={entryDraft.hmsCardNumber}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({ ...prev, hmsCardNumber: e.target.value }))
                          }
                        />
                        <Input
                          type="date"
                          value={entryDraft.startedAtSiteDate}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({ ...prev, startedAtSiteDate: e.target.value }))
                          }
                        />
                        <Input
                          type="date"
                          value={entryDraft.endedAtSiteDate}
                          onChange={(e) =>
                            setEntryDraft((prev) => ({ ...prev, endedAtSiteDate: e.target.value }))
                          }
                        />
                      </div>
                      <Textarea
                        rows={2}
                        value={entryDraft.notes}
                        onChange={(e) =>
                          setEntryDraft((prev) => ({ ...prev, notes: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEditedEntry}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingEntryId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{entry.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.employerName}
                        {entry.hmsCardNumber ? ` · Card: ${entry.hmsCardNumber}` : " · Card missing"}
                        {entry.isActive ? " · Active" : " · Closed"}
                      </p>
                      {canManage ? (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEditEntry(entry)}>
                            Edit
                          </Button>
                          {entry.isActive ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => closeRosterEntry(entry.id)}
                            >
                              Close entry
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily site register check</CardTitle>
          <CardDescription>Record the daily check of who is on site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Check date</Label>
              <Input type="date" value={dailyCheckDate} onChange={(e) => setDailyCheckDate(e.target.value)} />
            </div>
            <div>
              <Label>Comment</Label>
              <Input value={dailyCheckNotes} onChange={(e) => setDailyCheckNotes(e.target.value)} />
            </div>
          </div>
          {canManage ? (
            <Button variant="outline" onClick={registerDailyCheck}>
              Record check
            </Button>
          ) : null}
          <div className="space-y-2">
            {data.rosterChecks.map((check) => (
              <div key={check.id} className="rounded border p-2 text-sm">
                {new Date(check.checkedDate).toLocaleDateString("en-GB")}
                {" · "}
                {check.checkedBy?.name || check.checkedBy?.email || "Unknown user"}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Construction Phase Plan</CardTitle>
          <CardDescription>
            Site-specific Construction Phase Plan with organisation, programme, controls and change arrangements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Client</Label>
              <Input
                value={shaPlan.builderName}
                onChange={(e) => setShaPlan((prev) => ({ ...prev, builderName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Client contact</Label>
              <Input
                value={shaPlan.builderRepresentativeName}
                onChange={(e) =>
                  setShaPlan((prev) => ({ ...prev, builderRepresentativeName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Client contact details</Label>
              <Input
                value={shaPlan.builderRepresentativeContact}
                onChange={(e) =>
                  setShaPlan((prev) => ({ ...prev, builderRepresentativeContact: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Principal Designer</Label>
              <Input
                value={shaPlan.coordinatorPlanningName}
                onChange={(e) =>
                  setShaPlan((prev) => ({ ...prev, coordinatorPlanningName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Principal Contractor</Label>
              <Input
                value={shaPlan.coordinatorExecutionName}
                onChange={(e) =>
                  setShaPlan((prev) => ({ ...prev, coordinatorExecutionName: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Organisation / duty holders</Label>
            <Textarea
              rows={4}
              value={shaPlan.organizationChart}
              onChange={(e) => setShaPlan((prev) => ({ ...prev, organizationChart: e.target.value }))}
            />
          </div>
          <div>
            <Label>Programme (when and where work is carried out)</Label>
            <Textarea
              rows={4}
              value={shaPlan.progressPlan}
              onChange={(e) => setShaPlan((prev) => ({ ...prev, progressPlan: e.target.value }))}
            />
          </div>
          <div>
            <Label>Site-specific controls (CDM 2015)</Label>
            <Textarea
              rows={4}
              value={shaPlan.specificMeasures}
              onChange={(e) => setShaPlan((prev) => ({ ...prev, specificMeasures: e.target.value }))}
            />
          </div>
          <div>
            <Label>Arrangements for changing and updating the Construction Phase Plan</Label>
            <Textarea
              rows={3}
              value={shaPlan.changeProcedure}
              onChange={(e) => setShaPlan((prev) => ({ ...prev, changeProcedure: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={shaPlan.conflictAssessmentDocumented}
                onCheckedChange={(checked) =>
                  setShaPlan((prev) => ({ ...prev, conflictAssessmentDocumented: checked === true }))
                }
              />
              <span className="text-sm">Competence and appointment of duty holders is recorded</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={shaPlan.availableOnSite}
                onCheckedChange={(checked) =>
                  setShaPlan((prev) => ({ ...prev, availableOnSite: checked === true }))
                }
              />
              <span className="text-sm">Construction Phase Plan is available on site</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>F10 notification to HSE</CardTitle>
          <CardDescription>
            Record the particulars needed for F10 if the work lasts more than 30 working days with more than 20 workers, or exceeds 500 person days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.preNotificationRequirement?.isRequired ? (
            <div
              className={`rounded border p-3 text-sm ${
                data.preNotificationRequirement.isDeadlinePassed
                  ? "border-red-300 bg-red-50 text-red-900"
                  : data.preNotificationRequirement.isDeadlineSoon
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-blue-300 bg-blue-50 text-blue-900"
              }`}
            >
              <p className="font-medium">F10 notification is required (CDM 2015 reg. 6)</p>
              <p>Reason: {data.preNotificationRequirement.reasons.join(" / ")}</p>
              {data.preNotificationRequirement.workDays !== null ? (
                <p>Estimated duration: {data.preNotificationRequirement.workDays} working days</p>
              ) : null}
              {data.preNotificationRequirement.estimatedWorkerDays !== null ? (
                <p>Estimated workload: {data.preNotificationRequirement.estimatedWorkerDays} person days</p>
              ) : null}
              {submissionDeadlineLabel ? <p>Notify HSE before: {submissionDeadlineLabel}</p> : null}
            </div>
          ) : (
            <div className="rounded border border-muted bg-muted/20 p-3 text-sm text-muted-foreground">
              Not notifiable on the current estimate. Update dates and headcount if the programme changes.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Site address</Label>
              <Input
                value={preNotification.projectAddress}
                onChange={(e) =>
                  setPreNotification((prev) => ({ ...prev, projectAddress: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Description of the project</Label>
              <Input
                value={preNotification.projectType}
                onChange={(e) => setPreNotification((prev) => ({ ...prev, projectType: e.target.value }))}
              />
            </div>
            <div>
              <Label>Client name</Label>
              <Input
                value={preNotification.builderName}
                onChange={(e) => setPreNotification((prev) => ({ ...prev, builderName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Client company number</Label>
              <Input
                value={preNotification.builderOrgNumber}
                onChange={(e) =>
                  setPreNotification((prev) => ({ ...prev, builderOrgNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Client address</Label>
              <Input
                value={preNotification.builderAddress}
                onChange={(e) =>
                  setPreNotification((prev) => ({ ...prev, builderAddress: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Client telephone</Label>
              <Input
                value={preNotification.builderPhone}
                onChange={(e) =>
                  setPreNotification((prev) => ({ ...prev, builderPhone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={preNotification.expectedStartDate}
                onChange={(e) =>
                  setPreNotification((prev) => ({ ...prev, expectedStartDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>End date</Label>
              <Input
                type="date"
                value={preNotification.expectedEndDate}
                onChange={(e) =>
                  setPreNotification((prev) => ({ ...prev, expectedEndDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Expected maximum workers on site at any one time</Label>
              <Input
                type="number"
                min={1}
                value={preNotification.maxWorkersSimultaneous}
                onChange={(e) =>
                  setPreNotification((prev) => ({
                    ...prev,
                    maxWorkersSimultaneous: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Planned number of contractors</Label>
              <Input
                type="number"
                min={1}
                value={preNotification.plannedBusinessesCount}
                onChange={(e) =>
                  setPreNotification((prev) => ({
                    ...prev,
                    plannedBusinessesCount: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Principal Designer / Principal Contractor and contacts</Label>
            <Textarea
              rows={3}
              value={preNotification.coordinators}
              onChange={(e) => setPreNotification((prev) => ({ ...prev, coordinators: e.target.value }))}
            />
          </div>
          <div>
            <Label>Designers</Label>
            <Textarea
              rows={3}
              value={preNotification.designers}
              onChange={(e) => setPreNotification((prev) => ({ ...prev, designers: e.target.value }))}
            />
          </div>
          <div>
            <Label>Contractors</Label>
            <Textarea
              rows={3}
              value={preNotification.contractors}
              onChange={(e) => setPreNotification((prev) => ({ ...prev, contractors: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={preNotification.visibleAtSite}
              onCheckedChange={(checked) =>
                setPreNotification((prev) => ({ ...prev, visibleAtSite: checked === true }))
              }
            />
            <span className="text-sm">Updated F10 is displayed on site</span>
          </div>
        </CardContent>
      </Card>

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={saveCompliance} disabled={saving}>
            {saving ? "Saving..." : "Save CDM 2015 records"}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Compliance status</CardTitle>
          <CardDescription>
            Required checks before the Construction Phase Plan is set active and before F10 is marked as submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded border p-3">
            <p className="font-medium">Construction Phase Plan ready to set active</p>
            <p
              className={
                data.complianceValidation?.shaReadyForActive ? "text-green-700" : "text-amber-700"
              }
            >
              {data.complianceValidation?.shaReadyForActive ? "Yes" : "No"}
            </p>
            {!data.complianceValidation?.shaReadyForActive &&
            data.complianceValidation?.shaMissingFieldsForActive?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Missing: {data.complianceValidation.shaMissingFieldsForActive.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="rounded border p-3">
            <p className="font-medium">F10 ready for submission</p>
            <p
              className={
                data.complianceValidation?.preNotificationReadyForSubmission
                  ? "text-green-700"
                  : "text-amber-700"
              }
            >
              {data.complianceValidation?.preNotificationReadyForSubmission ? "Yes" : "No"}
            </p>
            {!data.complianceValidation?.preNotificationReadyForSubmission &&
            data.complianceValidation?.preNotificationMissingFieldsForSubmission?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Missing: {data.complianceValidation.preNotificationMissingFieldsForSubmission.join(", ")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change history (CPP and F10)</CardTitle>
          <CardDescription>Shows who changed what and when.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data.changeLogs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes logged yet.</p>
          ) : (
            (data.changeLogs ?? []).map((entry) => (
              <div key={entry.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {entry.action === "CONSTRUCTION_SHA_PLAN_UPDATED" ? "Construction Phase Plan updated" : "F10 updated"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString("en-GB")} · {entry.changedBy}
                </p>
                {entry.metadata?.changedFields?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {entry.metadata.changedFields.slice(0, 8).map((field) => (
                      <li key={`${entry.id}-${field.field}`}>
                        {changeFieldLabels[field.field] ?? field.field}: {formatChangeValue(field.from)} →{" "}
                        {formatChangeValue(field.to)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
