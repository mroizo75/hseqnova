"use client";

import { AlertTriangle, GraduationCap, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SUPPORT_EMAIL = "support@hseqnova.com";
const COURSE_EMAIL_SUBJECT = "Diisocyanate training — enquiry";

interface IsocyanateWarningProps {
  details?: string;
}

export function IsocyanateWarning({ details }: IsocyanateWarningProps) {
  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50">
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 font-semibold">
        Contains diisocyanates — specialist training required
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-orange-800">
          {details ||
            "This product contains diisocyanates. Under UK REACH (retained EU restriction 2020/1149), industrial and professional use at ≥0.1% requires training."}
        </p>

        <div className="bg-white p-4 rounded-md border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Required training
          </h4>
          <ul className="text-sm text-orange-800 space-y-1 mb-3">
            <li>✓ Basic chemical handling training</li>
            <li>✓ Specialist training in the safe use of diisocyanates</li>
            <li>✓ Refresh every 5 years</li>
          </ul>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700" asChild>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(COURSE_EMAIL_SUBJECT)}`}>
                <Mail className="mr-2 h-4 w-4" />
                Contact HSEQ Nova about training
              </a>
            </Button>
            <Link href="/dashboard/training" target="_blank">
              <Button size="sm" variant="outline">
                Check employee training
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-xs text-orange-700">
          <strong>Important:</strong> Anyone who handles this product must complete the required
          training before use. Record attendance in the training module.
        </p>
      </AlertDescription>
    </Alert>
  );
}

export function IsocyanateBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-300"
      title="Contains diisocyanates — specialist training required"
    >
      <AlertTriangle className="h-3 w-3" />
      Diisocyanates
    </span>
  );
}
