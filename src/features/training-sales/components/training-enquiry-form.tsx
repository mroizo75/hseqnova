"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitTrainingEnquiry } from "@/server/actions/training-sales.actions";

type CourseOption = { key: string; title: string };

export function TrainingEnquiryForm({
  courses,
  initialCourseKey,
}: {
  courses: CourseOption[];
  initialCourseKey: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await submitTrainingEnquiry({
      courseKey: String(form.get("courseKey") ?? ""),
      companyName: String(form.get("companyName") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      delegateCount: Number(form.get("delegateCount") ?? 1),
      preferredDate: String(form.get("preferredDate") ?? ""),
      siteNotes: String(form.get("siteNotes") ?? ""),
      website: String(form.get("website") ?? ""),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Could not send the enquiry");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="border border-[hsl(var(--home-rule))] bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Enquiry received</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">We will confirm the date and send the invoice</h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          The course, the company and the number of people are with the training team. You will get an email when the invoice is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 border border-[hsl(var(--home-rule))] bg-white p-7">
      <div className="space-y-2">
        <Label htmlFor="courseKey">Course</Label>
        <select
          id="courseKey"
          name="courseKey"
          required
          defaultValue={initialCourseKey}
          className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {courses.map((course) => (
            <option key={course.key} value={course.key}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" name="companyName" required autoComplete="organization" placeholder="Acme Ltd" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Your name</Label>
          <Input id="contactName" name="contactName" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delegateCount">Number of people</Label>
          <Input id="delegateCount" name="delegateCount" type="number" min={1} max={500} required defaultValue={1} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="preferredDate">Preferred date</Label>
          <Input id="preferredDate" name="preferredDate" type="date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="siteNotes">Site, machines and anything we should know</Label>
        <Textarea id="siteNotes" name="siteNotes" rows={4} placeholder="Boom lift on a construction site, eight operators, one supervisor." />
      </div>
      <input className="hidden" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="h-12 bg-emerald-800 text-white hover:bg-emerald-900">
        {loading ? "Sending…" : "Request this course"}
      </Button>
      <p className="text-xs leading-relaxed text-[hsl(var(--home-ink)/0.6)]">
        We invoice in pounds. Before the competence record expires we contact you, so the refresher can be booked while people are still in date.
      </p>
    </form>
  );
}
