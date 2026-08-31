"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPermitToWork } from "@/server/actions/permit-to-work.actions";
import { PERMIT_TYPES, PERMIT_TYPE_KEYS } from "@/lib/permit-uk";
import { PermitLegalNote } from "@/features/permits/components/permit-legal-note";

const PPE_OPTIONS = [
  "Hard hat",
  "Safety glasses",
  "Hi-vis vest",
  "Safety boots",
  "Gloves",
  "Ear protection",
  "Respiratory protection",
  "Fall arrest harness",
  "Face shield",
  "Coveralls",
];

export default function NewPermitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [hazards, setHazards] = useState("");
  const [controlMeasures, setControlMeasures] = useState("");
  const [isolations, setIsolations] = useState("");
  const [emergencyArrangements, setEmergencyArrangements] = useState("");
  const [selectedPpe, setSelectedPpe] = useState<string[]>([]);

  function togglePpe(item: string) {
    setSelectedPpe((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createPermitToWork({
        type,
        title,
        location,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : undefined,
        description,
        hazards,
        controlMeasures,
        isolationsRequired: isolations,
        ppeRequired: selectedPpe,
        emergencyArrangements,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/dashboard/permits");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Could not create the permit";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/permits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">New permit to work</h1>
          <p className="text-sm text-muted-foreground">
            Written control for specified high-risk work (HSWA 1974 s.2; HSG250)
          </p>
        </div>
      </div>

      <PermitLegalNote />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Permit details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMIT_TYPE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {PERMIT_TYPES[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hot work on roof level 3"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Building A, 3rd floor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of work *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What work will be done, and how..."
                rows={3}
                required
                minLength={10}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid from *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Valid to *</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Permits are time-limited (HSG250).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hazards and controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hazards">Hazards identified *</Label>
              <Textarea
                id="hazards"
                value={hazards}
                onChange={(e) => setHazards(e.target.value)}
                placeholder="List the hazards this permit controls..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="controlMeasures">Control measures *</Label>
              <Textarea
                id="controlMeasures"
                value={controlMeasures}
                onChange={(e) => setControlMeasures(e.target.value)}
                placeholder="Describe the controls that make the work safe..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isolations">Isolations required</Label>
              <Textarea
                id="isolations"
                value={isolations}
                onChange={(e) => setIsolations(e.target.value)}
                placeholder="Electrical, mechanical or process isolations, if any..."
                rows={3}
              />
            </div>

            {type === "CONFINED_SPACE" && (
              <div className="space-y-2">
                <Label htmlFor="emergencyArrangements">
                  Emergency and rescue arrangements *
                </Label>
                <Textarea
                  id="emergencyArrangements"
                  value={emergencyArrangements}
                  onChange={(e) => setEmergencyArrangements(e.target.value)}
                  placeholder="How people will be rescued, who is on standby, equipment..."
                  rows={4}
                  required
                  minLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Confined Spaces Regulations 1997 reg.5 — in place before anyone enters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PPE required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {PPE_OPTIONS.map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ppe-${item}`}
                    checked={selectedPpe.includes(item)}
                    onCheckedChange={() => togglePpe(item)}
                  />
                  <Label htmlFor={`ppe-${item}`} className="font-normal cursor-pointer">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Creating..." : "Create permit"}
          </Button>
          <Link href="/dashboard/permits">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
