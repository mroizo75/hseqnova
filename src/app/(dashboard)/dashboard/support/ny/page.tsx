import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateSupportTicketForm } from "@/features/support/components/create-support-ticket-form";

export const metadata = {
  title: "New support ticket | HSEQ Nova",
};

export default function NewSupportTicketPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/dashboard/support">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to support
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New ticket for HSEQ representative</CardTitle>
          <CardDescription>
            Describe what you need help with. An HSEQ representative will reply in the
            ticket thread — usually the next working day, sooner for high priority.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSupportTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
