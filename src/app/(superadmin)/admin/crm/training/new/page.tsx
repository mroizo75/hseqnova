import { redirect } from "next/navigation";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingRecordForm } from "@/features/training-sales/components/training-record-form";
import { TRAINING_COURSES } from "@/features/training-sales/lib/catalogue";

export default async function NewTrainingBookingPage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Record a training booking</h1>
        <p className="text-muted-foreground">
          Adds the company, the course and the competence period to the CRM. Send the Stripe invoice from the next screen.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer and course</CardTitle>
          <CardDescription>Use this when the enquiry came in by phone or email.</CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingRecordForm courses={TRAINING_COURSES.map((course) => ({ key: course.key, title: course.title }))} />
        </CardContent>
      </Card>
    </div>
  );
}
