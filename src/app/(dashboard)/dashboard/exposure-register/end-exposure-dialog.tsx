"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";
import { markExposureInactive } from "@/server/actions/exposure-register.actions";
import { useToast } from "@/hooks/use-toast";

interface Props {
  id: string;
  employeeName: string;
  exposureAgent: string;
}

export function EndExposureDialog({ id, employeeName, exposureAgent }: Props) {
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!endDate) return;
    startTransition(async () => {
      const result = await markExposureInactive(id, new Date(endDate));
      if (result.success) {
        toast({
          title: "Exposure ended",
          description: `${employeeName} – ${exposureAgent} is marked as ended`,
          className: "bg-green-50 border-green-200",
        });
        setOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Could not save",
          description: result.error || "Could not end the exposure",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
        >
          <CheckCircle className="h-3 w-3" />
          End
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End exposure</DialogTitle>
          <DialogDescription>
            Set the end date. The record is kept for 40 years under COSHH 2002.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">Employee:</span> <strong>{employeeName}</strong></p>
            <p><span className="text-muted-foreground">Substance:</span> <strong>{exposureAgent}</strong></p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endDate">Exposure end date *</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            <p className="text-xs text-muted-foreground">
              Date exposure stopped (e.g. last working day with the substance)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!endDate || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" />Confirm end</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
