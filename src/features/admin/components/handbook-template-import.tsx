"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, CheckCircle2, Loader2, Upload } from "lucide-react";
import { applyHandbookTemplate } from "@/server/actions/hms-handbok.actions";
import { getAvailableTemplates } from "@/lib/handbook-templates";

interface HandbookTemplateImportProps {
  tenantId: string;
  tenantName: string;
  tenantIndustry?: string | null;
  orgNumber?: string | null;
  adminName?: string | null;
}

export function HandbookTemplateImport({
  tenantId,
  tenantName,
  tenantIndustry,
  orgNumber,
  adminName,
}: HandbookTemplateImportProps) {
  const templates = getAvailableTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState(
    tenantIndustry ?? "",
  );
  const [variables, setVariables] = useState<Record<string, string>>({
    companyName: tenantName,
    companyNumber: orgNumber ?? "",
    managingDirector: adminName ?? "",
    competentPerson: "",
    safetyRepresentative: "",
    fireMarshal: "",
    firstAider: "",
    address: "",
    industry:
      templates.find((t) => t.industry === tenantIndustry)?.name.replace(
        "Health & Safety Policy — ",
        "",
      ) ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleImport = () => {
    if (!selectedTemplate) return;

    startTransition(async () => {
      const res = await applyHandbookTemplate({
        tenantId,
        industryKey: selectedTemplate,
        variables,
      });

      if (res.success) {
        setResult({
          success: true,
          message: `${res.sectionsUpdated} sections updated with the industry policy template`,
        });
      } else {
        setResult({
          success: false,
          message: res.error ?? "Unknown error",
        });
      }
    });
  };

  const updateVariable = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Health and safety policy
        </CardTitle>
        <CardDescription>
          Import a living H&amp;S policy template (HSWA s.2(3)) with statement,
          organisation and arrangements for this organisation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Industry template</Label>
          <Select
            value={selectedTemplate}
            onValueChange={(value) => {
              setSelectedTemplate(value);
              const tpl = templates.find((t) => t.industry === value);
              if (tpl) {
                updateVariable(
                  "industry",
                  tpl.name.replace("Health & Safety Policy — ", ""),
                );
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tpl) => (
                <SelectItem key={tpl.industry} value={tpl.industry}>
                  <div className="flex items-center gap-2">
                    <span>{tpl.name}</span>
                    {tpl.industry === tenantIndustry && (
                      <Badge variant="secondary" className="text-xs">
                        Suggested
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Organisation name</Label>
            <Input
              id="companyName"
              value={variables.companyName}
              onChange={(e) => updateVariable("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyNumber">Company number</Label>
            <Input
              id="companyNumber"
              value={variables.companyNumber}
              onChange={(e) => updateVariable("companyNumber", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="managingDirector">Managing director</Label>
            <Input
              id="managingDirector"
              value={variables.managingDirector}
              onChange={(e) => updateVariable("managingDirector", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="competentPerson">Competent person</Label>
            <Input
              id="competentPerson"
              value={variables.competentPerson}
              onChange={(e) => updateVariable("competentPerson", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="safetyRepresentative">Safety representative</Label>
            <Input
              id="safetyRepresentative"
              value={variables.safetyRepresentative}
              onChange={(e) =>
                updateVariable("safetyRepresentative", e.target.value)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fireMarshal">Fire marshal</Label>
            <Input
              id="fireMarshal"
              value={variables.fireMarshal}
              onChange={(e) => updateVariable("fireMarshal", e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={variables.address}
              onChange={(e) => updateVariable("address", e.target.value)}
            />
          </div>
        </div>

        {result && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              result.success
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {result.success && <CheckCircle2 className="h-4 w-4" />}
            {result.message}
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!selectedTemplate || isPending}
          className="w-full"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Import policy template
        </Button>

        <p className="text-xs text-muted-foreground">
          Imports as a new draft. The organisation must approve and sign the
          version themselves.
        </p>
      </CardContent>
    </Card>
  );
}
