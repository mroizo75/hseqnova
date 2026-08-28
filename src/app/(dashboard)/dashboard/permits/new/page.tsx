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

const PERMIT_TYPES = [
  { value: "HOT_WORK", label: "Hot Work" },
  { value: "CONFINED_SPACE", label: "Confined Space" },
  { value: "WORKING_AT_HEIGHT", label: "Working at Height" },
  { value: "EXCAVATION", label: "Excavation" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "GENERAL", label: "General" },
];

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
  const [selectedPpe, setSelectedPpe] = useState<string[]>([]);

  function togglePpe(item: string) {
    setSelectedPpe((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!type || !title || !validFrom) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      const isolationsData = JSON.stringify({
        description: description,
        hazards,
        controlMeasures,
        isolationsRequired: isolations,
        ppeRequired: selectedPpe,
      });

      await createPermitToWork({
        type,
        title,
        location: location || undefined,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : undefined,
        isolations: isolationsData,
      });

      router.push("/dashboard/permits");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Failed to create permit";
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
          <h1 className="text-xl sm:text-2xl font-bold">New Permit to Work</h1>
          <p className="text-sm text-muted-foreground">
            Create a permit for controlled high-risk activities
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Permit Details</CardTitle>
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
                    {PERMIT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Building A, 3rd floor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of work</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work to be carried out..."
                rows={3}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Valid to</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hazards &amp; Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hazards">Hazards identified</Label>
              <Textarea
                id="hazards"
                value={hazards}
                onChange={(e) => setHazards(e.target.value)}
                placeholder="List all identified hazards..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="controlMeasures">Control measures</Label>
              <Textarea
                id="controlMeasures"
                value={controlMeasures}
                onChange={(e) => setControlMeasures(e.target.value)}
                placeholder="Describe control measures in place..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isolations">Isolations required</Label>
              <Textarea
                id="isolations"
                value={isolations}
                onChange={(e) => setIsolations(e.target.value)}
                placeholder="List any isolations required (electrical, mechanical, etc.)..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PPE Required</CardTitle>
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
