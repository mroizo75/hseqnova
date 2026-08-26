"use client";

import { useState } from "react";
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
import { createEnvironmentalMeasurement } from "@/server/actions/environment.actions";
import { useToast } from "@/hooks/use-toast";

type UserOption = { id: string; name: string | null; email: string | null };

interface EnvironmentMeasurementFormProps {
  aspectId: string;
  users: UserOption[];
}

const NO_RESPONSIBLE_VALUE = "__none_responsible__";

export function EnvironmentMeasurementForm({ aspectId, users }: EnvironmentMeasurementFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [responsibleId, setResponsibleId] = useState(users[0]?.id ?? NO_RESPONSIBLE_VALUE);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const payload = {
      aspectId,
      parameter: formData.get("parameter") as string,
      measuredValue: Number(formData.get("measuredValue")),
      unit: formData.get("unit")?.toString(),
      method: formData.get("method")?.toString(),
      limitValue: formData.get("limitValue") ? Number(formData.get("limitValue")) : undefined,
      targetValue: formData.get("targetValue") ? Number(formData.get("targetValue")) : undefined,
      measurementDate: formData.get("measurementDate")?.toString(),
      notes: formData.get("notes")?.toString(),
      responsibleId: responsibleId === NO_RESPONSIBLE_VALUE ? undefined : responsibleId,
    };

    try {
      const result = await createEnvironmentalMeasurement(payload);

      if (!result.success) {
        throw new Error(result.error || "Could not save the measurement");
      }

      (event.currentTarget as HTMLFormElement).reset();
      toast({
        title: "Measurement recorded",
        description: "The reading is saved and shown in the overview",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="parameter">Parameter *</Label>
          <Input
            id="parameter"
            name="parameter"
            placeholder="E.g. CO₂ (kg), kWh, m³ water"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="measuredValue">Measured value *</Label>
          <Input
            id="measuredValue"
            name="measuredValue"
            type="number"
            step="any"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" placeholder="E.g. kg, kWh, m³" disabled={loading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <Input
            id="method"
            name="method"
            placeholder="E.g. Meter reading, lab report"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="limitValue">Limit value</Label>
          <Input id="limitValue" name="limitValue" type="number" step="any" disabled={loading} />
          <p className="text-xs text-muted-foreground">If exceeded, the measurement is non-compliant</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetValue">Target value</Label>
          <Input id="targetValue" name="targetValue" type="number" step="any" disabled={loading} />
          <p className="text-xs text-muted-foreground">Warning when the reading is above the target</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="measurementDate">Date *</Label>
          <Input
            id="measurementDate"
            name="measurementDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Recorded by</Label>
          <Select value={responsibleId} onValueChange={setResponsibleId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_RESPONSIBLE_VALUE}>Not set</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Comments or observations"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Record measurement"}
        </Button>
      </div>
    </form>
  );
}

