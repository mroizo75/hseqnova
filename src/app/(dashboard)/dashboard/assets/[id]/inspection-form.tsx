"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createAssetInspection } from "@/server/actions/asset.actions";

const INSPECTION_TYPES = [
  { value: "ROUTINE", label: "Routine inspection" },
  { value: "THOROUGH_EXAMINATION", label: "Thorough examination (LOLER reg. 9)" },
  { value: "PRE_USE", label: "Pre-use check" },
  { value: "POST_INCIDENT", label: "Post-incident inspection" },
  { value: "RETURN_TO_SERVICE", label: "Return to service" },
];

const RESULTS = [
  { value: "PASS", label: "Pass" },
  { value: "CONDITIONAL_PASS", label: "Conditional pass" },
  { value: "FAIL", label: "Fail" },
  { value: "REQUIRES_REPAIR", label: "Requires repair" },
];

export function AssetInspectionForm({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { assetId };
    formData.forEach((value, key) => {
      if (typeof value === "string" && value.trim()) {
        payload[key] = value.trim();
      }
    });

    const result = await createAssetInspection(payload);
    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error || "Could not record the inspection");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Record inspection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record inspection</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">Date *</Label>
              <Input
                id="inspectionDate"
                name="inspectionDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectedBy">Inspected by *</Label>
              <Input id="inspectedBy" name="inspectedBy" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspectionType">Type</Label>
              <Select name="inspectionType" defaultValue="ROUTINE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select name="result" defaultValue="PASS">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULTS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="findings">Findings</Label>
            <Textarea id="findings" name="findings" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actionRequired">Action required</Label>
            <Textarea id="actionRequired" name="actionRequired" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextDueDate">Next due date</Label>
            <Input id="nextDueDate" name="nextDueDate" type="date" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save inspection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
