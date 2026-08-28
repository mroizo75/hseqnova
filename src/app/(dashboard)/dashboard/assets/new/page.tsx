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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createAsset } from "@/server/actions/asset.actions";

const CATEGORIES = [
  { value: "LIFTING_EQUIPMENT", label: "Lifting equipment (LOLER)" },
  { value: "PRESSURE_EQUIPMENT", label: "Pressure equipment" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "VEHICLES", label: "Vehicles" },
  { value: "POWER_TOOLS", label: "Power tools" },
  { value: "HAND_TOOLS", label: "Hand tools" },
  { value: "PPE", label: "Personal protective equipment" },
  { value: "FIRE_EQUIPMENT", label: "Fire equipment" },
  { value: "SCAFFOLDING", label: "Scaffolding" },
  { value: "OTHER", label: "Other" },
];

const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "BIENNIAL", label: "Biennial (every 2 years)" },
];

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string" && value.trim()) {
        payload[key] = value.trim();
      }
    });

    const result = await createAsset(payload);
    if (result.success) {
      router.push("/dashboard/assets");
    } else {
      setError(result.error || "Could not create the asset");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/assets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Asset Register
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Register a new asset</h1>
        <p className="text-muted-foreground">
          Add work equipment to the register for PUWER/LOLER compliance
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Asset details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. Overhead crane #1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetTag">Asset tag / reference</Label>
                <Input id="assetTag" name="assetTag" placeholder="e.g. AST-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input id="manufacturer" name="manufacturer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial number</Label>
                <Input id="serialNumber" name="serialNumber" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g. Workshop Bay 3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase date</Label>
                  <Input id="purchaseDate" name="purchaseDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionDate">Commission date</Label>
                  <Input id="commissionDate" name="commissionDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inspection &amp; certification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspectionFrequency">Inspection frequency</Label>
                <Select name="inspectionFrequency" defaultValue="ANNUAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextInspectionDue">Next inspection due</Label>
                <Input id="nextInspectionDue" name="nextInspectionDue" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspectionProvider">Inspection provider</Label>
                <Input id="inspectionProvider" name="inspectionProvider" placeholder="e.g. Insurance company name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safeWorkingLoad">Safe working load (LOLER)</Label>
                <Input id="safeWorkingLoad" name="safeWorkingLoad" placeholder="e.g. 5 tonnes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thoroughExamDue">Thorough examination due (LOLER reg. 9)</Label>
                <Input id="thoroughExamDue" name="thoroughExamDue" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificationExpiry">Certification expiry</Label>
                <Input id="certificationExpiry" name="certificationExpiry" type="date" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap justify-end gap-3 mt-6">
          <Link href="/dashboard/assets">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Register asset"}
          </Button>
        </div>
      </form>
    </div>
  );
}
