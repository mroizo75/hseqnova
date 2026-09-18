import Link from "next/link";
import { Award } from "lucide-react";

export function IsoEvidenceNote({
  clause,
  title,
}: {
  clause: string;
  title?: string;
}) {
  return (
    <aside className="rounded-lg border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-teal-950">
      <p className="font-medium">
        ISO evidence{title ? ` — ${title}` : ""}
      </p>
      <p className="mt-0.5 text-teal-900/80">
        This record is evidence for {clause}.{" "}
        <Link href="/dashboard/iso" className="underline underline-offset-2">
          Open the ISO work guide
        </Link>
      </p>
    </aside>
  );
}

export function IsoPackBanner() {
  return (
    <aside className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
      <Award className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
      <div className="text-sm">
        <p className="font-medium">ISO 45001 &amp; 9001 is on</p>
        <p className="text-muted-foreground">
          The same health and safety work is now the management system. Follow the{" "}
          <Link href="/dashboard/iso" className="underline underline-offset-2">
            work guide
          </Link>{" "}
          and show the{" "}
          <Link href="/dashboard/iso/auditor" className="underline underline-offset-2">
            auditor pack
          </Link>{" "}
          at certification. UKAS grants the certificate — not this software.
        </p>
      </div>
    </aside>
  );
}
