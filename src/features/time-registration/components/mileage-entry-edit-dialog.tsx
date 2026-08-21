"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMileageEntry } from "@/server/actions/time-registration.actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MileageEntryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id: string;
    date: Date;
    kilometers: number;
    ratePerKm: number | null;
    amount: number | null;
    comment: string | null;
    project: { name: string; code: string | null };
  };
  onSuccess: () => void;
}

export function MileageEntryEditDialog({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: MileageEntryEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [kilometers, setKilometers] = useState("");
  const [ratePerKm, setRatePerKm] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (entry && open) {
      setDate(format(new Date(entry.date), "yyyy-MM-dd"));
      setKilometers(String(entry.kilometers));
      setRatePerKm(
        entry.ratePerKm != null ? String(entry.ratePerKm) : "4.5"
      );
      setComment(entry.comment || "");
    }
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(kilometers.replace(",", "."));
    const rate = parseFloat(ratePerKm.replace(",", "."));
    if (isNaN(km) || km <= 0) {
      toast({ variant: "destructive", title: "Km må være over 0" });
      return;
    }
    setLoading(true);
    try {
      const res = await updateMileageEntry(entry.id, {
        date: new Date(date),
        kilometers: km,
        ratePerKm: isNaN(rate) ? undefined : rate,
        comment: comment.trim() || undefined,
      });
      if (!res.success) throw new Error(res.error);
      toast({ title: "Km-registrering rettet" });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retting av km-registrering</DialogTitle>
          <DialogDescription>
            Admin kan rette km godtgjørelse for ansatte. Endringer logges.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Dato</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Kilometer</Label>
            <Input
              type="text"
              value={kilometers}
              onChange={(e) => setKilometers(e.target.value)}
              placeholder="120"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Kr/km</Label>
            <Input
              type="text"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(e.target.value)}
              placeholder="4.5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Kommentar</Label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Valgfritt"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Lagre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
