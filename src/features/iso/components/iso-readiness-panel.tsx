import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IsoReadiness } from "@/features/iso/lib/readiness";

const LIGHT = {
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
} as const;

export function IsoReadinessPanel({ readiness }: { readiness: IsoReadiness }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={readiness.ready ? "border-emerald-300" : "border-amber-300"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Certification readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{readiness.label}</p>
            <p className="text-sm text-muted-foreground">{readiness.percent}% of clauses assessed as compliant</p>
            <p className="mt-2 text-xs text-muted-foreground">{readiness.disclaimer}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{readiness.openGaps}</p>
            <p className="text-sm text-muted-foreground">{readiness.majorGaps} major</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chapters 4–10</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {readiness.chapters.map((chapter) => (
              <span key={chapter.id} className="inline-flex items-center gap-1.5 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${LIGHT[chapter.status]}`} />
                {chapter.title} {chapter.coveredCount}/{chapter.totalCount}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">READY gates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {readiness.gates.map((gate) => (
            <div key={gate.id} className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
              <div>
                <p className="font-medium">{gate.label}</p>
                <p className="text-sm text-muted-foreground">{gate.detail}</p>
              </div>
              <p className={gate.met ? "text-emerald-700" : "text-amber-800"}>{gate.met ? "Met" : "Open"}</p>
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            This software never grants a certificate.{" "}
            <Link href="/dashboard/iso/auditor" className="underline underline-offset-2">
              Open the auditor pack
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
