import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, AlertCircle } from "lucide-react";

export function SafetyRepresentativeCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety representative</CardTitle>
        <CardDescription>
          Inspect the workplace and record near misses (SRSCWR 1977; Safety Representatives and Safety
          Committees Regulations).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard/inspections/new">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Start a workplace inspection
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/dashboard/incidents/new?type=NESTEN">
            <AlertCircle className="mr-2 h-4 w-4" />
            Record a near miss
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
