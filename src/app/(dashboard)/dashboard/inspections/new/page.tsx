"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { InspectionLegalNote } from "@/features/inspections/components/inspection-legal-note";
import { Checkbox } from "@/components/ui/checkbox";
import {
  defaultLegalBasisForType,
  INSPECTION_LEGAL_BASIS,
  INSPECTION_LEGAL_BASIS_KEYS,
  type InspectionLegalBasisKey,
} from "@/lib/inspection-uk";

interface TenantUser {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface FormTemplateField {
  id: string;
  fieldType: string;
  label: string;
  isRequired: boolean;
}

interface InspectionFormTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  isGlobal: boolean;
  fields: FormTemplateField[];
}

const NO_TEMPLATE_VALUE = "__none_template__";

export default function NewInspectionPage() {
  const t = useTranslations("dashboardInspectionNewPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formTemplates, setFormTemplates] = useState<InspectionFormTemplate[]>([]);
  const [loadingFormTemplates, setLoadingFormTemplates] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "VERNERUNDE",
    legalBasis: defaultLegalBasisForType("VERNERUNDE") as InspectionLegalBasisKey,
    scheduledDate: "",
    location: "",
    conductedBy: "",
    formTemplateId: NO_TEMPLATE_VALUE,
    nextInspection: "",
    participantIds: [] as string[],
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.tenantId) return;

      try {
        const response = await fetch(`/api/tenants/${session.user.tenantId}/users`);
        const data = await response.json();

        if (response.ok && data.users) {
          setUsers(data.users);
          if (session.user.id) {
            setFormData((prev) => ({ ...prev, conductedBy: session.user.id || "" }));
          }
        }
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [session?.user?.tenantId, session?.user?.id]);

  useEffect(() => {
    const fetchFormTemplates = async () => {
      try {
        const response = await fetch("/api/forms?category=INSPECTION");
        const data = await response.json();
        if (response.ok && data.forms) {
          setFormTemplates(data.forms);
        }
      } catch {
        setFormTemplates([]);
      } finally {
        setLoadingFormTemplates(false);
      }
    };

    fetchFormTemplates();
  }, []);

  const selectedFormTemplate =
    formData.formTemplateId === NO_TEMPLATE_VALUE
      ? null
      : formTemplates.find((template) => template.id === formData.formTemplateId) ?? null;

  const previewFields = selectedFormTemplate?.fields ?? [];
  const otherUsers = users.filter((entry) => entry.user.id !== formData.conductedBy);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      toast({
        title: t("toasts.error.title"),
        description: "Area of the workplace inspected is required (HSE F2534).",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        legalBasis: formData.legalBasis,
        scheduledDate: formData.scheduledDate,
        location: formData.location,
        conductedBy: formData.conductedBy,
        projectId: projectId || undefined,
        formTemplateId:
          formData.formTemplateId === NO_TEMPLATE_VALUE ? undefined : formData.formTemplateId,
        participants: formData.participantIds,
        nextInspection: formData.nextInspection || undefined,
      };

      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("errors.create"));
      }

      toast({
        title: t("toasts.created.title"),
        description: t("toasts.created.description"),
      });

      router.push(`/dashboard/inspections/${data.data.inspection.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("errors.create");
      toast({
        title: t("toasts.error.title"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inspections">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <InspectionLegalNote />

      <Card>
        <CardHeader>
          <CardTitle>{t("card.title")}</CardTitle>
          <CardDescription>{t("card.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {projectId ? (
              <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
                {t("projectNotice")}
              </div>
            ) : null}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t("fields.title")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t("placeholders.title")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  {t("fields.type")} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      type: value,
                      legalBasis: defaultLegalBasisForType(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERNERUNDE">{t("types.vernerunde")}</SelectItem>
                    <SelectItem value="HMS_INSPEKSJON">{t("types.hmsInspection")}</SelectItem>
                    <SelectItem value="SIKKERHETSVANDRING">{t("types.safetyWalk")}</SelectItem>
                    <SelectItem value="SHA_PLAN">{t("types.shaPlan")}</SelectItem>
                    <SelectItem value="ANDRE">{t("types.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalBasis">
                  Reason for inspection <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.legalBasis}
                  onValueChange={(value) =>
                    setFormData({ ...formData, legalBasis: value as InspectionLegalBasisKey })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSPECTION_LEGAL_BASIS_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {INSPECTION_LEGAL_BASIS[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {INSPECTION_LEGAL_BASIS[formData.legalBasis].legalRef}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">
                  {t("fields.scheduledDate")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  {t("fields.location")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t("placeholders.location")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conductedBy">
                  {t("fields.conductedBy")} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.conductedBy}
                  onValueChange={(value) => setFormData({ ...formData, conductedBy: value })}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? t("loadingUsers") : t("placeholders.selectUser")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((entry) => (
                      <SelectItem key={entry.user.id} value={entry.user.id}>
                        {entry.user.name || entry.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextInspection">{t("fields.nextInspection")}</Label>
                <Input
                  id="nextInspection"
                  type="date"
                  value={formData.nextInspection}
                  onChange={(e) => setFormData({ ...formData, nextInspection: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Union safety representatives may inspect every three months (SRSCWR 1977 reg.5).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("fields.participants")}</Label>
              <p className="text-xs text-muted-foreground">
                Employer or other people taking part, if they were present (HSE F2534).
              </p>
              <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                {otherUsers.map((entry) => {
                  const checked = formData.participantIds.includes(entry.user.id);
                  return (
                    <label key={entry.user.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            participantIds: value
                              ? [...prev.participantIds, entry.user.id]
                              : prev.participantIds.filter((id) => id !== entry.user.id),
                          }));
                        }}
                      />
                      <span>{entry.user.name || entry.user.email}</span>
                    </label>
                  );
                })}
                {otherUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {loadingUsers ? t("loadingUsers") : "No other people to add yet."}
                  </p>
                ) : null}
              </div>
            </div>

            {formTemplates.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="formTemplateId">{t("fields.template")}</Label>
                <Select
                  value={formData.formTemplateId}
                  onValueChange={(value) => {
                    if (value === NO_TEMPLATE_VALUE) {
                      setFormData((prev) => ({ ...prev, formTemplateId: NO_TEMPLATE_VALUE }));
                      return;
                    }
                    const selected = formTemplates.find((template) => template.id === value);
                    setFormData((prev) => ({
                      ...prev,
                      formTemplateId: value,
                      title: prev.title || selected?.title || prev.title,
                      description: prev.description || selected?.description || prev.description,
                    }));
                  }}
                  disabled={loadingFormTemplates}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingFormTemplates ? t("loadingTemplates") : t("placeholders.selectTemplate")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE_VALUE}>{t("actions.selectTemplate")}</SelectItem>
                    {formTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFormTemplate ? (
                  <p className="text-xs text-muted-foreground">
                    {t("template.fieldsCount", { count: previewFields.length })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A checklist is optional. The F2534 record is enough.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="description">{t("fields.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("placeholders.description")}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/inspections">
                <Button type="button" variant="outline">
                  {t("actions.cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={loading || loadingUsers || !formData.conductedBy}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? t("actions.creating") : t("actions.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
