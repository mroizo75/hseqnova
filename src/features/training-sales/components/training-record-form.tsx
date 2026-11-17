"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createStaffTrainingBooking } from "@/server/actions/training-sales.actions";

type CourseOption = { key: string; title: string };

export function TrainingRecordForm({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const price = String(form.get("unitPriceGbp") ?? "");
    const result = await createStaffTrainingBooking({
      courseKey: String(form.get("courseKey") ?? ""),
      companyName: String(form.get("companyName") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      delegateCount: Number(form.get("delegateCount") ?? 1),
      preferredDate: String(form.get("preferredDate") ?? ""),
      courseDate: String(form.get("courseDate") ?? ""),
      unitPriceGbp: price === "" ? undefined : Number(price),
      siteNotes: String(form.get("siteNotes") ?? ""),
      website: "",
    });
    setLoading(false);
    if (!result.success || !result.data) {
      toast({ variant: "destructive", title: "Could not save the booking", description: result.error });
      return;
    }
    toast({ title: "Booking in the CRM", description: "Set the course date and send the invoice when the price is agreed." });
    router.push(`/admin/crm/training/${result.data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="courseKey">Course</Label>
        <select
          id="courseKey"
          name="courseKey"
          required
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue={courses[0]?.key}
        >
          {courses.map((course) => (
            <option key={course.key} value={course.key}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="companyName">Company</Label>
        <Input id="companyName" name="companyName" required placeholder="Acme Ltd" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactName">Contact</Label>
        <Input id="contactName" name="contactName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">Email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPhone">Phone</Label>
        <Input id="contactPhone" name="contactPhone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="delegateCount">People</Label>
        <Input id="delegateCount" name="delegateCount" type="number" min={1} max={500} required defaultValue={1} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredDate">Preferred date</Label>
        <Input id="preferredDate" name="preferredDate" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="courseDate">Confirmed course date</Label>
        <Input id="courseDate" name="courseDate" type="date" />
        <p className="text-xs text-muted-foreground">Leave blank until the date is agreed. The follow-up is dated from this.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="unitPriceGbp">Price per person (GBP, ex VAT)</Label>
        <Input id="unitPriceGbp" name="unitPriceGbp" type="number" min={1} step="0.01" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="siteNotes">Notes</Label>
        <Textarea id="siteNotes" name="siteNotes" rows={3} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Add to CRM"}
        </Button>
      </div>
    </form>
  );
}
