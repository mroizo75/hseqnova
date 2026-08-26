"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createIncident } from "@/server/actions/incident.actions";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  X,
  AlertTriangle,
  WifiOff,
  CloudUpload,
} from "lucide-react";
import Image from "next/image";
import type { IncidentType } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  getIncidentTypeGroup,
  getIncidentTypeGroups,
  getIncidentTypesForGroup,
  getIncidentTypeLabel,
  getSingleTypeForGroup,
  type IncidentTypeGroup,
} from "@/features/incidents/schemas/incident.schema";
import { PROJECT_REFERENCE_MAX_LENGTH } from "@/lib/incident-project-reference";

function toLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

interface IncidentFormProps {
  tenantId: string;
  userId: string;
  /** Kept for callers; risk linking is done when the record is handled (HSG245). */
  risks?: Array<{ id: string; title: string; category: string; score: number }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  projects: Array<{ id: string; name: string; code: string | null; status: string }>;
  defaultType?: IncidentType;
  defaultProjectId?: string;
  isTabletMode?: boolean;
  templatePreset?: "homeVisitRisk" | "violenceThreat" | "infectionExposure";
  ruhModuleEnabled?: boolean;
  showProjectFields?: boolean;
}

interface OfflineIncidentQueueItem {
  id: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

interface TemplatePresetDefaults {
  type: IncidentType;
  titleKey: string;
  descriptionKey: string;
  locationKey: string;
  immediateActionKey: string;
}

const OFFLINE_INCIDENT_QUEUE_KEY = "hmsnova.offline.incidentQueue.v1";

const HMS_TYPES: IncidentType[] = ["ULYKKE", "NESTEN", "FARLIG_SITUASJON", "YRKESSYKDOM"];
const INJURY_TYPES: IncidentType[] = ["ULYKKE", "YRKESSYKDOM", "SKADE"];

const NO_PROJECT_VALUE = "__none_project__";

export function IncidentForm({
  tenantId,
  userId,
  users = [],
  projects = [],
  defaultType,
  defaultProjectId,
  isTabletMode = false,
  templatePreset,
  ruhModuleEnabled = false,
  showProjectFields = false,
}: IncidentFormProps) {
  const t = useTranslations("incidentForm");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [typeGroup, setTypeGroup] = useState<IncidentTypeGroup | null>(
    getIncidentTypeGroup(defaultType || "", ruhModuleEnabled)
  );
  const [selectedType, setSelectedType] = useState<IncidentType | "">(
    defaultType || ""
  );

  const groups = getIncidentTypeGroups(ruhModuleEnabled);
  const typesInGroup = typeGroup
    ? getIncidentTypesForGroup(typeGroup, ruhModuleEnabled)
    : [];
  const needsTypeChoice = typesInGroup.length > 1;

  function handleTypeGroupChange(group: IncidentTypeGroup) {
    setTypeGroup(group);
    // Grupper med bare én type velger typen direkte, slik at steg 2 kan hoppes over
    setSelectedType(getSingleTypeForGroup(group, ruhModuleEnabled) ?? "");
  }
  const NO_REPORTED_FOR_VALUE = "__none__";
  const [reportedForUserId, setReportedForUserId] = useState<string>(
    NO_REPORTED_FOR_VALUE
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Prosjektvelger
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId ?? NO_PROJECT_VALUE
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState(false);
  const [immediateActionValue, setImmediateActionValue] = useState("");

  const templateDefaults: Record<
    NonNullable<IncidentFormProps["templatePreset"]>,
    TemplatePresetDefaults
  > = {
    homeVisitRisk: {
      type: "FARLIG_SITUASJON",
      titleKey: "templates.homeVisitRisk.title",
      descriptionKey: "templates.homeVisitRisk.description",
      locationKey: "templates.homeVisitRisk.location",
      immediateActionKey: "templates.homeVisitRisk.immediateAction",
    },
    violenceThreat: {
      type: "ULYKKE",
      titleKey: "templates.violenceThreat.title",
      descriptionKey: "templates.violenceThreat.description",
      locationKey: "templates.violenceThreat.location",
      immediateActionKey: "templates.violenceThreat.immediateAction",
    },
    infectionExposure: {
      type: "FARLIG_SITUASJON",
      titleKey: "templates.infectionExposure.title",
      descriptionKey: "templates.infectionExposure.description",
      locationKey: "templates.infectionExposure.location",
      immediateActionKey: "templates.infectionExposure.immediateAction",
    },
  };
  const activeTemplate = templatePreset ? templateDefaults[templatePreset] : null;

  const isHmsType = selectedType ? HMS_TYPES.includes(selectedType as IncidentType) : false;
  const isInjuryEvent = selectedType ? INJURY_TYPES.includes(selectedType as IncidentType) : false;
  const isCustomerType = selectedType === "CUSTOMER";

  useEffect(() => {
    if (!isTabletMode || typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(OFFLINE_INCIDENT_QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as OfflineIncidentQueueItem[]) : [];
      setOfflineQueueCount(queue.length);
    } catch {
      setOfflineQueueCount(0);
    }
  }, [isTabletMode]);

  useEffect(() => {
    if (!selectedType && activeTemplate?.type) {
      setTypeGroup(getIncidentTypeGroup(activeTemplate.type, ruhModuleEnabled));
      setSelectedType(activeTemplate.type);
    }
  }, [activeTemplate, selectedType, ruhModuleEnabled]);

  useEffect(() => {
    if (activeTemplate?.immediateActionKey && immediateActionValue.length === 0) {
      setImmediateActionValue(t(activeTemplate.immediateActionKey));
    }
  }, [activeTemplate, immediateActionValue.length, t]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const merged = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(merged);
    setImagePreviews(merged.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function readOfflineQueue(): OfflineIncidentQueueItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(OFFLINE_INCIDENT_QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as OfflineIncidentQueueItem[]) : [];
      return Array.isArray(queue) ? queue : [];
    } catch {
      return [];
    }
  }

  function writeOfflineQueue(queue: OfflineIncidentQueueItem[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(OFFLINE_INCIDENT_QUEUE_KEY, JSON.stringify(queue));
    setOfflineQueueCount(queue.length);
  }

  async function syncOfflineQueue() {
    const queue = readOfflineQueue();
    if (queue.length === 0) {
      toast({
        title: t("toasts.noStoredIncidents.title"),
        description: t("toasts.noStoredIncidents.description"),
      });
      return;
    }

    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: t("toasts.noNetwork.title"),
        description: t("toasts.noNetwork.description"),
      });
      return;
    }

    setIsSyncingOfflineQueue(true);
    let successCount = 0;
    const failed: OfflineIncidentQueueItem[] = [];

    for (const item of queue) {
      try {
        const response = await fetch("/api/incidents/offline-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!response.ok) {
          failed.push(item);
          continue;
        }
        successCount += 1;
      } catch {
        failed.push(item);
      }
    }

    writeOfflineQueue(failed);
    setIsSyncingOfflineQueue(false);

    if (successCount > 0) {
      toast({
        title: t("toasts.syncCompleted.title"),
        description: t("toasts.syncCompleted.description", { count: successCount }),
      });
      router.refresh();
    }

    if (failed.length > 0) {
      toast({
        variant: "destructive",
        title: t("toasts.someIncidentsFailed.title"),
        description: t("toasts.someIncidentsFailed.description", { count: failed.length }),
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedType) {
      toast({
        variant: "destructive",
        title: t("toasts.error.title"),
        description: t("fields.type.placeholder"),
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      tenantId,
      type: selectedType as IncidentType,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      severity: null,
      occurredAt: formData.get("occurredAt") as string,
      reportedBy: userId,
      location: (formData.get("location") as string) || undefined,
      witnessName: (formData.get("witnessName") as string) || undefined,
      immediateAction: (formData.get("immediateAction") as string) || undefined,
      reportedForUserId:
        reportedForUserId && reportedForUserId !== NO_REPORTED_FOR_VALUE
          ? reportedForUserId
          : undefined,
      customerName: (formData.get("customerName") as string) || undefined,
      customerEmail: (formData.get("customerEmail") as string) || undefined,
      customerPhone: (formData.get("customerPhone") as string) || undefined,
      projectId:
        selectedProjectId !== NO_PROJECT_VALUE ? selectedProjectId : undefined,
      projectReference: (formData.get("projectReference") as string) || undefined,
      involvedPersons: (formData.get("involvedPersons") as string) || undefined,
      injuryDescription: (formData.get("injuryDescription") as string) || undefined,
    };

    if (isTabletMode && !navigator.onLine) {
      const queue = readOfflineQueue();
      queue.push({
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        payload: data as unknown as Record<string, unknown>,
      });
      writeOfflineQueue(queue);
      toast({
        title: t("toasts.savedOffline.title"),
        description:
          imageFiles.length > 0
            ? t("toasts.savedOffline.withImages")
            : t("toasts.savedOffline.withoutImages"),
      });
      setLoading(false);
      e.currentTarget.reset();
      return;
    }

    try {
      const result = await createIncident(data);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: t("toasts.error.title"),
          description: result.error || t("toasts.error.reportIncident"),
        });
        return;
      }

      if (imageFiles.length > 0 && result.data?.id) {
        const imgFormData = new FormData();
        imageFiles.forEach((file) => imgFormData.append("images", file));
        await fetch(`/api/incidents/${result.data.id}/attachments`, {
          method: "POST",
          body: imgFormData,
        });
      }

      const redirectRoute =
        result.data?.type === "CUSTOMER"
          ? "/dashboard/complaints"
          : "/dashboard/incidents";
      toast({
        title: t("toasts.incidentReported.title"),
        description: t("toasts.incidentReported.description"),
        className: "bg-green-50 border-green-200",
      });
      router.push(redirectRoute);
    } catch {
      toast({
        variant: "destructive",
        title: t("toasts.unexpectedError.title"),
        description: t("toasts.unexpectedError.description"),
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeDescriptionKey = selectedType
    ? `types.${selectedType}.desc`
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6",
        isTabletMode &&
          "space-y-8 pb-24 [&_button]:min-h-12 [&_input]:h-12 [&_input]:text-base [&_textarea]:text-base [&_[data-slot='select-trigger']]:min-h-12 [&_[data-slot='select-trigger']]:text-base",
      )}
    >
      {isTabletMode && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <WifiOff className="h-4 w-4" />
                {t("tabletMode.offlineQueue", { count: offlineQueueCount })}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={syncOfflineQueue}
                disabled={isSyncingOfflineQueue || offlineQueueCount === 0}
                className="gap-2"
              >
                <CloudUpload className="h-4 w-4" />
                {isSyncingOfflineQueue ? t("tabletMode.syncing") : t("tabletMode.syncSaved")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Grunnleggende informasjon ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.basicInfo.title")}</CardTitle>
          <CardDescription>
            {t("sections.basicInfo.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steg 1: Fagområde / hovedkategori */}
          <div className="space-y-2">
            <Label>{t("fields.mainCategory.label")}</Label>
            <div className={cn("grid gap-3", groups.length > 2 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2")}>
              {groups.map((definition) => (
                <button
                  key={definition.group}
                  type="button"
                  onClick={() => handleTypeGroupChange(definition.group)}
                  disabled={loading}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors",
                    typeGroup === definition.group
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted hover:border-muted-foreground/30",
                  )}
                >
                  <span className="text-lg font-semibold">
                    {t(`fields.typeGroup.${definition.group}.label`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`fields.typeGroup.${definition.group}.desc`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {typeGroup && needsTypeChoice && (
            <div className="space-y-2">
              <Label htmlFor="type">{t("fields.type.label")}</Label>
              <Select
                disabled={loading}
                value={selectedType || undefined}
                onValueChange={(value) => setSelectedType(value as IncidentType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder={t("fields.type.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {typesInGroup.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getIncidentTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTypeDescriptionKey && (
                <p className="text-xs text-muted-foreground">
                  {t(selectedTypeDescriptionKey)}
                </p>
              )}
            </div>
          )}

          {/* CDM add-on only — projects are not core HSEQ */}
          {showProjectFields && projects.length > 0 && (
            <div className="space-y-2">
              <Label>{t("fields.project.label")}</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("fields.project.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT_VALUE}>{t("fields.project.noneOption")}</SelectItem>
                  {projects
                    .filter((p) => p.status === "ACTIVE" || p.status === "PLANNING")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.code ? ` (${p.code})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("fields.project.help")}
              </p>
            </div>
          )}

          {/* ── Prosjektnummer som fritekst for uregistrerte oppdrag ── */}
          {showProjectFields && (
          <div className="space-y-2">
            <Label htmlFor="projectReference">{t("fields.projectReference.label")}</Label>
            <Input
              id="projectReference"
              name="projectReference"
              placeholder={t("fields.projectReference.placeholder")}
              maxLength={PROJECT_REFERENCE_MAX_LENGTH}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {t("fields.projectReference.help")}
            </p>
          </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t("fields.title.label")}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t("fields.title.placeholder")}
              defaultValue={activeTemplate ? t(activeTemplate.titleKey) : undefined}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("fields.description.label")}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t("fields.description.placeholder")}
              defaultValue={activeTemplate ? t(activeTemplate.descriptionKey) : undefined}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occurredAt">{t("fields.occurredAt.label")}</Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
                required
                disabled={loading}
                max={toLocalISOString(new Date())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t("fields.location.label")}{isHmsType ? " *" : ""}</Label>
              <Input
                id="location"
                name="location"
                placeholder={t("fields.location.placeholder")}
                defaultValue={activeTemplate ? t(activeTemplate.locationKey) : undefined}
                required={isHmsType}
                disabled={loading}
              />
            </div>
          </div>

          {isInjuryEvent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="involvedPersons">
                  {t("fields.involvedPersons.label")} *
                </Label>
                <Textarea
                  id="involvedPersons"
                  name="involvedPersons"
                  placeholder={t("fields.involvedPersons.placeholder")}
                  disabled={loading}
                  required
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="injuryDescription">
                  {t("fields.injuryDescription.createLabel")}
                </Label>
                <Textarea
                  id="injuryDescription"
                  name="injuryDescription"
                  placeholder={t("fields.injuryDescription.createPlaceholder")}
                  disabled={loading}
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="witnessName">{t("fields.witnessName.label")}</Label>
            <Input
              id="witnessName"
              name="witnessName"
              placeholder={t("fields.witnessName.placeholder")}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="immediateAction">{t("fields.immediateAction.label")}</Label>
            <Textarea
              id="immediateAction"
              name="immediateAction"
              placeholder={t("fields.immediateAction.placeholder")}
              value={immediateActionValue}
              onChange={(event) => setImmediateActionValue(event.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          {users.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="reportedForUserId">
                {t("fields.reportedForUser.label")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {t("fields.reportedForUser.hint")}
                </span>
              </Label>
              <Select
                value={reportedForUserId}
                onValueChange={setReportedForUserId}
                disabled={loading}
              >
                <SelectTrigger id="reportedForUserId">
                  <SelectValue placeholder={t("fields.reportedForUser.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_REPORTED_FOR_VALUE}>
                    {t("fields.reportedForUser.noneOption")}
                  </SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Kundeklage ── */}
      {isCustomerType && (
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.customerComplaint.title")}</CardTitle>
            <CardDescription>
              {t("sections.customerComplaint.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">{t("fields.customerName.label")}</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder={t("fields.customerName.placeholder")}
                  disabled={loading}
                  required={isCustomerType}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">{t("fields.customerEmail.label")}</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  placeholder={t("fields.customerEmail.placeholder")}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">{t("fields.customerPhone.label")}</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                placeholder={t("fields.customerPhone.placeholder")}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Bilder ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.images.title")}</CardTitle>
          <CardDescription>
            {t("sections.images.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              id="incident-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={loading || imageFiles.length >= 5}
              className="sr-only"
            />
            <Label
              htmlFor="incident-images"
              className={`flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                imageFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {imageFiles.length >= 5
                    ? t("sections.images.maxReached")
                    : t("sections.images.clickToAdd")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {imageFiles.length > 0
                    ? t("sections.images.selectedCount", { count: imageFiles.length })
                    : t("sections.images.supportedFormats")}
                </p>
              </div>
            </Label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border"
                >
                  <Image
                    src={preview}
                    alt={t("sections.images.previewAlt", { index: index + 1 })}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lovforankring-info ── */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {t("afterReporting.title")}
        </h3>
        <div className="text-sm text-blue-800 space-y-1">
          <ul className="space-y-1 list-disc list-inside ml-2">
            <li>{t("afterReporting.point1")}</li>
            <li>{t("afterReporting.point2")}</li>
            <li>{t("afterReporting.point3")}</li>
          </ul>
        </div>
      </div>

      <div className={cn("flex gap-4", isTabletMode && "sticky bottom-4 z-20 rounded-lg border bg-background p-3 shadow-lg")}>
        <Button type="submit" disabled={loading}>
          {loading ? t("actions.submitting") : t("actions.submit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          {t("actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
