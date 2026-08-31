"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { useToast } from "@/hooks/use-toast";
import { Camera, CloudUpload, Loader2, WifiOff, X } from "lucide-react";
import Image from "next/image";
import type { IncidentType } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  composeInvolvedPersons,
  titleFromDescription,
  type InjuredPersonRole,
} from "@/lib/accident-book";
import {
  enqueueSafe,
  formDataToOfflinePayload,
  isAvailable,
  isNetworkError,
} from "@/lib/offline-queue";
import { PROJECT_REFERENCE_MAX_LENGTH } from "@/lib/incident-project-reference";

type ReportKind =
  | "injury"
  | "near_miss"
  | "unsafe"
  | "disease"
  | "visitor"
  | "quality"
  | "environment"
  | "customer";

const PRIMARY_KINDS: ReportKind[] = ["injury", "near_miss", "unsafe", "disease", "visitor"];
const OTHER_KINDS: ReportKind[] = ["quality", "environment", "customer"];

const KIND_TO_TYPE: Record<ReportKind, IncidentType> = {
  injury: "ULYKKE",
  near_miss: "NESTEN",
  unsafe: "FARLIG_SITUASJON",
  disease: "YRKESSYKDOM",
  visitor: "ULYKKE",
  quality: "KVALITET",
  environment: "MILJO",
  customer: "CUSTOMER",
};

const NO_PROJECT = "__none__";
const OFFLINE_QUEUE_KEY = "hmsnova.offline.incidentQueue.v1";

function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function typeToKind(type?: IncidentType): ReportKind | null {
  if (!type) return null;
  if (type === "ULYKKE" || type === "SKADE") return "injury";
  if (type === "NESTEN") return "near_miss";
  if (type === "FARLIG_SITUASJON") return "unsafe";
  if (type === "YRKESSYKDOM") return "disease";
  if (type === "KVALITET") return "quality";
  if (type === "MILJO") return "environment";
  if (type === "CUSTOMER") return "customer";
  return "injury";
}

export function AccidentBookReportForm({
  tenantId,
  userId,
  projects = [],
  defaultType,
  defaultProjectId,
  isTabletMode = false,
  showProjectFields = false,
  compact = false,
  successRedirectPath,
}: {
  tenantId: string;
  userId: string;
  projects?: Array<{ id: string; name: string; code: string | null; status?: string }>;
  defaultType?: IncidentType;
  defaultProjectId?: string;
  isTabletMode?: boolean;
  showProjectFields?: boolean;
  compact?: boolean;
  successRedirectPath?: string;
}) {
  const t = useTranslations("accidentBookReport");
  const router = useRouter();
  const { toast } = useToast();
  const [kind, setKind] = useState<ReportKind | null>(typeToKind(defaultType));
  const [showOther, setShowOther] = useState(
    Boolean(defaultType && OTHER_KINDS.includes(typeToKind(defaultType) as ReportKind))
  );
  const [occurredAt, setOccurredAt] = useState(toLocalISOString(new Date()));
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [injuredName, setInjuredName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [address, setAddress] = useState("");
  const [personRole, setPersonRole] = useState<InjuredPersonRole>("employee");
  const [injuryNature, setInjuryNature] = useState("");
  const [takenToHospital, setTakenToHospital] = useState(false);
  const [witnessName, setWitnessName] = useState("");
  const [witnessAddress, setWitnessAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? NO_PROJECT);
  const [projectReference, setProjectReference] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const selectedType = kind ? KIND_TO_TYPE[kind] : "";
  const needsPerson = kind === "injury" || kind === "disease" || kind === "visitor";
  const isAccidentBook = kind === "injury" || kind === "near_miss" || kind === "unsafe" || kind === "disease" || kind === "visitor";
  const isCustomer = kind === "customer";
  const redirectTo =
    successRedirectPath ??
    (compact ? "/ansatt" : "/dashboard/incidents");

  useEffect(() => {
    if (kind === "visitor") setPersonRole("member_of_public");
    if (kind === "injury") setPersonRole("employee");
  }, [kind]);

  useEffect(() => {
    if (!isTabletMode || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as unknown[]) : [];
      setOfflineCount(Array.isArray(queue) ? queue.length : 0);
    } catch {
      setOfflineCount(0);
    }
  }, [isTabletMode]);

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    const merged = [...imageFiles, ...Array.from(event.target.files)].slice(0, 5);
    setImageFiles(merged);
    setImagePreviews(merged.map((file) => URL.createObjectURL(file)));
  }

  function buildPayload() {
    const involved = composeInvolvedPersons({
      name: injuredName,
      occupation,
      address,
      role: needsPerson ? personRole : undefined,
    });
    return {
      tenantId,
      type: selectedType,
      title: titleFromDescription(description),
      description,
      occurredAt,
      reportedBy: userId,
      location: location || undefined,
      witnessName: witnessName || undefined,
      witnessAddress: witnessAddress || undefined,
      involvedPersons: involved,
      injuredPersonOccupation: occupation || undefined,
      injuredPersonAddress: address || undefined,
      injuredPersonRole: needsPerson ? personRole : undefined,
      injuryDescription: injuryNature || undefined,
      injuryType: injuryNature || undefined,
      shareWithSafetyRepsConsent: consent,
      reporterAcknowledged: acknowledged,
      nonWorkerTakenToHospital: kind === "visitor" ? takenToHospital : false,
      customerName: customerName || undefined,
      projectId: projectId !== NO_PROJECT ? projectId : undefined,
      projectReference: projectReference || undefined,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kind || !selectedType) {
      toast({ variant: "destructive", title: t("toasts.error"), description: t("type.required") });
      return;
    }
    if (description.trim().length < 5) {
      toast({ variant: "destructive", title: t("toasts.error"), description: t("what.tooShort") });
      return;
    }
    if (isAccidentBook && !location.trim()) {
      toast({ variant: "destructive", title: t("toasts.error"), description: t("where.required") });
      return;
    }
    if (needsPerson && (!injuredName.trim() || !occupation.trim() || !address.trim() || !injuryNature.trim())) {
      toast({ variant: "destructive", title: t("toasts.error"), description: t("person.required") });
      return;
    }
    if (needsPerson && !acknowledged) {
      toast({ variant: "destructive", title: t("toasts.error"), description: t("confirm.required") });
      return;
    }

    setLoading(true);
    const payload = buildPayload();
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null || value === "") continue;
      formData.append(key, String(value));
    }
    imageFiles.forEach((file) => formData.append("images", file));

    if ((isTabletMode || compact) && typeof navigator !== "undefined" && !navigator.onLine) {
      const queued = await enqueueSafe({
        id: `incident-${Date.now()}`,
        type: "incident",
        createdAt: new Date().toISOString(),
        endpoint: "/api/incidents/report",
        payload: formDataToOfflinePayload(formData).payload,
        files: formDataToOfflinePayload(formData).files,
      });
      if (queued.stored) {
        toast({ title: t("toasts.offline"), description: t("toasts.offlineHint") });
        router.push(redirectTo);
        return;
      }
    }

    try {
      const response = await fetch("/api/incidents/report", { method: "POST", body: formData });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || t("toasts.submitFailed"));
      }
      toast({ title: t("toasts.success"), description: t("toasts.successHint") });
      router.push(isCustomer && !compact && !successRedirectPath ? "/dashboard/incidents" : redirectTo);
    } catch (error) {
      if (isNetworkError(error) && isAvailable()) {
        const { payload: offlinePayload, files } = formDataToOfflinePayload(formData);
        const result = await enqueueSafe({
          id: `incident-${Date.now()}`,
          type: "incident",
          createdAt: new Date().toISOString(),
          endpoint: "/api/incidents/report",
          payload: offlinePayload,
          files,
        });
        if (result.stored) {
          toast({ title: t("toasts.offline"), description: t("toasts.offlineHint") });
          router.push(redirectTo);
          return;
        }
      }
      toast({
        variant: "destructive",
        title: t("toasts.error"),
        description: error instanceof Error ? error.message : t("toasts.submitFailed"),
      });
    } finally {
      setLoading(false);
    }
  }

  async function syncOffline() {
    if (typeof window === "undefined") return;
    setSyncing(true);
    try {
      const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as Array<{ payload: Record<string, unknown> }>) : [];
      const failed: typeof queue = [];
      let ok = 0;
      for (const item of queue) {
        const response = await fetch("/api/incidents/offline-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (response.ok) ok += 1;
        else failed.push(item);
      }
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
      setOfflineCount(failed.length);
      if (ok > 0) {
        toast({ title: t("toasts.synced"), description: t("toasts.syncedHint", { count: ok }) });
      }
    } finally {
      setSyncing(false);
    }
  }

  const controlClass = compact || isTabletMode ? "h-12 text-base" : "";

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", isTabletMode && "pb-24")}>
      {isTabletMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            {t("offline.queued", { count: offlineCount })}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={syncOffline} disabled={syncing || offlineCount === 0} className="gap-2 bg-transparent">
            <CloudUpload className="h-4 w-4" />
            {syncing ? t("offline.syncing") : t("offline.sync")}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-base">{t("type.label")}</Label>
        <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
          {PRIMARY_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item)}
              className={cn(
                "min-h-14 rounded-lg border-2 px-4 py-3 text-left transition-colors",
                kind === item ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <span className="block font-semibold">{t(`type.${item}.label`)}</span>
              <span className="block text-xs text-muted-foreground">{t(`type.${item}.hint`)}</span>
            </button>
          ))}
        </div>
        {!compact && (
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => setShowOther((value) => !value)}
          >
            {showOther ? t("type.hideOther") : t("type.showOther")}
          </button>
        )}
        {showOther && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {OTHER_KINDS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={cn(
                  "rounded-lg border-2 px-3 py-2 text-left text-sm",
                  kind === item ? "border-primary bg-primary/5" : "border-muted"
                )}
              >
                {t(`type.${item}.label`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "md:grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="occurredAt">{t("when.label")}</Label>
          <Input
            id="occurredAt"
            type="datetime-local"
            value={occurredAt}
            max={toLocalISOString(new Date())}
            onChange={(event) => setOccurredAt(event.target.value)}
            required
            className={controlClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">{t("where.label")}{isAccidentBook ? " *" : ""}</Label>
          <Input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t("where.placeholder")}
            required={isAccidentBook}
            className={controlClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("what.label")}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("what.placeholder")}
          required
          rows={compact ? 4 : 3}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">{t("what.help")}</p>
      </div>

      {needsPerson && (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-semibold">{t("person.title")}</p>
          <p className="text-xs text-muted-foreground">{t("person.legal")}</p>
          <div className="space-y-2">
            <Label htmlFor="injuredName">{t("person.name")}</Label>
            <Input id="injuredName" value={injuredName} onChange={(event) => setInjuredName(event.target.value)} required className={controlClass} />
          </div>
          <div className={cn("grid gap-4", compact ? "grid-cols-1" : "md:grid-cols-2")}>
            <div className="space-y-2">
              <Label htmlFor="occupation">{t("person.occupation")}</Label>
              <Input id="occupation" value={occupation} onChange={(event) => setOccupation(event.target.value)} required className={controlClass} />
            </div>
            {kind !== "visitor" && (
              <div className="space-y-2">
                <Label>{t("person.role")}</Label>
                <Select value={personRole} onValueChange={(value) => setPersonRole(value as InjuredPersonRole)}>
                  <SelectTrigger className={controlClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">{t("person.roles.employee")}</SelectItem>
                    <SelectItem value="contractor">{t("person.roles.contractor")}</SelectItem>
                    <SelectItem value="visitor">{t("person.roles.visitor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t("person.address")}</Label>
            <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} required className={controlClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="injuryNature">{t("person.injury")}</Label>
            <Textarea id="injuryNature" value={injuryNature} onChange={(event) => setInjuryNature(event.target.value)} required rows={2} />
          </div>
          {kind === "visitor" && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={takenToHospital} onCheckedChange={(checked) => setTakenToHospital(!!checked)} className="mt-0.5" />
              <span>{t("person.hospital")}</span>
            </label>
          )}
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} className="mt-0.5" />
            <span>{t("person.consent")}</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={acknowledged} onCheckedChange={(checked) => setAcknowledged(!!checked)} className="mt-0.5" />
            <span>{t("person.acknowledge")}</span>
          </label>
        </div>
      )}

      {isAccidentBook && (
        <div className={cn("grid gap-4", compact ? "grid-cols-1" : "md:grid-cols-2")}>
          <div className="space-y-2">
            <Label htmlFor="witnessName">{t("witness.name")}</Label>
            <Input id="witnessName" value={witnessName} onChange={(event) => setWitnessName(event.target.value)} className={controlClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="witnessAddress">{t("witness.address")}</Label>
            <Input id="witnessAddress" value={witnessAddress} onChange={(event) => setWitnessAddress(event.target.value)} className={controlClass} />
          </div>
        </div>
      )}

      {isCustomer && (
        <div className="space-y-2">
          <Label htmlFor="customerName">{t("customer.name")}</Label>
          <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required className={controlClass} />
        </div>
      )}

      {showProjectFields && (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>{t("project.label")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("project.none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>{t("project.none")}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}{project.code ? ` (${project.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="projectReference">{t("project.reference")}</Label>
            <Input
              id="projectReference"
              value={projectReference}
              onChange={(event) => setProjectReference(event.target.value)}
              maxLength={PROJECT_REFERENCE_MAX_LENGTH}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("photos.label")}</Label>
        <Input id="accident-images" type="file" accept="image/*" capture="environment" multiple onChange={handleImages} disabled={imageFiles.length >= 5} className="sr-only" />
        <Label
          htmlFor="accident-images"
          className={cn(
            "flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed",
            imageFiles.length >= 5 && "cursor-not-allowed opacity-50"
          )}
        >
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">{imageFiles.length >= 5 ? t("photos.max") : t("photos.add")}</span>
        </Label>
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {imagePreviews.map((preview, index) => (
              <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border">
                <Image src={preview} alt={t("photos.add")} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFiles((files) => files.filter((_, i) => i !== index));
                    setImagePreviews((previews) => previews.filter((_, i) => i !== index));
                  }}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" size="lg" disabled={loading} className="h-14 w-full text-base">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("actions.sending")}
          </>
        ) : (
          t("actions.submit")
        )}
      </Button>
    </form>
  );
}
