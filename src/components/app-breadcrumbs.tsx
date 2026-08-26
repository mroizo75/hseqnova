"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  samsvarserklaringer: "Compliance declarations",
  "juridisk-register": "Legal register",
  incidents: "Accident book",
  statistics: "Statistics",
  projects: "Projects",
  "construction-compliance": "CDM",
  sja: "RAMS",
  inspections: "Inspections",
  training: "Training",
  actions: "Actions",
  chemicals: "COSHH",
  fill: "Complete",
  risks: "Risk assessments",
  "risk-register": "Risk register",
  wellbeing: "Wellbeing",
  complaints: "Complaints",
  feedback: "Feedback",
  environment: "Environment",
  bcm: "Business continuity",
  audits: "Audits",
  "management-reviews": "Management review",
  "annual-hms-plan": "Annual H&S plan",
  meetings: "Meetings",
  "time-registration": "Time recording",
  whistleblowing: "Whistleblowing",
  goals: "Goals",
  settings: "Settings",
  users: "Users",
  ansatt: "Employee",
  profil: "Profile",
  dokumenter: "Documents",
  avvik: "Incidents",
  ny: "New",
  new: "New",
  ruh: "Incident report",
  stoffkartotek: "COSHH",
  opplaering: "Training",
  timeregistrering: "Time recording",
  "hms-handbok": "Health and safety policy",
  "health-safety-policy": "Health and safety policy",
  "hms-tavle": "Safety board",
  "fire-drills": "Fire drills",
  organisasjonskart: "Organisation chart",
  medarbeidersamtale: "Appraisals",
  "exposure-register": "Exposure register",
};

function isLikelyEntityId(segment: string): boolean {
  return /^[a-z0-9_-]{10,}$/i.test(segment);
}

function formatSegmentLabel(segment: string, previousSegment?: string): string {
  if (isLikelyEntityId(segment)) {
    if (previousSegment === "projects") return "Project";
    if (previousSegment === "incidents") return "Incident";
    return "Details";
  }

  const mapped = segmentLabels[segment];
  if (mapped) return mapped;

  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;
  if (segments[0] !== "dashboard" && segments[0] !== "ansatt") return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const previousSegment = index > 0 ? segments[index - 1] : undefined;
    const label = formatSegmentLabel(segment, previousSegment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4 border-b pb-3 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index === 0 ? <Home className="h-4 w-4" aria-hidden="true" /> : null}
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
            {!crumb.isLast ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
