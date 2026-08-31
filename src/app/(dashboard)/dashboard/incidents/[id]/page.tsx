import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MeasureForm } from "@/features/measures/components/measure-form";
import { MeasureList } from "@/features/measures/components/measure-list";
import { InvestigationForm } from "@/features/incidents/components/investigation-form";
import { CloseIncidentForm } from "@/features/incidents/components/close-incident-form";
import { IncidentTreatmentForm } from "@/components/incidents/incident-treatment-form";
import { IncidentPDFExport } from "@/components/incidents/incident-pdf-export";
import {
  getIncidentTypeColor,
  getSeverityInfo,
  getIncidentStatusColor,
  getRiddorCategoryLabel,
} from "@/features/incidents/schemas/incident.schema";
import { ArrowLeft, AlertTriangle, User, MapPin, Eye, Clock, FileText, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  loadIncidentDetail,
  loadTenantDirectory,
  loadEnabledModuleKeys,
} from "@/server/queries/incidents.queries";
import { tenantHasProjectsAddon } from "@/lib/tenant-modules";
import {
  canCloseUkIncident,
  getUkIncidentHandlingChecks,
  isAccidentBookType,
} from "@/lib/incident-uk-handling";
import { RiddorReportButton } from "@/features/incidents/components/riddor-report-button";
import { AiIncidentAnalysis } from "@/features/incidents/components/ai-incident-analysis";
import { hasAiAddon } from "@/lib/ai-gate";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("dashboardIncidentDetailPage");
  const { id } = await params;
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const canReadAll = auth.permissions.canReadIncidents;
  const canReadOwn = auth.permissions.canReadOwnIncidents;
  if (!canReadAll && !canReadOwn) {
    redirect("/dashboard");
  }

  const tenantId = auth.tenantId;
  const incident = await loadIncidentDetail({
    id,
    tenantId,
    reportedBy: canReadAll ? undefined : auth.userId,
  });

  if (!incident) {
    return <div>{t("errors.notFound")}</div>;
  }

  const parsedSubcategoryKeys = (() => {
    if (!incident.subcategoryKeys) return [] as string[];
    try {
      const parsed = JSON.parse(incident.subcategoryKeys) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [];
    } catch {
      return [] as string[];
    }
  })();

  const [{ users: tenantUsers, projects: tenantProjects }, enabledModules, aiEnabled] =
    await Promise.all([
      loadTenantDirectory(tenantId),
      loadEnabledModuleKeys(tenantId),
      hasAiAddon(tenantId),
    ]);
  const showProjectFields =
    tenantHasProjectsAddon(enabledModules) ||
    Boolean(incident.projectId || incident.projectReference);

  const typeLabel = t(`labels.type.${incident.type}`);
  const typeColor = getIncidentTypeColor(incident.type);
  const { bgColor: severityColor, textColor: severityTextColor } = getSeverityInfo(incident.severity);
  const severityLabel = t(`labels.severity.${incident.severity ?? "notAssessed"}`);
  const severityBadgeText =
    incident.severity === null
      ? t("labels.severityNotAssessed")
      : t("labels.severityPrefix", { value: incident.severity, label: severityLabel });
  const statusLabel = t(`labels.status.${incident.status}`);
  const statusColor = getIncidentStatusColor(incident.status);

  const formatDate = (date: Date | null) => {
    if (!date) return t("dash");
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canClose = canCloseUkIncident(incident);
  const handlingChecks = getUkIncidentHandlingChecks(incident);
  const handlingComplete = handlingChecks.every((check) => check.done);
  const showAccidentBook = isAccidentBookType(incident.type) || incident.accidentBookEntry;
  const personLabel = (person: { name: string | null; email: string } | null) =>
    person?.name || person?.email || t("dash");


  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/incidents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("actions.backToIncidents")}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <IncidentPDFExport
              incidentId={incident.id}
              avviksnummer={incident.avviksnummer}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{incident.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {incident.avviksnummer && (
                <Badge variant="outline" className="font-mono">
                  {incident.avviksnummer}
                </Badge>
              )}
              <Badge className={typeColor}>{typeLabel}</Badge>
              <Badge className={`${severityColor} ${severityTextColor}`}>
                {severityBadgeText}
              </Badge>
              <Badge className={statusColor}>{statusLabel}</Badge>
              {(incident.source ?? "INTERNAL") === "EXTERNAL" ? (
                <Badge className="bg-violet-100 text-violet-800 border-violet-300">External</Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700 border-slate-300">Internal</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {(incident.riddorReportable || incident.isFatal) && (
        <Alert className={incident.isFatal ? "border-red-300 bg-red-50" : "border-orange-200 bg-orange-50"}>
          <AlertTriangle className={`h-4 w-4 ${incident.isFatal ? "text-red-600" : "text-orange-600"}`} />
          <AlertDescription className={incident.isFatal ? "text-red-900" : "text-orange-900"}>
            {incident.isFatal ? (
              <>
                Death arising from work: call the Incident Contact Centre immediately on{" "}
                <a className="font-semibold underline" href="tel:03453009923">
                  0345 300 9923
                </a>
                . Then complete the online report. Do not wait for the investigation.{" "}
              </>
            ) : (
              <>
                {getRiddorCategoryLabel(incident.riddorCategory)}
                {incident.riddorDueAt
                  ? ` ${t("riddor.due")}: ${new Date(incident.riddorDueAt).toLocaleDateString("en-GB")}.`
                  : ""}{" "}
              </>
            )}
            {t("riddor.reportBeforeInvestigation")} {t("riddor.official")}{" "}
            <a
              href="https://www.hse.gov.uk/riddor/"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
            >
              hse.gov.uk/riddor
            </a>
            .
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("handling.title")}</CardTitle>
          <CardDescription>{t("handling.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {handlingChecks.map((check) => (
              <li key={check.id} className="flex items-start gap-2 text-sm">
                {check.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <span>
                  <span className={check.done ? "text-foreground" : "font-medium"}>{check.label}</span>
                  <span className="block text-xs text-muted-foreground">{check.legal}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {handlingComplete ? t("handling.complete") : t("handling.open")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t("accidentBook.title")}
          </CardTitle>
          <CardDescription>{t("accidentBook.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t("sections.whatHappened.descriptionLabel")}</h4>
            <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("accidentBook.occurred")}
              </h4>
              <p className="text-sm text-muted-foreground">{formatDate(incident.occurredAt)}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("accidentBook.entered")}
              </h4>
              <p className="text-sm text-muted-foreground">{formatDate(incident.createdAt)}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("accidentBook.place")}
              </h4>
              <p className={`text-sm ${incident.location ? "text-muted-foreground" : "text-amber-700"}`}>
                {incident.location || t("accidentBook.notRecorded")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("accidentBook.injuredPerson")}
              </h4>
              <p className="text-xs text-muted-foreground mb-1">{t("accidentBook.injuredHint")}</p>
              <p className={`text-sm whitespace-pre-wrap ${incident.involvedPersons ? "text-muted-foreground" : "text-amber-700"}`}>
                {incident.involvedPersons || t("accidentBook.notRecorded")}
              </p>
              {incident.injuredPersonOccupation && (
                <p className="text-sm text-muted-foreground mt-1">
                  Occupation: {incident.injuredPersonOccupation}
                </p>
              )}
              {incident.injuredPersonAddress && (
                <p className="text-sm text-muted-foreground">
                  Address: {incident.injuredPersonAddress}
                </p>
              )}
              {incident.injuredPersonRole && (
                <p className="text-xs text-muted-foreground mt-1">
                  {incident.injuredPersonRole.replace(/_/g, " ")}
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-1">{t("accidentBook.personGivingNotice")}</h4>
              <p className="text-sm text-muted-foreground">{personLabel(incident.people.reportedBy)}</p>
              {incident.people.reportedFor && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t("accidentBook.reportedFor")}: {personLabel(incident.people.reportedFor)}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {t("accidentBook.witnesses")}
              </h4>
              <p className="text-sm text-muted-foreground">{incident.witnessName || t("accidentBook.none")}</p>
              {incident.witnessAddress && (
                <p className="text-sm text-muted-foreground">{incident.witnessAddress}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-1">{t("accidentBook.injuryNature")}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {[incident.injuryType, incident.injuryDescription].filter(Boolean).join(" — ") ||
                  t("accidentBook.notRecorded")}
              </p>
            </div>
          </div>

          {incident.immediateAction && (
            <div>
              <h4 className="font-semibold mb-2">{t("accidentBook.immediate")}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.immediateAction}</p>
            </div>
          )}

          {incident.suggestedActions && (
            <div>
              <h4 className="font-semibold mb-2">{t("sections.whatHappened.suggestedActions")}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.suggestedActions}</p>
            </div>
          )}

          {incident.risk && (
            <div>
              <h4 className="font-semibold mb-1">{t("sections.whatHappened.linkedRisk")}</h4>
              <Link href={`/dashboard/risks/${incident.risk.id}`} className="text-sm text-primary underline">
                {incident.risk.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {t("sections.whatHappened.riskScore", { score: incident.risk.score })}
              </p>
            </div>
          )}

          {incident.projectReference && showProjectFields && (
            <div>
              <h4 className="font-semibold mb-1">{t("sections.whatHappened.projectReference")}</h4>
              <p className="text-sm text-muted-foreground">{incident.projectReference}</p>
            </div>
          )}

          {incident.attachments && incident.attachments.length > 0 && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("sections.whatHappened.attachments", { count: incident.attachments.length })}
              </h4>
              <div className="space-y-3">
                {incident.attachments.map((attachment) => {
                  const isImage = attachment.mime.startsWith("image/");
                  const isPdf = attachment.mime === "application/pdf";
                  return (
                    <div key={attachment.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-lg border bg-background p-3">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/files/${attachment.fileKey}`}
                          alt={attachment.name}
                          className="h-16 w-16 rounded object-cover border"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                          <FileText className={`h-8 w-8 ${isPdf ? "text-red-500" : "text-muted-foreground"}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.mime} · {Math.round(attachment.size / 1024)} KB
                        </p>
                      </div>
                      <a href={`/api/files/${attachment.fileKey}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Open
                        </Button>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t("accidentBook.keepNote")}</p>
        </CardContent>
      </Card>

      <AiIncidentAnalysis
        incidentId={incident.id}
        title={incident.title}
        description={incident.description}
        type={incident.type}
        injuryDetails={
          [incident.injuryType, incident.injuryDescription].filter(Boolean).join(" — ") || undefined
        }
        location={incident.location ?? undefined}
        aiEnabled={aiEnabled}
      />

      {showAccidentBook && (
        <Card>
          <CardHeader>
            <CardTitle>{t("riddor.title")}</CardTitle>
            <CardDescription>
              {incident.riddorReportable
                ? t("riddor.reportBeforeInvestigation")
                : t("riddor.notReportable")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {incident.riddorReportable ? (
              <>
                <p>{getRiddorCategoryLabel(incident.riddorCategory)}</p>
                {incident.riddorDueAt && (
                  <p className="text-muted-foreground">
                    {t("riddor.due")}: {new Date(incident.riddorDueAt).toLocaleDateString("en-GB")}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {t("riddor.recordedAt")}:{" "}
                  {incident.riddorReportedAt
                    ? formatDate(incident.riddorReportedAt)
                    : t("riddor.notYetRecorded")}
                </p>
                {incident.riddorReference && (
                  <p className="text-muted-foreground">
                    {t("riddor.reference")}: {incident.riddorReference}
                  </p>
                )}
                {incident.riddorReportMethod && (
                  <p className="text-muted-foreground">
                    Method: {incident.riddorReportMethod === "phone" ? "Telephone (0345 300 9923)" : "Online (hse.gov.uk/riddor)"}
                  </p>
                )}
                <div className="mt-4">
                  <RiddorReportButton
                    incidentId={incident.id}
                    riddorCategory={incident.riddorCategory}
                    riddorDueAt={incident.riddorDueAt}
                    riddorReportedAt={incident.riddorReportedAt}
                  />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Behandle avvik */}
      {incident.status !== "CLOSED" && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>{t("sections.treatment.title")}</CardTitle>
            <CardDescription>{t("sections.treatment.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <IncidentTreatmentForm
              incidentId={incident.id}
              currentType={incident.type}
              currentSubcategoryKeys={parsedSubcategoryKeys}
              currentProjectId={incident.projectId}
              currentProjectReference={incident.projectReference}
              currentStatus={incident.status}
              currentSeverity={incident.severity}
              currentResponsibleId={incident.responsibleId}
              currentMedicalAttentionRequired={incident.medicalAttentionRequired}
              currentIsFatal={incident.isFatal}
              currentIsLostTimeIncident={incident.isLostTimeIncident}
              currentLostWorkdays={incident.lostWorkdays}
              currentIsRestrictedWork={incident.isRestrictedWork}
              currentIsFirstAidCase={incident.isFirstAidCase}
              currentIsProductionStop={incident.isProductionStop}
              currentProductionStopHours={incident.productionStopHours ? Number(incident.productionStopHours) : null}
              currentIsPropertyDamage={incident.isPropertyDamage}
              currentEstimatedDamageCost={incident.estimatedDamageCost ? Number(incident.estimatedDamageCost) : null}
              currentIsEnvironmentalRelease={incident.isEnvironmentalRelease}
              currentEnvironmentalDescription={incident.environmentalDescription}
              currentSource={incident.source ?? "INTERNAL"}
              currentInvolvedPersons={incident.involvedPersons}
              currentInjuryType={incident.injuryType}
              currentInjuryDescription={incident.injuryDescription}
              currentSuggestedActions={incident.suggestedActions}
              currentInjuredPersonOccupation={incident.injuredPersonOccupation}
              currentInjuredPersonAddress={incident.injuredPersonAddress}
              currentInjuredPersonRole={incident.injuredPersonRole}
              currentWitnessName={incident.witnessName}
              currentWitnessAddress={incident.witnessAddress}
              currentShareWithSafetyRepsConsent={incident.shareWithSafetyRepsConsent}
              currentReporterAcknowledged={incident.reporterAcknowledged}
              currentOverSevenDayInjury={incident.overSevenDayInjury}
              currentOverThreeDayInjury={incident.overThreeDayInjury}
              currentSpecifiedInjury={incident.specifiedInjury}
              currentListedOccupationalDisease={incident.listedOccupationalDisease}
              currentListedDangerousOccurrence={incident.listedDangerousOccurrence}
              currentNonWorkerTakenToHospital={incident.nonWorkerTakenToHospital}
              currentRiddorReportedAt={incident.riddorReportedAt}
              currentRiddorReference={incident.riddorReference}
              currentRiddorReportMethod={incident.riddorReportMethod}
              currentLocation={incident.location}
              showProjectFields={showProjectFields}
              users={tenantUsers}
              projects={showProjectFields ? tenantProjects : []}
            />
          </CardContent>
        </Card>
      )}

      {/* HSE HSG245: investigate in proportion to the risk */}
      {!incident.rootCause ? (
        <InvestigationForm incidentId={incident.id} users={tenantUsers} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.rootCause.title")}</CardTitle>
            <CardDescription>{t("sections.rootCause.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{t("sections.rootCause.mainCause")}</h4>
              <p className="text-sm whitespace-pre-wrap">{incident.rootCause}</p>
            </div>

            {incident.contributingFactors && (
              <div>
                <h4 className="font-semibold mb-2">{t("sections.rootCause.contributingFactors")}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.contributingFactors}
                </p>
              </div>
            )}

            {incident.investigatedAt && (
              <div className="text-sm text-muted-foreground">
                {t("sections.rootCause.investigatedAt", { date: formatDate(incident.investigatedAt) })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* HSG245: identify and implement risk control measures */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("sections.measures.title")}</CardTitle>
              <CardDescription>
                {t("sections.measures.description")}
              </CardDescription>
            </div>
            {incident.status !== "CLOSED" && (
              <MeasureForm tenantId={tenantId} incidentId={incident.id} users={tenantUsers} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MeasureList measures={incident.measures} />
          {incident.measures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("sections.measures.empty")}</p>
              <p className="text-xs mt-2">{t("sections.measures.emptyHint")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HSG245: follow up the action plan, then close the record */}
      {canClose ? (
        <CloseIncidentForm
          incidentId={incident.id}
          userId={auth.userId}
          actionCount={incident.measures.length}
        />
      ) : incident.status === "CLOSED" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.closed.title")}</CardTitle>
            <CardDescription>{t("sections.closed.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.effectivenessReview && (
              <div>
                <h4 className="font-semibold mb-2">{t("sections.closed.effectivenessReview")}</h4>
                <p className="text-sm whitespace-pre-wrap">{incident.effectivenessReview}</p>
              </div>
            )}

            {incident.lessonsLearned && (
              <div>
                <h4 className="font-semibold mb-2">{t("sections.closed.lessonsLearned")}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.lessonsLearned}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-green-600">
              <User className="h-4 w-4" />
              <span>{t("sections.closed.closedAt", { date: formatDate(incident.closedAt) })}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

