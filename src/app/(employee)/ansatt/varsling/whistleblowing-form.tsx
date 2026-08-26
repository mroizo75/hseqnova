"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Copy } from "lucide-react";

const CATEGORIES = [
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "DISCRIMINATION", label: "Discrimination" },
  { value: "WORK_ENVIRONMENT", label: "Poor work environment" },
  { value: "SAFETY", label: "Health and safety risk" },
  { value: "CORRUPTION", label: "Fraud or corruption" },
  { value: "ETHICS", label: "Ethical breach" },
  { value: "LEGAL", label: "Legal violation" },
  { value: "OTHER", label: "Other" },
] as const;

interface WhistleblowingFormProps {
  tenantId: string;
  tenantSlug: string;
}

export function WhistleblowingForm({ tenantId, tenantSlug }: WhistleblowingFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    caseNumber: string;
    accessCode: string;
  } | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/whistleblowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          tenantSlug,
          category: form.get("category"),
          title: form.get("title"),
          description: form.get("description"),
          location: form.get("location") || undefined,
          occurredAt: form.get("occurredAt") || undefined,
          isAnonymous,
          reporterName: isAnonymous ? undefined : (form.get("reporterName") || undefined),
          reporterEmail: isAnonymous ? undefined : (form.get("reporterEmail") || undefined),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

      const data = await res.json();
      setResult(data.data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(
      `Case: ${result.caseNumber}\nAccess code: ${result.accessCode}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (submitted && result) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold">Report submitted</h2>
          <p className="text-muted-foreground">
            Your report has been received and will be reviewed by senior
            management. Save the details below to track your case.
          </p>
          <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Case number</span>
              <span className="font-mono font-bold">{result.caseNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Access code</span>
              <span className="font-mono font-bold">{result.accessCode}</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy details"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Keep your access code safe — it cannot be recovered if lost.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a concern</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Brief summary of your concern"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Describe the concern in detail — what happened, when, and who was involved"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input id="location" name="location" placeholder="Where did this occur?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occurredAt">Date (optional)</Label>
              <Input id="occurredAt" name="occurredAt" type="date" />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              id="anonymous"
            />
            <Label htmlFor="anonymous" className="text-sm">
              Submit anonymously
            </Label>
          </div>

          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName">Your name</Label>
                <Input id="reporterName" name="reporterName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporterEmail">Your email</Label>
                <Input id="reporterEmail" name="reporterEmail" type="email" />
              </div>
            </div>
          )}

          {/* Honeypot — hidden from real users */}
          <div className="hidden" aria-hidden="true">
            <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full h-12">
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
