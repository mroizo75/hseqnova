"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { investigateIncident } from "@/server/actions/incident.actions";
import { useToast } from "@/hooks/use-toast";
import { FileSearch } from "lucide-react";
import { useTranslations } from "next-intl";

interface InvestigationFormProps {
  incidentId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
}

export function InvestigationForm({ incidentId, users }: InvestigationFormProps) {
  const t = useTranslations("dashboardIncidentInvestigationForm");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: incidentId,
      rootCause: formData.get("rootCause") as string,
      contributingFactors: (formData.get("contributingFactors") as string) || undefined,
      investigatedBy: formData.get("investigatedBy") as string,
    };

    try {
      const result = await investigateIncident(data);

      if (result.success) {
        toast({
          title: t("toasts.success.title"),
          description: t("toasts.success.description"),
          className: "bg-green-50 border-green-200",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: t("toasts.error.title"),
          description: result.error || t("toasts.error.description"),
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: t("toasts.unexpected.title"),
        description: t("toasts.unexpected.description"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rootCause">{t("fields.rootCause")}</Label>
            <Textarea
              id="rootCause"
              name="rootCause"
              placeholder={t("placeholders.rootCause")}
              required
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contributingFactors">{t("fields.contributingFactors")}</Label>
            <Textarea
              id="contributingFactors"
              name="contributingFactors"
              placeholder={t("placeholders.contributingFactors")}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investigatedBy">{t("fields.investigatedBy")}</Label>
            <Select name="investigatedBy" required disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={t("placeholders.investigatedBy")} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? t("actions.saving") : t("actions.complete")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
