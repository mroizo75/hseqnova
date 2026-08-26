import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { detectCmrClassifications } from "@/lib/cmr-detection";

interface Props {
  chemicalId: string;
  chemicalName: string;
  hazardStatements: string | null | undefined;
  isCMR: boolean;
  existingEntryCount?: number;
}

export function ExposureRegisterWarning({
  chemicalId,
  chemicalName,
  hazardStatements,
  isCMR,
  existingEntryCount = 0,
}: Props) {
  const classifications = detectCmrClassifications(hazardStatements, isCMR);
  if (classifications.length === 0) return null;

  const hasEntries = existingEntryCount > 0;

  return (
    <Card className={`border-2 ${hasEntries ? "bg-amber-50 border-amber-300" : "bg-red-50 border-red-300"}`}>
      <CardContent className="pt-5 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${hasEntries ? "text-amber-600" : "text-red-600"}`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${hasEntries ? "text-amber-900" : "text-red-900"}`}>
              {hasEntries
                ? `Health record required — ${existingEntryCount} ${existingEntryCount === 1 ? "entry" : "entries"} found`
                : "A health record is required for this substance"}
            </p>
            <p className={`text-sm mt-1 ${hasEntries ? "text-amber-800" : "text-red-800"}`}>
              {chemicalName} is classified as:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {classifications.map((c) => (
                <Badge
                  key={c.code}
                  className="bg-red-100 text-red-800 border-red-300 font-mono text-xs"
                >
                  {c.code}
                </Badge>
              ))}
            </div>
            <p className={`text-xs mt-2 ${hasEntries ? "text-amber-700" : "text-red-700"}`}>
              COSHH 2002 requires health surveillance records for relevant exposures to be kept
              for 40 years. Record anyone who is, has been or may be exposed. See{" "}
              <a
                href="https://www.hse.gov.uk/coshh/basics/surveillance.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                HSE guidance on health surveillance
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link href={`/dashboard/exposure-register/new?chemicalId=${chemicalId}`}>
              <Button
                size="sm"
                className={hasEntries ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700"}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Record exposure
              </Button>
            </Link>
            {hasEntries && (
              <Link href={`/dashboard/exposure-register?chemical=${chemicalId}`}>
                <Button size="sm" variant="outline" className="w-full border-amber-400 text-amber-800 hover:bg-amber-100">
                  View records
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExposureRegisterBadge({
  hazardStatements,
  isCMR,
}: {
  hazardStatements: string | null | undefined;
  isCMR: boolean;
}) {
  const classifications = detectCmrClassifications(hazardStatements, isCMR);
  if (classifications.length === 0) return null;

  return (
    <Badge className="bg-red-100 text-red-800 border-red-300 text-xs gap-1">
      <AlertTriangle className="h-3 w-3" />
      Health record
    </Badge>
  );
}
