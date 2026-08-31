import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, PenLine, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { HandbokSectionExpanded } from "./handbok-section-expanded";
import { HandbokVersionBar } from "./handbok-version-bar";
import { HandbokSignButton } from "./handbok-sign-button";
import { HandbokReviewButton } from "./handbok-review-button";
import type {
  HandbookData,
  LiveHandbookStats,
} from "@/server/actions/hms-handbok.actions";
import {
  POLICY_PART_HINTS,
  POLICY_PART_LABELS,
  applyUkPolicyDefaults,
  isPolicySectionEnabled,
  policyModuleLinkIsActive,
  policyPartForSectionKey,
  type PolicyPart,
} from "@/lib/health-safety-policy";

interface HandbokViewerProps {
  tenantId: string;
  tenantName: string;
  orgNumber?: string | null;
  industry?: string | null;
  hmsContactName?: string | null;
  hmsContactPhone?: string | null;
  handbook: HandbookData;
  stats: LiveHandbookStats;
  currentUserId: string;
  canManage: boolean;
  canApprove: boolean;
  enabledModules?: string[];
  suggestions?: Array<{
    id: string;
    title: string;
    description: string;
    legalBasis: string | null;
    priority: number;
    targetSectionKey: string | null;
  }>;
  audience?: "management" | "employee";
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "–";
  return format(new Date(d), "d MMMM yyyy", { locale: enGB });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function HandbokViewer({
  tenantId,
  tenantName,
  orgNumber,
  industry,
  hmsContactName,
  hmsContactPhone,
  handbook,
  stats,
  currentUserId,
  canManage,
  canApprove,
  enabledModules = [],
  suggestions = [],
  audience = "management",
}: HandbokViewerProps) {
  const isEmployee = audience === "employee";
  const enabled = enabledModules;
  const currentVersion = handbook.currentVersion
    ? {
        ...handbook.currentVersion,
        sections: handbook.currentVersion.sections
          .map(function overlaySection(section) {
            const uk = applyUkPolicyDefaults(section);
            const moduleLink = policyModuleLinkIsActive(uk.moduleLink, enabled)
              ? uk.moduleLink
              : null;
            return {
              ...uk,
              moduleLink,
              children: section.children
                .map(overlaySection)
                .filter((child) => isPolicySectionEnabled(child.sectionKey, enabled)),
            };
          })
          .filter((section) => isPolicySectionEnabled(section.sectionKey, enabled))
          .map((section, index) => ({
            ...section,
            sectionNumber: String(index + 1),
          })),
      }
    : handbook.currentVersion;
  const alreadySigned = handbook.signatures.some((s) => s.userId === currentUserId);
  const isDraft = currentVersion?.status === "DRAFT";

  return (
    <div className="space-y-6">
      {/* Utkast-banner */}
      {isDraft && !isEmployee && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              You are viewing a draft (v{currentVersion.version})
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Not yet the current written policy. The Managing Director or most senior person publishes it when ready.
            </p>
          </div>
        </div>
      )}

      {/* Topkort: bedriftsinfo + status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{tenantName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {orgNumber && <>Company no.: {orgNumber} · </>}
                  {industry ?? "All industries"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage && <HandbokReviewButton tenantId={tenantId} />}
              {currentVersion && (
                <HandbokSignButton
                  tenantId={tenantId}
                  alreadySigned={alreadySigned}
                  versionId={currentVersion.id}
                />
              )}
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href="/api/hms-handbok/pdf" download>
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">MD signed / last reviewed</p>
              <p className="font-medium">{formatDate(handbook.lastReviewedAt)}</p>
              {handbook.reviewedByName && (
                <p className="text-xs text-muted-foreground">by {handbook.reviewedByName}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">H&S contact</p>
              <p className="font-medium">{hmsContactName ?? "Not set"}</p>
              {hmsContactPhone && <p className="text-xs text-muted-foreground">{hmsContactPhone}</p>}
            </div>
            <div>
              <p className="text-muted-foreground">Employees notified</p>
              <p className="font-medium">
                {currentVersion
                  ? `${currentVersion.signatureCount}/${currentVersion.totalEmployees}`
                  : handbook.signatures.length}{" "}
                of workforce
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Open incidents (30d)</p>
              <p className={`font-medium ${stats.openIncidentsLast30d > 0 ? "text-amber-600" : "text-green-600"}`}>
                {stats.openIncidentsLast30d}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-600">
        <CardContent className="py-4 text-sm">
          <p className="font-medium">HSWA 1974 s.2(3) — who must sign?</p>
          <p className="mt-1 text-muted-foreground">
            The written policy is the employer&apos;s duty. The Managing Director or most senior person
            signs the statement of intent and reviews it regularly (HSE). Employees do not approve the
            policy. The employer must <em>bring it and any revision to the notice of all employees</em>.
            The acknowledgement below is evidence that people have been notified — not a vote.
          </p>
        </CardContent>
      </Card>
      {currentVersion && !isEmployee && (
        <HandbokVersionBar
          tenantId={tenantId}
          version={currentVersion}
          canManage={canManage}
          canApprove={canApprove}
        />
      )}

      {/* Dynamiske seksjoner */}
      {currentVersion && currentVersion.sections.length > 0 ? (
        <div className="space-y-8">
          {(["statement", "organisation", "arrangements"] as PolicyPart[]).map((part) => {
            const partSections = currentVersion.sections.filter(
              (section) => policyPartForSectionKey(section.sectionKey) === part,
            );
            if (partSections.length === 0) return null;
            return (
              <div key={part} className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {POLICY_PART_LABELS[part]}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{POLICY_PART_HINTS[part]}</p>
                </div>
                {partSections.map((section) => (
                  <HandbokSectionExpanded
                    key={section.id}
                    section={section}
                    versionStatus={currentVersion.status}
                    canEdit={!isEmployee && canManage}
                    defaultExpanded={isEmployee || part !== "arrangements"}
                    showModuleLink={!isEmployee}
                    annualPlanProgress={stats.annualPlanProgress}
                    suggestions={
                      isEmployee
                        ? []
                        : suggestions.filter((s) => s.targetSectionKey === section.sectionKey)
                    }
                  />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">
              {isEmployee ? "No published policy yet" : "No sections yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isEmployee
                ? "Your employer has not yet published a written health and safety policy. Where there are five or more employees, HSWA 1974 s.2(3) requires a written statement of policy, organisation and arrangements."
                : "The health and safety policy has no content yet. Contact support to import an industry template."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signaturliste */}
      {handbook.signatures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="h-4 w-4" />
              Acknowledgements ({handbook.signatures.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Employees who have confirmed they have been shown this policy (HSWA s.2(3)).
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {handbook.signatures.slice(0, 10).map((sig) => (
                <div key={sig.id} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {initials(sig.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{sig.userName ?? sig.userEmail}</p>
                      {sig.comment && (
                        <p className="text-xs text-muted-foreground">{sig.comment}</p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(sig.signedAt), "d MMM yyyy", { locale: enGB })}
                  </span>
                </div>
              ))}
              {handbook.signatures.length > 10 && (
                <p className="pt-1 text-xs text-muted-foreground">
                  + {handbook.signatures.length - 10} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {handbook.signatures.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <PenLine className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No acknowledgements yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Employees confirm they have been notified of this policy. That is communication evidence, not approval.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
