"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PROJECT_REFERENCE_MAX_LENGTH } from "@/lib/incident-project-reference";

interface SubcategoryOption {
  id: string;
  key: string;
  label: string;
  industry: string;
}

interface IncidentTreatmentFormProps {
  incidentId: string;
  currentType: string;
  currentSubcategoryKeys: string[];
  currentProjectId: string | null;
  currentProjectReference: string | null;
  currentStatus: string;
  currentSeverity: number | null;
  currentResponsibleId: string | null;
  currentMedicalAttentionRequired: boolean;
  currentIsFatal: boolean;
  currentIsLostTimeIncident: boolean;
  currentLostWorkdays: number | null;
  currentIsRestrictedWork: boolean;
  currentIsFirstAidCase: boolean;
  currentIsProductionStop: boolean;
  currentProductionStopHours: number | null;
  currentIsPropertyDamage: boolean;
  currentEstimatedDamageCost: number | null;
  currentIsEnvironmentalRelease: boolean;
  currentEnvironmentalDescription: string | null;
  currentSource: string;
  currentInvolvedPersons: string | null;
  currentInjuryType: string | null;
  currentInjuryDescription: string | null;
  currentSuggestedActions: string | null;
  currentInjuredPersonOccupation?: string | null;
  currentInjuredPersonAddress?: string | null;
  currentInjuredPersonRole?: string | null;
  currentWitnessName?: string | null;
  currentWitnessAddress?: string | null;
  currentShareWithSafetyRepsConsent?: boolean;
  currentReporterAcknowledged?: boolean;
  currentOverSevenDayInjury: boolean;
  currentOverThreeDayInjury?: boolean;
  currentSpecifiedInjury?: boolean;
  currentListedOccupationalDisease?: boolean;
  currentListedDangerousOccurrence?: boolean;
  currentNonWorkerTakenToHospital?: boolean;
  currentRiddorReportedAt?: Date | string | null;
  currentRiddorReference?: string | null;
  currentRiddorReportMethod?: string | null;
  currentLocation?: string | null;
  showProjectFields?: boolean;
  users: Array<{ id: string; name: string | null; email: string }>;
  projects: Array<{ id: string; name: string; code: string | null; status: string }>;
}

const NO_PROJECT_VALUE = "__none_project__";

// Alvorlighetsgrad er valgfri – leder kan la den stå åpen til vurderingen er gjort
const NOT_ASSESSED_SEVERITY_VALUE = "__not_assessed__";

function severityToSelectValue(severity: number | null): string {
  return severity === null ? NOT_ASSESSED_SEVERITY_VALUE : severity.toString();
}

function toDatetimeLocalValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function IncidentTreatmentForm({
  incidentId,
  currentType,
  currentSubcategoryKeys,
  currentProjectId,
  currentProjectReference,
  currentStatus,
  currentSeverity,
  currentResponsibleId,
  currentMedicalAttentionRequired,
  currentIsFatal,
  currentIsLostTimeIncident,
  currentLostWorkdays,
  currentIsRestrictedWork,
  currentIsFirstAidCase,
  currentIsProductionStop,
  currentProductionStopHours,
  currentIsPropertyDamage,
  currentEstimatedDamageCost,
  currentIsEnvironmentalRelease,
  currentEnvironmentalDescription,
  currentSource,
  currentInvolvedPersons,
  currentInjuryType,
  currentInjuryDescription,
  currentSuggestedActions,
  currentInjuredPersonOccupation = null,
  currentInjuredPersonAddress = null,
  currentInjuredPersonRole = null,
  currentWitnessName = null,
  currentWitnessAddress = null,
  currentShareWithSafetyRepsConsent = false,
  currentReporterAcknowledged = false,
  currentOverSevenDayInjury,
  currentOverThreeDayInjury = false,
  currentSpecifiedInjury = false,
  currentListedOccupationalDisease = false,
  currentListedDangerousOccurrence = false,
  currentNonWorkerTakenToHospital = false,
  currentRiddorReportedAt = null,
  currentRiddorReference = null,
  currentRiddorReportMethod = null,
  currentLocation = null,
  showProjectFields = false,
  users,
  projects,
}: IncidentTreatmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [type, setType] = useState(currentType);
  const [source, setSource] = useState(currentSource || "INTERNAL");
  const [subcategoryOptions, setSubcategoryOptions] = useState<SubcategoryOption[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    currentSubcategoryKeys
  );
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [severity, setSeverity] = useState(severityToSelectValue(currentSeverity));
  const [projectId, setProjectId] = useState(currentProjectId ?? NO_PROJECT_VALUE);
  const [projectReference, setProjectReference] = useState(currentProjectReference ?? "");
  const [responsibleId, setResponsibleId] = useState(currentResponsibleId || "NONE");
  const [location, setLocation] = useState(currentLocation ?? "");
  const [medicalAttentionRequired, setMedicalAttentionRequired] = useState(currentMedicalAttentionRequired);
  const [isFatal, setIsFatal] = useState(currentIsFatal);
  const [isLostTimeIncident, setIsLostTimeIncident] = useState(currentIsLostTimeIncident);
  const [lostWorkdays, setLostWorkdays] = useState(
    typeof currentLostWorkdays === "number" ? currentLostWorkdays.toString() : ""
  );
  const [isRestrictedWork, setIsRestrictedWork] = useState(currentIsRestrictedWork);
  const [isFirstAidCase, setIsFirstAidCase] = useState(currentIsFirstAidCase);
  const [isProductionStop, setIsProductionStop] = useState(currentIsProductionStop);
  const [productionStopHours, setProductionStopHours] = useState(
    typeof currentProductionStopHours === "number" ? currentProductionStopHours.toString() : ""
  );
  const [isPropertyDamage, setIsPropertyDamage] = useState(currentIsPropertyDamage);
  const [estimatedDamageCost, setEstimatedDamageCost] = useState(
    typeof currentEstimatedDamageCost === "number" ? currentEstimatedDamageCost.toString() : ""
  );
  const [isEnvironmentalRelease, setIsEnvironmentalRelease] = useState(currentIsEnvironmentalRelease);
  const [environmentalDescription, setEnvironmentalDescription] = useState(
    currentEnvironmentalDescription ?? ""
  );
  const [involvedPersons, setInvolvedPersons] = useState(currentInvolvedPersons ?? "");
  const [injuryType, setInjuryType] = useState(currentInjuryType ?? "");
  const [injuryDescription, setInjuryDescription] = useState(currentInjuryDescription ?? "");
  const [suggestedActions, setSuggestedActions] = useState(currentSuggestedActions ?? "");
  const [injuredPersonOccupation, setInjuredPersonOccupation] = useState(currentInjuredPersonOccupation ?? "");
  const [injuredPersonAddress, setInjuredPersonAddress] = useState(currentInjuredPersonAddress ?? "");
  const [injuredPersonRole, setInjuredPersonRole] = useState(currentInjuredPersonRole ?? "employee");
  const [witnessName, setWitnessName] = useState(currentWitnessName ?? "");
  const [witnessAddress, setWitnessAddress] = useState(currentWitnessAddress ?? "");
  const [shareWithSafetyRepsConsent, setShareWithSafetyRepsConsent] = useState(currentShareWithSafetyRepsConsent);
  const [reporterAcknowledged, setReporterAcknowledged] = useState(currentReporterAcknowledged);
  const [overSevenDayInjury, setOverSevenDayInjury] = useState(currentOverSevenDayInjury);
  const [overThreeDayInjury, setOverThreeDayInjury] = useState(currentOverThreeDayInjury);
  const [specifiedInjury, setSpecifiedInjury] = useState(currentSpecifiedInjury);
  const [listedOccupationalDisease, setListedOccupationalDisease] = useState(currentListedOccupationalDisease);
  const [listedDangerousOccurrence, setListedDangerousOccurrence] = useState(currentListedDangerousOccurrence);
  const [nonWorkerTakenToHospital, setNonWorkerTakenToHospital] = useState(currentNonWorkerTakenToHospital);
  const [riddorReportedAt, setRiddorReportedAt] = useState(toDatetimeLocalValue(currentRiddorReportedAt));
  const [riddorReference, setRiddorReference] = useState(currentRiddorReference ?? "");
  const [riddorReportMethod, setRiddorReportMethod] = useState(currentRiddorReportMethod ?? "");
  const requiresHseCompletion = status !== "OPEN";
  const lostWorkdaysValue = lostWorkdays.trim();
  const isLostWorkdaysInvalid =
    requiresHseCompletion && isLostTimeIncident && lostWorkdaysValue.length === 0;
  const isFormInvalid = isUpdating || isLostWorkdaysInvalid;
  const normalizedInitialSubcategories = useMemo(
    () => [...currentSubcategoryKeys].sort().join("|"),
    [currentSubcategoryKeys]
  );
  const normalizedSelectedSubcategories = useMemo(
    () => [...selectedSubcategories].sort().join("|"),
    [selectedSubcategories]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchSubcategories = async () => {
      setLoadingSubcategories(true);
      try {
        const response = await fetch(`/api/incidents/subcategories?type=${type}`);
        if (!response.ok) {
          if (isMounted) {
            setSubcategoryOptions([]);
          }
          return;
        }
        const data = (await response.json()) as { options?: SubcategoryOption[] };
        if (!isMounted) {
          return;
        }
        const options = data.options ?? [];
        setSubcategoryOptions(options);
        setSelectedSubcategories((previous) =>
          previous.filter((key) => options.some((option) => option.key === key))
        );
      } catch {
        if (isMounted) {
          setSubcategoryOptions([]);
        }
      } finally {
        if (isMounted) {
          setLoadingSubcategories(false);
        }
      }
    };

    fetchSubcategories();

    return () => {
      isMounted = false;
    };
  }, [type]);

  function toggleSubcategory(key: string) {
    setSelectedSubcategories((previous) =>
      previous.includes(key)
        ? previous.filter((existingKey) => existingKey !== key)
        : [...previous, key]
    );
  }

  async function handleUpdate() {
    if (isLostWorkdaysInvalid) {
      toast({
        title: "Missing HSE data",
        description: "Enter lost workdays when a lost-time injury is selected.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/incidents/${incidentId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subcategoryKeys: selectedSubcategories,
          projectId: projectId === NO_PROJECT_VALUE ? null : projectId,
          projectReference: projectReference.trim() || null,
          status,
          severity:
            severity === NOT_ASSESSED_SEVERITY_VALUE ? null : parseInt(severity, 10),
          responsibleId: responsibleId === "NONE" ? null : responsibleId,
          medicalAttentionRequired,
          isFatal,
          isLostTimeIncident,
          lostWorkdays: lostWorkdaysValue.length > 0 ? parseInt(lostWorkdaysValue, 10) : null,
          isRestrictedWork,
          isFirstAidCase,
          isProductionStop,
          productionStopHours: productionStopHours.trim().length > 0 ? parseFloat(productionStopHours) : null,
          isPropertyDamage,
          estimatedDamageCost: estimatedDamageCost.trim().length > 0 ? parseFloat(estimatedDamageCost) : null,
          isEnvironmentalRelease,
          environmentalDescription: environmentalDescription.trim() || null,
          involvedPersons: involvedPersons.trim() || null,
          injuredPersonOccupation: injuredPersonOccupation.trim() || null,
          injuredPersonAddress: injuredPersonAddress.trim() || null,
          injuredPersonRole: injuredPersonRole || null,
          witnessName: witnessName.trim() || null,
          witnessAddress: witnessAddress.trim() || null,
          shareWithSafetyRepsConsent,
          reporterAcknowledged,
          injuryType: injuryType.trim() || null,
          injuryDescription: injuryDescription.trim() || null,
          suggestedActions: suggestedActions.trim() || null,
          overSevenDayInjury,
          overThreeDayInjury,
          specifiedInjury,
          listedOccupationalDisease,
          listedDangerousOccurrence,
          nonWorkerTakenToHospital,
          source,
          location: location.trim() || null,
          riddorReportedAt: riddorReportedAt ? new Date(riddorReportedAt).toISOString() : null,
          riddorReference: riddorReference.trim() || null,
          riddorReportMethod: riddorReportMethod || null,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not update incident");
      }

      toast({
        title: "Updated",
        description: "The incident has been updated",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update the incident. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const hasChanges =
    type !== currentType ||
    normalizedSelectedSubcategories !== normalizedInitialSubcategories ||
    projectId !== (currentProjectId ?? NO_PROJECT_VALUE) ||
    projectReference.trim() !== (currentProjectReference ?? "") ||
    status !== currentStatus ||
    severity !== severityToSelectValue(currentSeverity) ||
    responsibleId !== (currentResponsibleId || "NONE") ||
    location.trim() !== (currentLocation ?? "") ||
    medicalAttentionRequired !== currentMedicalAttentionRequired ||
    isFatal !== currentIsFatal ||
    isLostTimeIncident !== currentIsLostTimeIncident ||
    lostWorkdays !== (typeof currentLostWorkdays === "number" ? currentLostWorkdays.toString() : "") ||
    isRestrictedWork !== currentIsRestrictedWork ||
    isFirstAidCase !== currentIsFirstAidCase ||
    isProductionStop !== currentIsProductionStop ||
    productionStopHours !== (typeof currentProductionStopHours === "number" ? currentProductionStopHours.toString() : "") ||
    isPropertyDamage !== currentIsPropertyDamage ||
    estimatedDamageCost !== (typeof currentEstimatedDamageCost === "number" ? currentEstimatedDamageCost.toString() : "") ||
    isEnvironmentalRelease !== currentIsEnvironmentalRelease ||
    environmentalDescription !== (currentEnvironmentalDescription ?? "") ||
    involvedPersons !== (currentInvolvedPersons ?? "") ||
    injuredPersonOccupation !== (currentInjuredPersonOccupation ?? "") ||
    injuredPersonAddress !== (currentInjuredPersonAddress ?? "") ||
    injuredPersonRole !== (currentInjuredPersonRole ?? "employee") ||
    witnessName !== (currentWitnessName ?? "") ||
    witnessAddress !== (currentWitnessAddress ?? "") ||
    shareWithSafetyRepsConsent !== currentShareWithSafetyRepsConsent ||
    reporterAcknowledged !== currentReporterAcknowledged ||
    injuryType !== (currentInjuryType ?? "") ||
    injuryDescription !== (currentInjuryDescription ?? "") ||
    suggestedActions !== (currentSuggestedActions ?? "") ||
    overSevenDayInjury !== currentOverSevenDayInjury ||
    overThreeDayInjury !== currentOverThreeDayInjury ||
    specifiedInjury !== currentSpecifiedInjury ||
    listedOccupationalDisease !== currentListedOccupationalDisease ||
    listedDangerousOccurrence !== currentListedDangerousOccurrence ||
    nonWorkerTakenToHospital !== currentNonWorkerTakenToHospital ||
    riddorReportedAt !== toDatetimeLocalValue(currentRiddorReportedAt) ||
    riddorReference.trim() !== (currentRiddorReference ?? "") ||
    riddorReportMethod !== (currentRiddorReportMethod ?? "") ||
    source !== (currentSource || "INTERNAL");

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Incident type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ULYKKE">Accident / injury (RIDDOR)</SelectItem>
              <SelectItem value="NESTEN">Near miss</SelectItem>
              <SelectItem value="FARLIG_SITUASJON">Unsafe condition / dangerous occurrence</SelectItem>
              <SelectItem value="YRKESSYKDOM">Occupational disease</SelectItem>
              <SelectItem value="AVVIK">Non-conformance</SelectItem>
              <SelectItem value="MILJO">Environmental incident</SelectItem>
              <SelectItem value="KVALITET">Quality non-conformance</SelectItem>
              <SelectItem value="CUSTOMER">Customer complaint</SelectItem>
              <SelectItem value="HMS">H&S non-conformance</SelectItem>
              <SelectItem value="SKADE">Personal injury (legacy)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="INVESTIGATING">Under investigation</SelectItem>
              <SelectItem value="ACTION_TAKEN">Action started</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Severity</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NOT_ASSESSED_SEVERITY_VALUE}>Not assessed</SelectItem>
              <SelectItem value="1">1 - Negligible</SelectItem>
              <SelectItem value="2">2 - Minor</SelectItem>
              <SelectItem value="3">3 - Moderate</SelectItem>
              <SelectItem value="4">4 - Serious</SelectItem>
              <SelectItem value="5">5 - Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INTERNAL">Internal</SelectItem>
              <SelectItem value="EXTERNAL">External</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showProjectFields && (
        <>
          <div>
            <Label className="mb-2 block">Linked project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT_VALUE}>None / not project-related</SelectItem>
                {projects
                  .filter((project) => project.status === "ACTIVE" || project.status === "PLANNING")
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                      {project.code ? ` (${project.code})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="projectReference" className="mb-2 block">
              Project number / reference
            </Label>
            <Input
              id="projectReference"
              value={projectReference}
              onChange={(event) => setProjectReference(event.target.value)}
              placeholder="e.g. 24-1187 or 12 Main Street"
              maxLength={PROJECT_REFERENCE_MAX_LENGTH}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use when the job is not registered as a project.
            </p>
          </div>
        </>
      )}

      <div>
        <Label className="mb-2 block">Place of accident (BI 510)</Label>
        <Input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Room, site or workplace where it happened"
        />
      </div>

      <div>
        <Label className="mb-2 block">Responsible for follow-up</Label>
        <Select value={responsibleId} onValueChange={setResponsibleId}>
          <SelectTrigger>
            <SelectValue placeholder="Select owner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Not assigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <Label className="block">
          The incident concerns
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (select one or more)
          </span>
        </Label>
        {loadingSubcategories ? (
          <p className="text-xs text-muted-foreground">Loading categories...</p>
        ) : subcategoryOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No subcategories for the selected type.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 rounded-lg border bg-muted/30 p-3">
            {subcategoryOptions.map((option) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-center gap-2 select-none"
              >
                <Checkbox
                  checked={selectedSubcategories.includes(option.key)}
                  onCheckedChange={() => toggleSubcategory(option.key)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <Label className="block font-semibold">Accident book (BI 510)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Social Security (Claims and Payments) Regulations 1979 — name, occupation, address and nature of injury.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="involvedPersons">Injured / involved person — full name *</Label>
            <Input
              id="involvedPersons"
              value={involvedPersons}
              onChange={(event) => setInvolvedPersons(event.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="injuredPersonOccupation">Occupation *</Label>
            <Input
              id="injuredPersonOccupation"
              value={injuredPersonOccupation}
              onChange={(event) => setInjuredPersonOccupation(event.target.value)}
              placeholder="Job title or occupation"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="injuredPersonAddress">Address *</Label>
            <Input
              id="injuredPersonAddress"
              value={injuredPersonAddress}
              onChange={(event) => setInjuredPersonAddress(event.target.value)}
              placeholder="Home or work address"
            />
          </div>
          <div className="space-y-2">
            <Label>Person&apos;s role</Label>
            <Select value={injuredPersonRole} onValueChange={setInjuredPersonRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="member_of_public">Member of the public</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="injuryType">Injury type</Label>
            <Input
              id="injuryType"
              value={injuryType}
              onChange={(event) => setInjuryType(event.target.value)}
              placeholder="e.g. cut, crush, fracture"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="injuryDescription">Cause and nature of injury *</Label>
          <Textarea
            id="injuryDescription"
            value={injuryDescription}
            onChange={(event) => setInjuryDescription(event.target.value)}
            rows={3}
            placeholder="What caused the injury, body part and treatment"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="witnessName">Witness name</Label>
            <Input id="witnessName" value={witnessName} onChange={(event) => setWitnessName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="witnessAddress">Witness address</Label>
            <Input id="witnessAddress" value={witnessAddress} onChange={(event) => setWitnessAddress(event.target.value)} />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={shareWithSafetyRepsConsent}
            onCheckedChange={(checked) => setShareWithSafetyRepsConsent(!!checked)}
            className="mt-0.5"
          />
          <span>
            Consent to share this personal information with safety representatives (BI 510; SRSCWR 1977; UK GDPR).
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={reporterAcknowledged}
            onCheckedChange={(checked) => setReporterAcknowledged(!!checked)}
            className="mt-0.5"
          />
          <span>This accident book entry is an accurate record of the event.</span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="suggestedActions">Suggested actions</Label>
          <Textarea
            id="suggestedActions"
            value={suggestedActions}
            onChange={(event) => setSuggestedActions(event.target.value)}
            rows={3}
            placeholder="Actions to prevent recurrence"
          />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <Label className="block font-semibold">RIDDOR 2013 — competent person</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Confirm the legal category. This does not send the report to HSE — record how you reported it.
          </p>
        </div>

        {isFatal && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            Death arising from work: call the Incident Contact Centre immediately on{" "}
            <a className="font-semibold underline" href="tel:03453009923">
              0345 300 9923
            </a>
            , then complete the online report. Do not wait for the investigation.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isFatal}
              onCheckedChange={(checked) => setIsFatal(!!checked)}
            />
            <span className="text-sm">Fatality — report without delay</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={specifiedInjury}
              onCheckedChange={(checked) => setSpecifiedInjury(!!checked)}
            />
            <span className="text-sm">Specified injury (Schedule 1) — 10 days</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={nonWorkerTakenToHospital}
              onCheckedChange={(checked) => setNonWorkerTakenToHospital(!!checked)}
            />
            <span className="text-sm">Non-worker taken from the scene to hospital</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={overSevenDayInjury}
              onCheckedChange={(checked) => setOverSevenDayInjury(!!checked)}
            />
            <span className="text-sm">Over-seven-day injury — report within 15 days</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={overThreeDayInjury}
              onCheckedChange={(checked) => setOverThreeDayInjury(!!checked)}
            />
            <span className="text-sm">Over-three-day injury (record only, not reportable)</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={listedOccupationalDisease}
              onCheckedChange={(checked) => setListedOccupationalDisease(!!checked)}
            />
            <span className="text-sm">Listed occupational disease (reg. 8)</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={listedDangerousOccurrence}
              onCheckedChange={(checked) => setListedDangerousOccurrence(!!checked)}
            />
            <span className="text-sm">Listed dangerous occurrence (Schedule 2)</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={medicalAttentionRequired}
              onCheckedChange={(checked) => setMedicalAttentionRequired(!!checked)}
            />
            <span className="text-sm">Medical treatment given (not by itself RIDDOR)</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isLostTimeIncident}
              onCheckedChange={(checked) => {
                const nextValue = !!checked;
                setIsLostTimeIncident(nextValue);
                if (!nextValue) {
                  setLostWorkdays("");
                }
              }}
            />
            <span className="text-sm">Lost time injury</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Specified injuries:{" "}
          <a
            href="https://www.hse.gov.uk/riddor/specified-injuries.htm"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            hse.gov.uk/riddor/specified-injuries
          </a>
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lostWorkdays">Lost workdays</Label>
            <Input
              id="lostWorkdays"
              type="number"
              min={0}
              value={lostWorkdays}
              onChange={(event) => setLostWorkdays(event.target.value)}
              disabled={!isLostTimeIncident}
              placeholder="Number of lost workdays"
            />
            {isLostWorkdaysInvalid && (
              <p className="text-xs text-red-600">
                Lost workdays must be entered when a lost-time injury is selected.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>How was it reported to HSE?</Label>
            <Select
              value={riddorReportMethod || "__none__"}
              onValueChange={(value) => setRiddorReportMethod(value === "__none__" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Not yet reported" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Not yet reported</SelectItem>
                <SelectItem value="phone">Telephone — 0345 300 9923</SelectItem>
                <SelectItem value="online">Online — hse.gov.uk/riddor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="riddorReportedAt">Date reported to HSE</Label>
            <Input
              id="riddorReportedAt"
              type="datetime-local"
              value={riddorReportedAt}
              onChange={(event) => setRiddorReportedAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="riddorReference">HSE / Incident Contact Centre reference</Label>
            <Input
              id="riddorReference"
              value={riddorReference}
              onChange={(event) => setRiddorReference(event.target.value)}
              placeholder="Reference from HSE"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <Label className="block font-semibold">Optional HSE statistics (TRIR)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            For client reporting. Not a RIDDOR duty.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isRestrictedWork}
              onCheckedChange={(checked) => setIsRestrictedWork(!!checked)}
            />
            <span className="text-sm">Restricted work</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isFirstAidCase}
              onCheckedChange={(checked) => setIsFirstAidCase(!!checked)}
            />
            <span className="text-sm">First aid given</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <Label className="block font-semibold">Production and property</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Optional — not required for the accident book.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isProductionStop}
              onCheckedChange={(checked) => {
                const nextValue = !!checked;
                setIsProductionStop(nextValue);
                if (!nextValue) setProductionStopHours("");
              }}
            />
            <span className="text-sm">Production stop</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isPropertyDamage}
              onCheckedChange={(checked) => {
                const nextValue = !!checked;
                setIsPropertyDamage(nextValue);
                if (!nextValue) setEstimatedDamageCost("");
              }}
            />
            <span className="text-sm">Property damage</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isEnvironmentalRelease}
              onCheckedChange={(checked) => {
                const nextValue = !!checked;
                setIsEnvironmentalRelease(nextValue);
                if (!nextValue) setEnvironmentalDescription("");
              }}
            />
            <span className="text-sm">Environmental release</span>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productionStopHours">Production stop hours</Label>
            <Input
              id="productionStopHours"
              type="number"
              min={0}
              step={0.5}
              value={productionStopHours}
              onChange={(event) => setProductionStopHours(event.target.value)}
              disabled={!isProductionStop}
              placeholder="e.g. 4.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedDamageCost">Estimated damage cost (£)</Label>
            <Input
              id="estimatedDamageCost"
              type="number"
              min={0}
              step={100}
              value={estimatedDamageCost}
              onChange={(event) => setEstimatedDamageCost(event.target.value)}
              disabled={!isPropertyDamage}
              placeholder="e.g. 50000"
            />
          </div>
        </div>

        {isEnvironmentalRelease && (
          <div className="space-y-2">
            <Label htmlFor="environmentalDescription">Environmental release description</Label>
            <Input
              id="environmentalDescription"
              value={environmentalDescription}
              onChange={(event) => setEnvironmentalDescription(event.target.value)}
              placeholder="Type of release, quantity and consequence"
            />
          </div>
        )}
      </div>

      {hasChanges && (
        <Button onClick={handleUpdate} disabled={isFormInvalid} className="w-full">
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      )}
    </div>
  );
}

