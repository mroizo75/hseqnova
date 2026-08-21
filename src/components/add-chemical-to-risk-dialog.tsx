"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { linkChemicalToRisk } from "@/server/actions/risk-chemical.actions";
import { Loader2 } from "lucide-react";

interface AddChemicalToRiskDialogProps {
  riskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddChemicalToRiskDialog({
  riskId,
  open,
  onOpenChange,
}: AddChemicalToRiskDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [loadingChemicals, setLoadingChemicals] = useState(true);

  const [formData, setFormData] = useState({
    chemicalId: "",
    exposure: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    ppRequired: false,
    note: "",
  });

  useEffect(() => {
    if (open) {
      loadChemicals();
    }
  }, [open]);

  const loadChemicals = async () => {
    try {
      setLoadingChemicals(true);
      const response = await fetch("/api/chemicals");
      if (response.ok) {
        const data = await response.json();
        setChemicals(data.chemicals || []);
      }
    } catch (error) {
      console.error("Failed to load chemicals:", error);
    } finally {
      setLoadingChemicals(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chemicalId) {
      toast({
        variant: "destructive",
        title: "Feil",
        description: "Velg et kjemikalie",
      });
      return;
    }

    setLoading(true);

    const result = await linkChemicalToRisk({
      riskId,
      ...formData,
    });

    if (result.success) {
      toast({
        title: "✅ Kjemikalie koblet",
        description: "Kjemikalien er nå knyttet til risikoen",
        className: "bg-green-50 border-green-200",
      });
      setFormData({
        chemicalId: "",
        exposure: "MEDIUM",
        ppRequired: false,
        note: "",
      });
      onOpenChange(false);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Feil",
        description: result.error || "Kunne ikke koble kjemikalie",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til kjemikalie</DialogTitle>
          <DialogDescription>
            Koble et farlig stoff til denne risikovurderingen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chemical">Kjemikalie</Label>
            {loadingChemicals ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Select
                value={formData.chemicalId}
                onValueChange={(value) =>
                  setFormData({ ...formData, chemicalId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kjemikalie" />
                </SelectTrigger>
                <SelectContent>
                  {chemicals.map((chemical) => (
                    <SelectItem key={chemical.id} value={chemical.id}>
                      {chemical.productName}
                      {chemical.isCMR && " [CMR]"}
                      {chemical.containsIsocyanates && " [Diisocyanater]"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exposure">Eksponeringsnivå</Label>
            <Select
              value={formData.exposure}
              onValueChange={(value: any) =>
                setFormData({ ...formData, exposure: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Lav - Minimal eksponering</SelectItem>
                <SelectItem value="MEDIUM">Moderat - Standard sikkerhetstiltak</SelectItem>
                <SelectItem value="HIGH">Høy - Krever ekstra tiltak</SelectItem>
                <SelectItem value="CRITICAL">Kritisk - CMR/Diisocyanater</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ppRequired"
              checked={formData.ppRequired}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ppRequired: checked as boolean })
              }
            />
            <Label htmlFor="ppRequired" className="cursor-pointer">
              Personlig verneutstyr påkrevd
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Merknad (valgfritt)</Label>
            <Textarea
              id="note"
              placeholder="Spesielle forholdsregler, bruksområde, etc."
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading || loadingChemicals}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Legg til
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
