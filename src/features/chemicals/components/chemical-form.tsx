"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createChemical, updateChemical } from "@/server/actions/chemical.actions";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Package,
  FlaskConical,
  Shield,
  StickyNote,
  ChevronRight,
} from "lucide-react";
import type { Chemical } from "@prisma/client";
import { HazardPictogramSelector } from "./hazard-pictogram-selector";
import { PPESelector } from "./ppe-selector";

interface ChemicalFormProps {
  chemical?: Chemical;
  mode?: "create" | "edit";
}

type AiExtractedFields = {
  productName?: string;
  supplier?: string;
  casNumber?: string;
  hazardClass?: string;
  hazardStatements?: string;
  precautionaryStatements?: string;
  warningPictograms?: string;
  requiredPPE?: string;
  containsIsocyanates?: boolean;
  isCMR?: boolean;
  isSVHC?: boolean;
};

function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b">
      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FieldRow({ label, hint, children, aiFilled = false }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  aiFilled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        {aiFilled && (
          <Badge variant="secondary" className="text-xs h-4 px-1.5 py-0">
            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
            AI
          </Badge>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

function FlagRow({ id, name, checked, disabled, color, label, description }: {
  id: string;
  name: string;
  checked: boolean;
  disabled: boolean;
  color: "red" | "purple" | "orange";
  label: string;
  description: string;
}) {
  const colors = {
    red: {
      border: "border-red-200",
      bg: "bg-red-50",
      dot: "bg-red-500",
      label: "text-red-900",
      desc: "text-red-700",
    },
    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50",
      dot: "bg-purple-500",
      label: "text-purple-900",
      desc: "text-purple-700",
    },
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50",
      dot: "bg-orange-500",
      label: "text-orange-900",
      desc: "text-orange-700",
    },
  }[color];

  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg} cursor-pointer hover:opacity-90 transition-opacity`}
    >
      <Checkbox
        id={id}
        name={name}
        disabled={disabled}
        defaultChecked={checked}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold ${colors.label} leading-tight`}>
          {label}
        </span>
        <span className={`block text-xs mt-1 leading-relaxed ${colors.desc} break-words`}>
          {description}
        </span>
      </div>
    </label>
  );
}

export function ChemicalForm({ chemical, mode = "create" }: ChemicalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sdsFile, setSdsFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [aiData, setAiData] = useState<AiExtractedFields | null>(null);

  const handleSDSUpload = async (file: File) => {
    setSdsFile(file);
    setParsing(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadRes = await fetch("/api/chemicals/upload", { method: "POST", body: uploadFormData });
      if (!uploadRes.ok) throw new Error("File upload failed");
      const { key } = await uploadRes.json();

      toast({ title: "AI is analysing the safety data sheet", description: "This usually takes 30–60 seconds." });

      const parseRes = await fetch("/api/chemicals/parse-sds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdsKey: key }),
      });
      if (!parseRes.ok) {
        const err = await parseRes.json() as { error?: string };
        throw new Error(err.error || "AI parsing failed");
      }
      const { data } = await parseRes.json() as { data: AiExtractedFields };
      setAiData(data);
      toast({
        title: "AI analysis complete",
        description: "Fields have been filled in automatically — check and adjust if needed",
        className: "bg-green-50 border-green-200",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not parse the safety data sheet";
      toast({ variant: "destructive", title: "AI parsing failed", description: message });
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      let sdsKey: string | undefined;
      if (sdsFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", sdsFile);
        const uploadRes = await fetch("/api/chemicals/upload", { method: "POST", body: uploadFormData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json() as { error?: string };
          throw new Error(err.error || "File upload failed");
        }
        sdsKey = (await uploadRes.json()).key;
      }

      const data = {
        productName: formData.get("productName") as string,
        supplier: (formData.get("supplier") as string) || undefined,
        casNumber: (formData.get("casNumber") as string) || undefined,
        hazardClass: (formData.get("hazardClass") as string) || undefined,
        hazardStatements: (formData.get("hazardStatements") as string) || undefined,
        precautionaryStatements: (formData.get("precautionaryStatements") as string) || undefined,
        warningPictograms: (formData.get("warningPictograms") as string) || undefined,
        requiredPPE: (formData.get("requiredPPE") as string) || undefined,
        containsIsocyanates: formData.get("containsIsocyanates") === "on",
        isCMR: formData.get("isCMR") === "on",
        isSVHC: formData.get("isSVHC") === "on",
        sdsKey: sdsKey || undefined,
        sdsVersion: (formData.get("sdsVersion") as string) || undefined,
        sdsDate: (formData.get("sdsDate") as string) || undefined,
        nextReviewDate: (formData.get("nextReviewDate") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
        quantity: (formData.get("quantity") as string) || undefined,
        unit: (formData.get("unit") as string) || undefined,
        status: formData.get("status") as string,
        notes: (formData.get("notes") as string) || undefined,
      };

      const result = mode === "edit" && chemical
        ? await updateChemical(chemical.id, data)
        : await createChemical(data);

      if (result.success) {
        toast({
          title: mode === "edit" ? "Chemical updated" : "Chemical registered",
          description: mode === "edit" ? "The changes have been saved" : "The product has been added to the COSHH register",
          className: "bg-green-50 border-green-200",
        });
        router.push("/dashboard/chemicals");
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Could not save", description: result.error || "Could not save" });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ variant: "destructive", title: "Could not save", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">

        <div className="p-6 space-y-5">
          <SectionHeader
            icon={Upload}
            title="Safety data sheet (SDS)"
            description="Upload a PDF — AI analyses it and fills in the fields below"
          />

          {aiData && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
              <Sparkles className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                AI has filled in the fields — check and adjust if needed
              </p>
            </div>
          )}
          {parsing && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">AI is analysing the safety data sheet... about 30–60 seconds</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <FieldRow
              label={`Safety data sheet (PDF)${mode === "create" ? " *" : ""}`}
              hint={!chemical?.sdsKey && mode === "create" ? "AI fills in the fields automatically on upload" : undefined}
            >
              <Input
                id="sdsFile"
                type="file"
                accept=".pdf"
                disabled={loading || parsing}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSDSUpload(f); }}
                className="cursor-pointer"
              />
            </FieldRow>
            {chemical?.sdsKey && !sdsFile && (
              <div className="flex items-end pb-0.5">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-md px-3 py-2 bg-slate-50 whitespace-nowrap">
                  <FileText className="h-4 w-4" />
                  Existing SDS
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldRow label="Version">
              <Input id="sdsVersion" name="sdsVersion" placeholder="3.2" disabled={loading}
                defaultValue={chemical?.sdsVersion || ""} />
            </FieldRow>
            <FieldRow label="SDS date">
              <Input id="sdsDate" name="sdsDate" type="date" disabled={loading}
                defaultValue={chemical?.sdsDate ? new Date(chemical.sdsDate).toISOString().split("T")[0] : ""} />
            </FieldRow>
            <FieldRow label="Next review" hint="COSHH 2002: review when the assessment is no longer valid">
              <Input id="nextReviewDate" name="nextReviewDate" type="date" disabled={loading}
                defaultValue={
                  chemical?.nextReviewDate
                    ? new Date(chemical.nextReviewDate).toISOString().split("T")[0]
                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                } />
            </FieldRow>
          </div>
        </div>

        <div className="border-t" />

        <div className="p-6 space-y-5">
          <SectionHeader
            icon={Package}
            title="Product information"
            description="Basic data about the hazardous substance"
          />

          <FieldRow label="Product name *" aiFilled={!!aiData?.productName}>
            <Input
              id="productName" name="productName" required disabled={loading}
              placeholder="e.g. Cleaning agent XYZ"
              key={aiData?.productName || "pn"}
              defaultValue={aiData?.productName || chemical?.productName || ""}
            />
          </FieldRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Supplier" aiFilled={!!aiData?.supplier}>
              <Input id="supplier" name="supplier" disabled={loading} placeholder="Supplier name"
                key={aiData?.supplier || "sup"}
                defaultValue={aiData?.supplier || chemical?.supplier || ""} />
            </FieldRow>
            <FieldRow label="CAS number" hint="Unique identifier for the chemical substance" aiFilled={!!aiData?.casNumber}>
              <Input id="casNumber" name="casNumber" disabled={loading} placeholder="000-00-0"
                key={aiData?.casNumber || "cas"}
                defaultValue={aiData?.casNumber || chemical?.casNumber || ""} />
            </FieldRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Storage location">
              <Input id="location" name="location" disabled={loading} placeholder="e.g. Store A, shelf 3"
                defaultValue={chemical?.location || ""} />
            </FieldRow>
            <FieldRow label="Status *">
              <Select name="status" required disabled={loading} defaultValue={chemical?.status || "ACTIVE"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">In use</SelectItem>
                  <SelectItem value="PHASED_OUT">Being phased out</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldRow label="Quantity">
              <Input id="quantity" name="quantity" type="number" step="0.01" disabled={loading}
                placeholder="0" defaultValue={chemical?.quantity || ""} />
            </FieldRow>
            <FieldRow label="Unit">
              <Select name="unit" disabled={loading} defaultValue={chemical?.unit || "liter"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="liter">Litre</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="stk">Each</SelectItem>
                  <SelectItem value="m3">Cubic metre</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
        </div>

        <div className="border-t" />

        <div className="p-6 space-y-5">
          <SectionHeader
            icon={FlaskConical}
            title="Hazard labelling (GHS/CLP)"
            description="Classification, H/P-statements and pictograms from the safety data sheet"
          />

          <FieldRow label="Hazard class" hint="GHS/CLP hazard class, e.g. Flam. Liq. 3, Acute Tox. 4" aiFilled={!!aiData?.hazardClass}>
            <Input id="hazardClass" name="hazardClass" disabled={loading}
              placeholder="e.g. Flam. Liq. 3"
              key={aiData?.hazardClass || "hc"}
              defaultValue={aiData?.hazardClass || chemical?.hazardClass || ""} />
          </FieldRow>

          <FieldRow
            label="H-statements (hazard statements)"
            hint="H340 / H350 / H360 indicate a CMR substance — keep health records for 40 years (COSHH 2002)"
            aiFilled={!!aiData?.hazardStatements}
          >
            <Textarea
              id="hazardStatements" name="hazardStatements" rows={4} disabled={loading}
              placeholder={"H226 Flammable liquid and vapour\nH315 Causes skin irritation\nH350 May cause cancer"}
              key={aiData?.hazardStatements || "hs"}
              defaultValue={aiData?.hazardStatements || chemical?.hazardStatements || ""}
              className="resize-y min-h-[80px]"
            />
          </FieldRow>

          <FieldRow
            label="P-statements (precautionary statements)"
            hint="Precautionary statements from section 2 of the safety data sheet"
            aiFilled={!!aiData?.precautionaryStatements}
          >
            <Textarea
              id="precautionaryStatements" name="precautionaryStatements" rows={4} disabled={loading}
              placeholder={"P210 Keep away from heat and open flames\nP260 Do not breathe dust/fume/vapours\nP501 Dispose of contents/container to an approved waste facility"}
              key={aiData?.precautionaryStatements || "ps"}
              defaultValue={aiData?.precautionaryStatements || chemical?.precautionaryStatements || ""}
              className="resize-y min-h-[80px]"
            />
          </FieldRow>

          <div>
            {aiData?.warningPictograms && (
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />AI-filled
                </Badge>
              </div>
            )}
            <Label className="text-sm font-medium text-slate-700 block mb-2">Hazard pictograms (GHS)</Label>
            <HazardPictogramSelector
              key={aiData?.warningPictograms || "wp"}
              defaultValue={aiData?.warningPictograms || chemical?.warningPictograms || ""}
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-medium text-slate-700 block">Classification flags</Label>
            <FlagRow
              id="isCMR" name="isCMR" color="red" disabled={loading}
              checked={aiData?.isCMR ?? chemical?.isCMR ?? false}
              label="CMR substance (Carc./Muta./Repr. cat. 1A or 1B)"
              description="Carcinogenic, mutagenic or toxic for reproduction. COSHH 2002 requires control of exposure and health records for 40 years where health surveillance applies."
            />
            <FlagRow
              id="isSVHC" name="isSVHC" color="purple" disabled={loading}
              checked={aiData?.isSVHC ?? chemical?.isSVHC ?? false}
              label="SVHC — Substance of Very High Concern (UK REACH)"
              description="Substance of very high concern under UK REACH. Authorisation may be required for continued use."
            />
            <FlagRow
              id="containsIsocyanates" name="containsIsocyanates" color="orange" disabled={loading}
              checked={aiData?.containsIsocyanates ?? chemical?.containsIsocyanates ?? false}
              label="Contains diisocyanates"
              description="UK REACH restriction (retained EU 2020/1149): training is required for industrial and professional use at ≥0.1%. AI detects this from the SDS."
            />
          </div>
        </div>

        <div className="border-t" />

        <div className="p-6 space-y-4">
          <SectionHeader
            icon={Shield}
            title="Personal protective equipment (PPE)"
            description="Required PPE when handling — ISO 7010 symbols"
          />
          {aiData?.requiredPPE && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />AI suggested
            </Badge>
          )}
          <PPESelector
            key={aiData?.requiredPPE || "ppe"}
            defaultValue={aiData?.requiredPPE || chemical?.requiredPPE || ""}
          />
        </div>

        <div className="border-t" />

        <div className="p-6 space-y-4">
          <SectionHeader
            icon={StickyNote}
            title="Notes"
            description="Handling instructions, substitution reviews or other comments"
          />
          <Textarea
            id="notes" name="notes" rows={4} disabled={loading}
            placeholder="e.g. special storage or handling requirements, planned substitutes."
            defaultValue={chemical?.notes || ""}
            className="resize-y"
          />
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            National Insurance numbers are never stored in the COSHH register
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" disabled={loading} onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (mode === "create" && !sdsFile)}
              className="min-w-[140px]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Register chemical"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
