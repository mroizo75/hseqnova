-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('INVOICE', 'DIRECT_DEBIT', 'CARD');

-- CreateEnum
CREATE TYPE "TenantModuleStatus" AS ENUM ('ACTIVE', 'TRIAL', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ADMIN_CREATED', 'DOCUMENTS_UPLOADED', 'TRAINING_SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TenantOfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TenantActivityType" AS ENUM ('CONTACT', 'FOLLOW_UP', 'OFFER_SENT', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "TenantActivityChannel" AS ENUM ('PHONE', 'EMAIL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('STANDARD', 'FREE_14_DAY');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('CONSTRUCTION', 'ELEKTRO', 'OFFSHORE', 'MARINE', 'OIL_GAS', 'FISKERI', 'BERGVERK', 'HEALTHCARE', 'TRANSPORT', 'MANUFACTURING', 'RETAIL', 'HOSPITALITY', 'EDUCATION', 'TECHNOLOGY', 'AGRICULTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HMS', 'LEDER', 'VERNEOMBUD', 'ANSATT', 'BHT', 'REVISOR');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('LAW', 'PROCEDURE', 'CHECKLIST', 'FORM', 'SDS', 'PLAN', 'OTHER');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentSignerRole" AS ENUM ('UTARBEIDET_AV', 'KONTROLLERT_AV', 'GODKJENT_AV');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATING', 'ACCEPTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('STRATEGIC', 'OPERATIONAL', 'SAFETY', 'HEALTH', 'ENVIRONMENTAL', 'LEGAL', 'INFORMATION_SECURITY', 'PSYCHOSOCIAL', 'ERGONOMIC', 'ORGANISATIONAL', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "RiskResponseStrategy" AS ENUM ('AVOID', 'REDUCE', 'TRANSFER', 'ACCEPT');

-- CreateEnum
CREATE TYPE "RiskTrend" AS ENUM ('INCREASING', 'STABLE', 'DECREASING');

-- CreateEnum
CREATE TYPE "RiskDocumentRelation" AS ENUM ('SUPPORTING', 'POLICY', 'PROCEDURE', 'CONTROL_REPORT', 'WORK_INSTRUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskAuditRelation" AS ENUM ('CONTROL_TEST', 'FOLLOW_UP', 'OBSERVATION', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskControlType" AS ENUM ('PREVENTIVE', 'DETECTIVE', 'CORRECTIVE', 'DIRECTIONAL', 'COMPENSATING');

-- CreateEnum
CREATE TYPE "RiskControlStatus" AS ENUM ('ACTIVE', 'NEEDS_IMPROVEMENT', 'RETIRED');

-- CreateEnum
CREATE TYPE "RiskControlEffectiveness" AS ENUM ('EFFECTIVE', 'PARTIAL', 'INEFFECTIVE', 'NOT_TESTED');

-- CreateEnum
CREATE TYPE "ExposureLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ControlFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'BIENNIAL');

-- CreateEnum
CREATE TYPE "SecurityAssetType" AS ENUM ('INFORMATION_SYSTEM', 'APPLICATION', 'INFRASTRUCTURE', 'DOCUMENT', 'PEOPLE', 'FACILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "CIAValue" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SecurityControlCategory" AS ENUM ('ORGANIZATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "SecurityControlStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'IMPLEMENTED', 'LIVE');

-- CreateEnum
CREATE TYPE "SecurityControlMaturity" AS ENUM ('INITIAL', 'MANAGED', 'DEFINED', 'OPTIMIZED');

-- CreateEnum
CREATE TYPE "AccessReviewStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AccessDecision" AS ENUM ('REVIEW', 'APPROVED', 'REVOKED');

-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('EMAIL', 'PHONE', 'MEETING', 'SURVEY', 'SOCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'SHARED', 'FOLLOW_UP', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ActionEffectiveness" AS ENUM ('NOT_EVALUATED', 'EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE');

-- CreateEnum
CREATE TYPE "MeasureCategory" AS ENUM ('CORRECTIVE', 'PREVENTIVE', 'IMPROVEMENT', 'MITIGATION');

-- CreateEnum
CREATE TYPE "EnvironmentalAspectCategory" AS ENUM ('RESOURCE_USE', 'ENERGY', 'WATER', 'WASTE', 'EMISSIONS', 'BIODIVERSITY', 'OTHER');

-- CreateEnum
CREATE TYPE "EnvironmentalImpactType" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "EnvironmentalAspectStatus" AS ENUM ('ACTIVE', 'MONITORED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EnvironmentalMeasurementStatus" AS ENUM ('COMPLIANT', 'WARNING', 'NON_COMPLIANT');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('AVVIK', 'NESTEN', 'ULYKKE', 'FARLIG_SITUASJON', 'YRKESSYKDOM', 'MILJO', 'KVALITET', 'CUSTOMER', 'HMS', 'SKADE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'ACTION_TAKEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentStage" AS ENUM ('REPORTED', 'UNDER_REVIEW', 'ROOT_CAUSE', 'ACTIONS_DEFINED', 'ACTIONS_COMPLETE', 'VERIFIED');

-- CreateEnum
CREATE TYPE "RuhCategory" AS ENUM ('PERSONSKADE', 'NESTENULYKKE', 'MATERIELL_SKADE', 'BRANN_EKSPLOSJON', 'UTSLIPP_MILJO', 'TRUSLER_VOLD', 'ERGONOMI', 'ANNET');

-- CreateEnum
CREATE TYPE "RuhStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SjaStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SjaConclusion" AS ENUM ('NOT_DECIDED', 'APPROVED', 'CONDITIONAL', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL', 'EXTERNAL', 'SUPPLIER', 'CERTIFICATION');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('MAJOR_NC', 'MINOR_NC', 'OBSERVATION', 'STRENGTH');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('QUALITY', 'HMS', 'ENVIRONMENT', 'CUSTOMER', 'EFFICIENCY', 'FINANCE', 'COMPETENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'AT_RISK', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CALCULATED');

-- CreateEnum
CREATE TYPE "ChemicalStatus" AS ENUM ('ACTIVE', 'PHASED_OUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExposureType" AS ENUM ('INHALATION', 'SKIN', 'NOISE', 'VIBRATION', 'BIOLOGICAL', 'RADIATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ExposureRegisterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('VERNERUNDE', 'HMS_INSPEKSJON', 'BRANN├ÿVELSE', 'SHA_PLAN', 'SIKKERHETSVANDRING', 'ANDRE');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionFindingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('ALL', 'ROLES', 'USERS', 'ROLES_AND_USERS');

-- CreateEnum
CREATE TYPE "FormCategory" AS ENUM ('MEETING', 'INSPECTION', 'INCIDENT', 'RISK', 'TRAINING', 'CHECKLIST', 'TIMESHEET', 'WELLBEING', 'BCM', 'COMPLAINT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'PROJECT', 'CHECKBOX', 'RADIO', 'SELECT', 'FILE', 'SIGNATURE', 'LIKERT_SCALE', 'SECTION_HEADER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoutineStatus" AS ENUM ('ACTIVE', 'DRAFT', 'NEEDS_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ManagementReviewStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('AMU', 'VO', 'BHT', 'HMS_COMMITTEE', 'OTHER');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('CHAIR', 'SECRETARY', 'MEMBER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WhistleblowCategory" AS ENUM ('HARASSMENT', 'DISCRIMINATION', 'WORK_ENVIRONMENT', 'SAFETY', 'CORRUPTION', 'ETHICS', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "WhistleblowStatus" AS ENUM ('RECEIVED', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'ACTION_TAKEN', 'RESOLVED', 'CLOSED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "WhistleblowSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('REPORTER', 'HANDLER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_INCIDENT', 'INCIDENT_UPDATED', 'INCIDENT_CLOSED', 'INCIDENT_OVERDUE', 'FORM_SUBMITTED', 'FORM_APPROVED', 'FORM_REJECTED', 'WHISTLEBLOWING', 'WHISTLEBLOWING_MSG', 'MEASURE_OVERDUE', 'MEASURE_ASSIGNED', 'MEASURE_DUE_SOON', 'MEASURE_REMINDER', 'AUDIT_SCHEDULED', 'AUDIT_REMINDER', 'AUDIT_FINDING_OPEN', 'TRAINING_DUE', 'TRAINING_EXPIRED', 'TRAINING_ASSIGNED', 'MEETING_REMINDER', 'MEETING_SCHEDULED', 'INSPECTION_REMINDER', 'INSPECTION_SCHEDULED', 'INSPECTION_OVERDUE', 'INSPECTION_FINDING', 'RISK_REVIEW_DUE', 'RISK_HIGH_SCORE', 'RISK_CONTROL_DUE', 'DOCUMENT_REVIEW_DUE', 'DOCUMENT_EXPIRED', 'DOCUMENT_APPROVED', 'ROUTINE_ASSIGNED', 'ROUTINE_REVIEW_DUE', 'CHEMICAL_SDS_REVIEW', 'CHEMICAL_EXPIRED', 'GOAL_AT_RISK', 'GOAL_MEASUREMENT_DUE', 'ENVIRONMENTAL_LIMIT', 'MGMT_REVIEW_DUE', 'MGMT_REVIEW_SCHEDULED', 'EMPLOYEE_REVIEW_DUE', 'EMPLOYEE_REVIEW_UPCOMING', 'EMPLOYEE_REVIEW_SIGN', 'DAILY_DIGEST', 'WEEKLY_DIGEST', 'SYSTEM_ALERT', 'GUEST_SUBMISSION', 'SUPPORT_TICKET', 'SUPPORT_MSG', 'IMPROVEMENT_SUGGESTION', 'IMPROVEMENT_REMINDER', 'HMS_SCORE_DROP', 'HMS_SCORE_MILESTONE', 'ROUTINE_COMPLIANCE_ALERT', 'LAW_CHANGE_ALERT', 'HANDBOOK_APPROVAL_REQUESTED', 'HANDBOOK_NEW_VERSION');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('QUESTION', 'HMS_ADVICE', 'TECHNICAL', 'BILLING', 'FEATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportSenderType" AS ENUM ('CUSTOMER', 'SUPPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('MEETING_UPCOMING', 'INSPECTION_UPCOMING', 'AUDIT_UPCOMING', 'MGMT_REVIEW_UPCOMING', 'MEASURE_DUE_SOON', 'TRAINING_EXPIRING', 'DOCUMENT_REVIEW_SOON', 'CHEMICAL_REVIEW_SOON', 'RISK_REVIEW_SOON', 'GOAL_MEASUREMENT_SOON', 'DAILY_TASKS', 'WEEKLY_SUMMARY');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BhtPackageType" AS ENUM ('BASIC', 'EXTENDED');

-- CreateEnum
CREATE TYPE "BhtClientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "BhtAssessmentStatus" AS ENUM ('DRAFT', 'AI_ANALYZED', 'SENT_TO_CUSTOMER', 'CUSTOMER_RESPONDED', 'BHT_REVIEWED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BhtConsultationType" AS ENUM ('ON_REQUEST', 'ASSESSMENT_RELATED', 'OPERATIONAL_CHANGE', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "BhtConsultationMethod" AS ENUM ('DIGITAL_MEETING', 'PHONE', 'WRITTEN', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "BhtMeetingType" AS ENUM ('DIGITAL', 'IN_PERSON', 'HYBRID');

-- CreateEnum
CREATE TYPE "BhtAmoStatus" AS ENUM ('PLANNED', 'PREPARED', 'CONDUCTED', 'MINUTES_DONE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BhtInspectionStatus" AS ENUM ('PLANNED', 'PREPARED', 'CONDUCTED', 'REPORT_DONE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BhtExposureConclusion" AS ENUM ('SUFFICIENT', 'NEEDS_FOLLOWUP');

-- CreateEnum
CREATE TYPE "BhtExposureStatus" AS ENUM ('DRAFT', 'AI_ANALYZED', 'BHT_REVIEWED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BhtReportStatus" AS ENUM ('DRAFT', 'AI_GENERATED', 'BHT_REVIEWED', 'FINAL', 'MANAGEMENT_REVIEWED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CdmDutyHolderRole" AS ENUM ('CLIENT', 'PRINCIPAL_DESIGNER', 'PRINCIPAL_CONTRACTOR', 'DESIGNER', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "PermitToWorkStatus" AS ENUM ('DRAFT', 'ISSUED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConstructionPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConstructionNotificationStatus" AS ENUM ('DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED', 'UPDATED_AFTER_SUBMISSION');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('NORMAL', 'OVERTIME_50', 'OVERTIME_40', 'OVERTIME_100', 'WEEKEND', 'TRAVEL', 'SICK_LEAVE');

-- CreateEnum
CREATE TYPE "FireDrillType" AS ENUM ('EVACUATION', 'FIRE_SUPPRESSION', 'ALARM_TEST', 'FULL_SCALE');

-- CreateEnum
CREATE TYPE "FireDrillStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EVALUATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HmsTavlePlan" AS ENUM ('ENKEL', 'STANDARD', 'AVANSERT', 'ADDON');

-- CreateEnum
CREATE TYPE "HmsTavleSubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HmsTavleSectionType" AS ENUM ('SHA_PLAN', 'MANNSKAPSLISTE', 'AVVIK_STATISTIKK', 'RUH_LISTE', 'SJA_AKTIVE', 'VERNERUNDE_STATUS', 'KONTAKTINFO', 'BEREDSKAPSPLAN', 'DOKUMENT_HUB', 'EKSTERN_LENKE', 'VAERMELDING', 'KPI_DASHBOARD', 'HMS_PLAN_AARSHJUL', 'FREMDRIFTSPLAN', 'RIGGPLAN', 'RISIKOMATRISE', 'OPPLARING_STATUS', 'LOVKRAV_SJEKKLISTE', 'NYHETER_MELDINGER', 'SNARVEIER', 'GJEST_SKJEMA', 'GJESTESERVICE_STATUS');

-- CreateEnum
CREATE TYPE "TavleDisplayMode" AS ENUM ('SIDEBAR', 'FAST', 'KARUSELL', 'FOKUS');

-- CreateEnum
CREATE TYPE "ExternalLinkType" AS ENUM ('EXCEL', 'PDF', 'HMS_SYSTEM', 'SHAREPOINT', 'ANNET');

-- CreateEnum
CREATE TYPE "SubcontractorSubmissionType" AS ENUM ('AVVIK', 'RUH', 'SJA', 'NESTENULYKKE', 'PDF_RAPPORT');

-- CreateEnum
CREATE TYPE "SubcontractorSubmissionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'LINKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmployeeReviewStatus" AS ENUM ('PLANLAGT', 'FORBEREDT', 'GJENNOMFORT', 'SIGNERT', 'AVBRUTT');

-- CreateEnum
CREATE TYPE "EmployeeReviewGoalStatus" AS ENUM ('IKKE_STARTET', 'PAGAENDE', 'OPPNADD', 'IKKE_OPPNADD');

-- CreateEnum
CREATE TYPE "EmployeeReviewGoalCategory" AS ENUM ('FAGLIG', 'PERSONLIG', 'VIRKSOMHET');

-- CreateEnum
CREATE TYPE "PsykososialtNiva" AS ENUM ('FORSVARLIG', 'DELVIS_FORSVARLIG', 'IKKE_FORSVARLIG');

-- CreateEnum
CREATE TYPE "GuestSubmissionType" AS ENUM ('AVVIK', 'KLAGE', 'MATFORGIFTNING', 'SPORSMAAL', 'TILBAKEMELDING');

-- CreateEnum
CREATE TYPE "HandbookVersionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('RECURRING_INCIDENT', 'INSPECTION_TREND', 'TRAINING_GAP', 'RISK_ESCALATION', 'MEASURE_INEFFECTIVE', 'COMPLIANCE_DRIFT', 'RUH_TREND', 'SJA_COVERAGE_GAP', 'CHEMICAL_COMPLIANCE', 'FIRE_SAFETY_GAP', 'MANAGEMENT_REVIEW_OVERDUE');

-- CreateEnum
CREATE TYPE "SuggestionTarget" AS ENUM ('UPDATE_ROUTINE', 'CREATE_ROUTINE', 'UPDATE_HANDBOOK', 'ADD_TRAINING', 'ADD_RISK_ASSESSMENT', 'UPDATE_SJA_TEMPLATE', 'SCHEDULE_INSPECTION');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('ROUTINE_UPDATED', 'ROUTINE_CREATED', 'TRAINING_ADDED', 'RISK_REASSESSED', 'SJA_UPDATED', 'INSPECTION_SCHEDULED', 'HANDBOOK_REVIEWED', 'MEASURE_ADDED');

-- CreateEnum
CREATE TYPE "ScoreTrend" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSupport" BOOLEAN NOT NULL DEFAULT false,
    "lastTenantId" TEXT,
    "supabaseUserId" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyBySms" BOOLEAN NOT NULL DEFAULT false,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "notifyMeetings" BOOLEAN NOT NULL DEFAULT true,
    "notifyInspections" BOOLEAN NOT NULL DEFAULT true,
    "notifyAudits" BOOLEAN NOT NULL DEFAULT true,
    "notifyMeasures" BOOLEAN NOT NULL DEFAULT true,
    "notifyIncidents" BOOLEAN NOT NULL DEFAULT true,
    "notifyDocuments" BOOLEAN NOT NULL DEFAULT true,
    "notifyTraining" BOOLEAN NOT NULL DEFAULT true,
    "notifyRisks" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "preferredLocale" TEXT NOT NULL DEFAULT 'en-GB',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgNumber" TEXT,
    "companyNumber" TEXT,
    "vatNumber" TEXT,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "invoiceEmail" TEXT,
    "purchaseOrderNumber" TEXT,
    "billingMethod" "BillingMethod" NOT NULL DEFAULT 'INVOICE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "invoiceAddress" TEXT,
    "invoicePostalCode" TEXT,
    "invoiceCity" TEXT,
    "employeeCount" INTEGER,
    "pricingTier" "PricingTier",
    "industry" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboardingCompletedAt" TIMESTAMP(3),
    "salesRep" TEXT,
    "registrationType" "RegistrationType" NOT NULL DEFAULT 'STANDARD',
    "hmsAnnualPlanEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hmsAnnualPlanConfig" JSONB,
    "managementReviewFrequencyMonths" INTEGER NOT NULL DEFAULT 12,
    "hmsContactName" TEXT,
    "hmsContactPhone" TEXT,
    "hmsContactEmail" TEXT,
    "azureAdTenantId" TEXT,
    "azureAdEnabled" BOOLEAN NOT NULL DEFAULT false,
    "azureAdSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "azureAdLastSync" TIMESTAMP(3),
    "azureAdDomain" TEXT,
    "azureAdAutoRole" "Role",
    "termsAcceptedAt" TIMESTAMP(3),
    "contractAcceptedIp" TEXT,
    "logoUrl" TEXT,
    "startpakkeCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupGuideHidden" BOOLEAN NOT NULL DEFAULT false,
    "simpleMenuItems" JSONB,
    "dashboardLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedDashboardConfig" JSONB,
    "moduleVisibilityConfig" JSONB,
    "ruhModuleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timeRegistrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyHoursNorm" DOUBLE PRECISION NOT NULL DEFAULT 37.5,
    "overtime50Multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "overtime40Multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.4,
    "overtime100Multiplier" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "useOvertime40Percent" BOOLEAN NOT NULL DEFAULT false,
    "defaultKmRate" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "kmAllowanceTaxable" BOOLEAN NOT NULL DEFAULT false,
    "lunchBreakMinutes" INTEGER NOT NULL DEFAULT 30,
    "eveningOvertimeFromHour" INTEGER,
    "saturdayOvertime40LimitHours" DOUBLE PRECISION,
    "defaultHourlyRate" DOUBLE PRECISION,
    "approximateTaxPercent" DOUBLE PRECISION,
    "constructionDailyCheckAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "constructionDailyCheckAlertRole" "Role" NOT NULL DEFAULT 'HMS',
    "isTavleOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "status" "TenantModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripePriceId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSequence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sequenceType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsAnnualPlanCompletion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "stepKey" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedByUserId" TEXT,
    "note" TEXT,

    CONSTRAINT "HmsAnnualPlanCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TenantActivityType" NOT NULL,
    "channel" "TenantActivityChannel" NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantOffer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "TenantOfferStatus" NOT NULL DEFAULT 'DRAFT',
    "token" TEXT NOT NULL,
    "yearlyPrice" DOUBLE PRECISION NOT NULL,
    "bindingMonths" INTEGER NOT NULL DEFAULT 12,
    "noticeMonths" INTEGER NOT NULL DEFAULT 3,
    "setupPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "orgNumber" TEXT,
    "industry" "Industry" NOT NULL,
    "employees" INTEGER NOT NULL,
    "ceoName" TEXT NOT NULL,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "hmsResponsible" TEXT,
    "hmsEmail" TEXT,
    "hmsPhone" TEXT,
    "safetyRep" TEXT,
    "safetyRepEmail" TEXT,
    "safetyRepPhone" TEXT,
    "hasBHT" BOOLEAN NOT NULL DEFAULT false,
    "bhtProvider" TEXT,
    "bhtContact" TEXT,
    "departments" JSONB,
    "completedTraining" JSONB,
    "companyDescription" TEXT,
    "registerKey" TEXT,
    "handbookKey" TEXT,
    "riskKey" TEXT,
    "trainingKey" TEXT,
    "vernerundeKey" TEXT,
    "amuKey" TEXT,
    "zipKey" TEXT,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "generatedAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "convertedToTrial" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "isFreeTrialPackage" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "newsletterSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "lastNewsletterSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DOUBLE PRECISION NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "invoiceNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountExVat" DOUBLE PRECISION,
    "vatAmount" DOUBLE PRECISION,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "purchaseOrderNumber" TEXT,
    "taxPoint" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "period" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceExport" (
    "id" TEXT NOT NULL,
    "exportedById" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "invoiceCount" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "fileName" TEXT NOT NULL,
    "invoiceIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTenant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT,
    "employeeNumber" TEXT,
    "managerId" TEXT,
    "position" TEXT,
    "displayName" TEXT,
    "phone" TEXT,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyBySms" BOOLEAN NOT NULL DEFAULT false,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "notifyMeetings" BOOLEAN NOT NULL DEFAULT true,
    "notifyInspections" BOOLEAN NOT NULL DEFAULT true,
    "notifyAudits" BOOLEAN NOT NULL DEFAULT true,
    "notifyMeasures" BOOLEAN NOT NULL DEFAULT true,
    "notifyIncidents" BOOLEAN NOT NULL DEFAULT true,
    "notifyDocuments" BOOLEAN NOT NULL DEFAULT true,
    "notifyTraining" BOOLEAN NOT NULL DEFAULT true,
    "notifyRisks" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "invitationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'DRAFT',
    "fileKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'application/pdf',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "ownerId" TEXT,
    "templateId" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "reviewIntervalMonths" INTEGER NOT NULL DEFAULT 12,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "planSummary" TEXT,
    "doSummary" TEXT,
    "checkSummary" TEXT,
    "actSummary" TEXT,
    "visibleToRoles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'application/pdf',
    "changeComment" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "pdcaGuidance" JSONB,
    "defaultReviewIntervalMonths" INTEGER NOT NULL DEFAULT 12,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signedById" TEXT NOT NULL,
    "role" "DocumentSignerRole" NOT NULL,
    "signatureImg" TEXT NOT NULL,
    "comment" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgChartNode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "name" TEXT,
    "department" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgChartNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectroComplianceDeclaration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ELEKTRO',
    "fileKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'application/pdf',
    "originalFileName" TEXT NOT NULL,
    "contractorName" TEXT,
    "workCompletedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectroComplianceDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectroInstruction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'RUTINE',
    "fileKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'application/pdf',
    "originalFileName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectroInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalReference" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "paragraphRef" TEXT,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "industries" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "assessmentYear" INTEGER NOT NULL,
    "participants" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskAssessmentId" TEXT,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "consequence" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "category" "RiskCategory" NOT NULL DEFAULT 'OPERATIONAL',
    "location" TEXT,
    "area" TEXT,
    "description" TEXT,
    "existingControls" TEXT,
    "residualLikelihood" INTEGER,
    "residualConsequence" INTEGER,
    "residualScore" INTEGER,
    "nextReviewDate" TIMESTAMP(3),
    "controlFrequency" "ControlFrequency" DEFAULT 'ANNUAL',
    "riskStatement" TEXT,
    "kpiId" TEXT,
    "inspectionTemplateId" TEXT,
    "linkedProcess" TEXT,
    "riskAppetite" TEXT,
    "riskTolerance" TEXT,
    "responseStrategy" "RiskResponseStrategy" NOT NULL DEFAULT 'REDUCE',
    "trend" "RiskTrend" NOT NULL DEFAULT 'STABLE',
    "reviewedAt" TIMESTAMP(3),
    "assessmentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskDocumentLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "relation" "RiskDocumentRelation" NOT NULL DEFAULT 'SUPPORTING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskDocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAuditLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "relation" "RiskAuditRelation" NOT NULL DEFAULT 'CONTROL_TEST',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAuditLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskControl" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "controlType" "RiskControlType" NOT NULL DEFAULT 'PREVENTIVE',
    "ownerId" TEXT,
    "status" "RiskControlStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveness" "RiskControlEffectiveness" NOT NULL DEFAULT 'NOT_TESTED',
    "frequency" "ControlFrequency",
    "lastTestedAt" TIMESTAMP(3),
    "nextTestDate" TIMESTAMP(3),
    "monitoringMethod" TEXT,
    "evidenceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskChemicalLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "chemicalId" TEXT NOT NULL,
    "exposure" "ExposureLevel" NOT NULL DEFAULT 'MEDIUM',
    "ppRequired" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskChemicalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskTrainingRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "courseKey" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskTrainingRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAsset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SecurityAssetType" NOT NULL DEFAULT 'INFORMATION_SYSTEM',
    "ownerId" TEXT,
    "confidentiality" "CIAValue" NOT NULL DEFAULT 'MEDIUM',
    "integrity" "CIAValue" NOT NULL DEFAULT 'MEDIUM',
    "availability" "CIAValue" NOT NULL DEFAULT 'MEDIUM',
    "businessCriticality" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityControl" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requirement" TEXT,
    "annexReference" TEXT,
    "category" "SecurityControlCategory" NOT NULL DEFAULT 'ORGANIZATIONAL',
    "status" "SecurityControlStatus" NOT NULL DEFAULT 'PLANNED',
    "maturity" "SecurityControlMaturity" NOT NULL DEFAULT 'INITIAL',
    "ownerId" TEXT,
    "linkedAssetId" TEXT,
    "linkedRiskId" TEXT,
    "implementationNote" TEXT,
    "monitoring" TEXT,
    "lastTestDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityControlDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityControlDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "attachmentKey" TEXT,
    "collectedById" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "systemName" TEXT,
    "status" "AccessReviewStatus" NOT NULL DEFAULT 'PLANNED',
    "dueDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReviewEntry" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "role" TEXT,
    "decision" "AccessDecision" NOT NULL DEFAULT 'REVIEW',
    "comment" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessReviewEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT,
    "customerCompany" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "source" "FeedbackSource" NOT NULL DEFAULT 'EMAIL',
    "sentiment" "FeedbackSentiment" NOT NULL DEFAULT 'POSITIVE',
    "rating" INTEGER,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "highlights" TEXT,
    "feedbackDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "followUpStatus" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "followUpOwnerId" TEXT,
    "followUpNotes" TEXT,
    "linkedGoalId" TEXT,
    "linkedIncidentId" TEXT,
    "attachments" TEXT,
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "riskId" TEXT,
    "incidentId" TEXT,
    "auditId" TEXT,
    "goalId" TEXT,
    "environmentalAspectId" TEXT,
    "fireDrillId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "effectiveness" "ActionEffectiveness" NOT NULL DEFAULT 'NOT_EVALUATED',
    "effectivenessNote" TEXT,
    "followUpFrequency" "ControlFrequency" DEFAULT 'ANNUAL',
    "costEstimate" INTEGER,
    "benefitEstimate" INTEGER,
    "category" "MeasureCategory" NOT NULL DEFAULT 'CORRECTIVE',
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalAspect" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "process" TEXT,
    "location" TEXT,
    "category" "EnvironmentalAspectCategory" NOT NULL DEFAULT 'RESOURCE_USE',
    "impactType" "EnvironmentalImpactType" NOT NULL DEFAULT 'NEGATIVE',
    "severity" INTEGER NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "significanceScore" INTEGER NOT NULL,
    "legalRequirement" TEXT,
    "controlMeasures" TEXT,
    "monitoringMethod" TEXT,
    "monitoringFrequency" "ControlFrequency" DEFAULT 'ANNUAL',
    "ownerId" TEXT,
    "goalId" TEXT,
    "status" "EnvironmentalAspectStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextReviewDate" TIMESTAMP(3),
    "lastMeasurementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentalAspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalMeasurement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aspectId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "unit" TEXT,
    "method" TEXT,
    "limitValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "measuredValue" DOUBLE PRECISION NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "status" "EnvironmentalMeasurementStatus" NOT NULL DEFAULT 'COMPLIANT',
    "notes" TEXT,
    "responsibleId" TEXT,
    "attachmentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentalMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "avviksnummer" TEXT,
    "type" "IncidentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedForUserId" TEXT,
    "responsibleId" TEXT,
    "location" TEXT,
    "witnessName" TEXT,
    "immediateAction" TEXT,
    "rootCause" TEXT,
    "contributingFactors" TEXT,
    "investigatedBy" TEXT,
    "investigatedAt" TIMESTAMP(3),
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerTicketId" TEXT,
    "responseDeadline" TIMESTAMP(3),
    "customerSatisfaction" INTEGER,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "stage" "IncidentStage" NOT NULL DEFAULT 'REPORTED',
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "effectivenessReview" TEXT,
    "lessonsLearned" TEXT,
    "injuryType" TEXT,
    "medicalAttentionRequired" BOOLEAN NOT NULL DEFAULT false,
    "lostTimeMinutes" INTEGER,
    "riskReferenceId" TEXT,
    "measureEffectiveness" "ActionEffectiveness" DEFAULT 'NOT_EVALUATED',
    "involvedPersons" TEXT,
    "injuryDescription" TEXT,
    "suggestedActions" TEXT,
    "isFatal" BOOLEAN NOT NULL DEFAULT false,
    "isLostTimeIncident" BOOLEAN NOT NULL DEFAULT false,
    "lostWorkdays" INTEGER,
    "isRestrictedWork" BOOLEAN NOT NULL DEFAULT false,
    "isFirstAidCase" BOOLEAN NOT NULL DEFAULT false,
    "isProductionStop" BOOLEAN NOT NULL DEFAULT false,
    "productionStopHours" DECIMAL(6,1),
    "isPropertyDamage" BOOLEAN NOT NULL DEFAULT false,
    "estimatedDamageCost" DECIMAL(12,2),
    "isEnvironmentalRelease" BOOLEAN NOT NULL DEFAULT false,
    "environmentalDescription" TEXT,
    "subcategoryKeys" TEXT,
    "projectId" TEXT,
    "projectReference" TEXT,
    "source" TEXT NOT NULL DEFAULT 'INTERNAL',
    "relatedRoutineId" TEXT,
    "areaTag" TEXT,
    "riddorReportable" BOOLEAN NOT NULL DEFAULT false,
    "riddorCategory" TEXT,
    "riddorDueAt" TIMESTAMP(3),
    "riddorReportedAt" TIMESTAMP(3),
    "riddorReference" TEXT,
    "overSevenDayInjury" BOOLEAN NOT NULL DEFAULT false,
    "accidentBookEntry" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuhReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruhNummer" TEXT,
    "category" "RuhCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "reportedBy" TEXT NOT NULL,
    "reportedById" TEXT,
    "involvedPersons" TEXT,
    "witnessName" TEXT,
    "injuryOccurred" BOOLEAN NOT NULL DEFAULT false,
    "injuryDescription" TEXT,
    "immediateAction" TEXT,
    "suggestedActions" TEXT,
    "status" "RuhStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuhReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentSubcategoryOption" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "industry" TEXT NOT NULL DEFAULT 'GENERELL',
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentSubcategoryOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjaAnalysis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sjaNummer" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "workLocation" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "status" "SjaStatus" NOT NULL DEFAULT 'DRAFT',
    "conclusion" "SjaConclusion" NOT NULL DEFAULT 'NOT_DECIDED',
    "conclusionComment" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "participants" TEXT,
    "additionalConditions" TEXT,
    "weatherConditions" TEXT,
    "imageUrls" TEXT,
    "submittedAt" TIMESTAMP(3),
    "signedByNames" TEXT,
    "templateId" TEXT,
    "templateName" TEXT,
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SjaAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjaHazard" (
    "id" TEXT NOT NULL,
    "sjaAnalysisId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "activity" TEXT NOT NULL,
    "hazard" TEXT NOT NULL,
    "consequence" TEXT,
    "probability" INTEGER NOT NULL DEFAULT 1,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "riskLevel" INTEGER NOT NULL DEFAULT 1,
    "measures" TEXT NOT NULL,
    "responsibleName" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SjaHazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjaTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SjaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjaTemplateHazard" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "activity" TEXT NOT NULL,
    "hazard" TEXT NOT NULL,
    "consequence" TEXT,
    "probability" INTEGER NOT NULL DEFAULT 1,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "measures" TEXT NOT NULL,
    "responsibleName" TEXT,

    CONSTRAINT "SjaTemplateHazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "completedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "proofDocKey" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "effectiveness" TEXT,
    "evaluatedBy" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "courseKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "validityYears" INTEGER,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL DEFAULT 'INTERNAL',
    "scope" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "leadAuditorId" TEXT NOT NULL,
    "teamMemberIds" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "area" TEXT NOT NULL,
    "department" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'PLANNED',
    "summary" TEXT,
    "conclusion" TEXT,
    "reportKey" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "findingType" "FindingType" NOT NULL,
    "clause" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "correctiveAction" TEXT,
    "rootCause" TEXT,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL DEFAULT 'QUALITY',
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "unit" TEXT,
    "baseline" DOUBLE PRECISION,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "startDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiMeasurement" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "measurementType" "MeasurementType" NOT NULL DEFAULT 'MANUAL',
    "comment" TEXT,
    "measuredById" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chemical" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "supplier" TEXT,
    "casNumber" TEXT,
    "hazardClass" TEXT,
    "hazardStatements" TEXT,
    "precautionaryStatements" TEXT,
    "warningPictograms" TEXT,
    "requiredPPE" TEXT,
    "sdsKey" TEXT,
    "sdsVersion" TEXT,
    "sdsDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "location" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "status" "ChemicalStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastVerifiedBy" TEXT,
    "ecNumber" TEXT,
    "isCMR" BOOLEAN NOT NULL DEFAULT false,
    "isSVHC" BOOLEAN NOT NULL DEFAULT false,
    "containsIsocyanates" BOOLEAN NOT NULL DEFAULT false,
    "reachStatus" TEXT,
    "hazardLevel" INTEGER,
    "substitutionPriority" TEXT,
    "autoSuggestedAlternatives" TEXT,
    "lastEchaSync" TIMESTAMP(3),
    "aiExtractedData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chemical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExposureRegister" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "employeeBirthNumber" TEXT NOT NULL,
    "department" TEXT,
    "jobTitle" TEXT NOT NULL,
    "workLocation" TEXT NOT NULL,
    "employmentStartDate" TIMESTAMP(3),
    "employmentEndDate" TIMESTAMP(3),
    "chemicalId" TEXT,
    "exposureAgent" TEXT NOT NULL,
    "casNumber" TEXT,
    "exposureType" "ExposureType" NOT NULL DEFAULT 'INHALATION',
    "exposureStartDate" TIMESTAMP(3) NOT NULL,
    "exposureEndDate" TIMESTAMP(3),
    "duration" TEXT,
    "ppeUsed" TEXT,
    "riskAssessmentDone" BOOLEAN NOT NULL DEFAULT false,
    "healthCheckRequired" BOOLEAN NOT NULL DEFAULT false,
    "healthCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "healthCheckDate" TIMESTAMP(3),
    "retentionYears" INTEGER NOT NULL DEFAULT 40,
    "retentionUntilDate" TIMESTAMP(3) NOT NULL,
    "status" "ExposureRegisterStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "ruhReportId" TEXT,
    "riskId" TEXT,
    "comment" TEXT,
    "registeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExposureRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "incidentId" TEXT,
    "ruhReportId" TEXT,
    "sjaAnalysisId" TEXT,
    "objectType" TEXT,
    "objectId" TEXT,
    "fileKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "InspectionType" NOT NULL DEFAULT 'VERNERUNDE',
    "status" "InspectionStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "location" TEXT,
    "area" TEXT,
    "riskCategory" "RiskCategory",
    "templateId" TEXT,
    "formTemplateId" TEXT,
    "formSubmissionId" TEXT,
    "conductedBy" TEXT NOT NULL,
    "participants" TEXT,
    "checklist" JSONB,
    "durationMinutes" INTEGER,
    "followUpById" TEXT,
    "nextInspection" TIMESTAMP(3),
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "riskCategory" "RiskCategory",
    "checklist" JSONB,
    "industryScope" JSONB,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionFinding" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "location" TEXT,
    "imageKeys" TEXT,
    "status" "InspectionFindingStatus" NOT NULL DEFAULT 'OPEN',
    "responsibleId" TEXT,
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "linkedRiskId" TEXT,
    "linkedMeasureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "numberPrefix" TEXT,
    "category" "FormCategory" NOT NULL DEFAULT 'CUSTOM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "allowTenantDeletion" BOOLEAN NOT NULL DEFAULT true,
    "industryScope" JSONB,
    "allowAnonymousResponses" BOOLEAN NOT NULL DEFAULT false,
    "accessType" "AccessType" NOT NULL DEFAULT 'ALL',
    "allowedRoles" TEXT,
    "allowedUsers" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "placeholder" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "validation" TEXT,
    "options" TEXT,
    "conditionalLogic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "submissionNumber" TEXT,
    "submittedById" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "content" JSONB,
    "legalReference" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "industryScope" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "content" JSONB,
    "legalReference" TEXT,
    "status" "RoutineStatus" NOT NULL DEFAULT 'ACTIVE',
    "responsibleId" TEXT,
    "reviewIntervalMonths" INTEGER NOT NULL DEFAULT 12,
    "nextReviewAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormFieldValue" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "fileKey" TEXT,

    CONSTRAINT "FormFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "categoryId" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "relatedPosts" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "conductedBy" TEXT NOT NULL,
    "participants" TEXT,
    "hmsGoalsReview" TEXT,
    "incidentStatistics" TEXT,
    "riskReview" TEXT,
    "auditResults" TEXT,
    "trainingStatus" TEXT,
    "resourcesReview" TEXT,
    "externalChanges" TEXT,
    "wellbeingSummary" TEXT,
    "conclusions" TEXT,
    "decisions" TEXT,
    "actionPlan" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "status" "ManagementReviewStatus" NOT NULL DEFAULT 'PLANNED',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagementReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL DEFAULT 'AMU',
    "title" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "agenda" TEXT,
    "summary" TEXT,
    "notes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "organizer" TEXT NOT NULL,
    "minuteTaker" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "externalName" TEXT,
    "externalEmail" TEXT,
    "role" "ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingDecision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "decisionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "DecisionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Whistleblowing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "category" "WhistleblowCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "location" TEXT,
    "involvedPersons" TEXT,
    "witnesses" TEXT,
    "reporterName" TEXT,
    "reporterEmail" TEXT,
    "reporterPhone" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "status" "WhistleblowStatus" NOT NULL DEFAULT 'RECEIVED',
    "severity" "WhistleblowSeverity" NOT NULL DEFAULT 'MEDIUM',
    "handledBy" TEXT,
    "assignedTo" TEXT,
    "investigationNotes" TEXT,
    "actions" TEXT,
    "outcome" TEXT,
    "closedReason" TEXT,
    "attachments" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "investigatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Whistleblowing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhistleblowMessage" (
    "id" TEXT NOT NULL,
    "whistleblowingId" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "senderUserId" TEXT,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "readByReporter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhistleblowMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPushToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationPushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "SupportTicketCategory" NOT NULL DEFAULT 'QUESTION',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderType" "SupportSenderType" NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReminder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentViaEmail" BOOLEAN NOT NULL DEFAULT false,
    "sentViaSms" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtClient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bhtProviderId" TEXT,
    "contractStartDate" TIMESTAMP(3) NOT NULL,
    "contractEndDate" TIMESTAMP(3),
    "packageType" "BhtPackageType" NOT NULL DEFAULT 'BASIC',
    "status" "BhtClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtAssessment" (
    "id" TEXT NOT NULL,
    "bhtClientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "BhtAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "aiSuggestedRisks" TEXT,
    "aiSuggestedIssues" TEXT,
    "aiSuggestedActions" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "sentToCustomerAt" TIMESTAMP(3),
    "customerConfirmedAt" TIMESTAMP(3),
    "customerComments" TEXT,
    "customerAdditions" TEXT,
    "bhtReviewedBy" TEXT,
    "bhtReviewedAt" TIMESTAMP(3),
    "bhtComments" TEXT,
    "adjustedRiskLevel" TEXT,
    "adjustedActions" TEXT,
    "finalReportUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtConsultation" (
    "id" TEXT NOT NULL,
    "bhtClientId" TEXT NOT NULL,
    "consultationType" "BhtConsultationType" NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "conductedBy" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "method" "BhtConsultationMethod" NOT NULL,
    "isWithinScope" BOOLEAN NOT NULL DEFAULT true,
    "outOfScopeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtAmoMeeting" (
    "id" TEXT NOT NULL,
    "bhtClientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "preparedIssues" TEXT,
    "preparedRisks" TEXT,
    "preparedSickLeave" TEXT,
    "aiSuggestedAgenda" TEXT,
    "meetingDate" TIMESTAMP(3),
    "meetingType" "BhtMeetingType" NOT NULL DEFAULT 'DIGITAL',
    "participants" TEXT,
    "agenda" TEXT,
    "minutes" TEXT,
    "decisions" TEXT,
    "actionsRegistered" BOOLEAN NOT NULL DEFAULT false,
    "status" "BhtAmoStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtAmoMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtInspection" (
    "id" TEXT NOT NULL,
    "bhtClientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "aiGeneratedChecklist" TEXT,
    "basedOnIndustry" TEXT,
    "basedOnPreviousFindings" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "inspectionType" "BhtMeetingType" NOT NULL DEFAULT 'DIGITAL',
    "participants" TEXT,
    "findings" TEXT,
    "improvements" TEXT,
    "reportUrl" TEXT,
    "actionsRegistered" BOOLEAN NOT NULL DEFAULT false,
    "status" "BhtInspectionStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtExposureAssessment" (
    "id" TEXT NOT NULL,
    "bhtClientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "chemicalInventory" TEXT,
    "jobDescriptions" TEXT,
    "assessmentData" TEXT,
    "aiExposureAnalysis" TEXT,
    "aiRiskLevel" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "bhtReviewedBy" TEXT,
    "bhtReviewedAt" TIMESTAMP(3),
    "conclusion" "BhtExposureConclusion",
    "furtherActionNeeded" BOOLEAN NOT NULL DEFAULT false,
    "furtherActionNotes" TEXT,
    "assessmentNotes" TEXT,
    "status" "BhtExposureStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtExposureAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtAnnualReport" (
    "id" TEXT NOT NULL,
    "bhtClientId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "assessmentSummary" TEXT,
    "consultationsSummary" TEXT,
    "amoOrInspectionSummary" TEXT,
    "exposureSummary" TEXT,
    "aiDraftReport" TEXT,
    "aiSuggestedActions" TEXT,
    "aiNextYearPlan" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "bhtReviewedBy" TEXT,
    "bhtReviewedAt" TIMESTAMP(3),
    "bhtAdjustments" TEXT,
    "finalReportUrl" TEXT,
    "managementReviewedAt" TIMESTAMP(3),
    "managementReviewedBy" TEXT,
    "checkAssessmentDone" BOOLEAN NOT NULL DEFAULT false,
    "checkConsultationsDone" BOOLEAN NOT NULL DEFAULT false,
    "checkAmoOrInspectionDone" BOOLEAN NOT NULL DEFAULT false,
    "checkExposureDone" BOOLEAN NOT NULL DEFAULT false,
    "checkReportDone" BOOLEAN NOT NULL DEFAULT false,
    "checkActionsDone" BOOLEAN NOT NULL DEFAULT false,
    "status" "BhtReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtAnnualReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "tier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'komplett-pakke',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "orderNumber" TEXT,
    "clientName" TEXT,
    "location" TEXT,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "projectManagerId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionShaPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ConstructionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationChart" TEXT,
    "progressPlan" TEXT,
    "specificMeasures" TEXT,
    "changeProcedure" TEXT,
    "builderName" TEXT,
    "builderRepresentativeName" TEXT,
    "builderRepresentativeContact" TEXT,
    "coordinatorPlanningName" TEXT,
    "coordinatorExecutionName" TEXT,
    "conflictAssessmentDocumented" BOOLEAN NOT NULL DEFAULT false,
    "availableOnSite" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionShaPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CdmDutyHolder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" "CdmDutyHolderRole" NOT NULL,
    "organisationName" TEXT NOT NULL,
    "companyNumber" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CdmDutyHolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoshhAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chemicalId" TEXT,
    "taskDescription" TEXT NOT NULL,
    "exposureRoutes" TEXT,
    "existingControls" TEXT,
    "additionalControls" TEXT,
    "healthSurveillance" BOOLEAN NOT NULL DEFAULT false,
    "reviewDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoshhAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitToWork" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" "PermitToWorkStatus" NOT NULL DEFAULT 'DRAFT',
    "isolations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitToWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionPreNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ConstructionNotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "submissionDate" TIMESTAMP(3),
    "projectAddress" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "builderName" TEXT NOT NULL,
    "builderOrgNumber" TEXT,
    "builderAddress" TEXT,
    "builderPhone" TEXT,
    "builderRepresentativeName" TEXT,
    "builderRepresentativePhone" TEXT,
    "coordinators" TEXT,
    "designers" TEXT,
    "contractors" TEXT,
    "expectedStartDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3),
    "maxWorkersSimultaneous" INTEGER,
    "plannedBusinessesCount" INTEGER,
    "visibleAtSite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionPreNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionRosterEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerOrgNumber" TEXT,
    "hiringCompanyName" TEXT,
    "hmsCardNumber" TEXT,
    "startedAtSiteDate" DATE,
    "endedAtSiteDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionRosterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionRosterDailyCheck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "checkedDate" DATE NOT NULL,
    "checkedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionRosterDailyCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "timeType" "TimeEntryType" NOT NULL DEFAULT 'NORMAL',
    "workedUntilHour" INTEGER,
    "comment" TEXT,
    "editedById" TEXT,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MileageEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kilometers" DOUBLE PRECISION NOT NULL,
    "ratePerKm" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "comment" TEXT,
    "editedById" TEXT,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MileageEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "href" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "isSimpleMode" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "hmsPulseItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireDrill" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "drillType" "FireDrillType" NOT NULL DEFAULT 'EVACUATION',
    "isAnnounced" BOOLEAN NOT NULL DEFAULT true,
    "status" "FireDrillStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "responsibleId" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "scenario" TEXT,
    "riskAssessment" TEXT,
    "participantIds" TEXT,
    "sharedPremises" BOOLEAN NOT NULL DEFAULT false,
    "buildingOwnerCoordinated" BOOLEAN,
    "buildingOwnerName" TEXT,
    "otherTenantsInformed" BOOLEAN,
    "fullBuildingEvacuation" BOOLEAN,
    "totalBuildingOccupants" INTEGER,
    "completedAt" TIMESTAMP(3),
    "actualParticipantCount" INTEGER,
    "evacuationTimeSeconds" INTEGER,
    "observations" TEXT,
    "objectivesAchieved" TEXT,
    "evaluation" TEXT,
    "improvementPoints" TEXT,
    "procedureChangesNeeded" BOOLEAN,
    "procedureChangesDesc" TEXT,
    "evaluatedBy" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FireDrill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsTavleSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "HmsTavlePlan" NOT NULL DEFAULT 'STANDARD',
    "status" "HmsTavleSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAddon" BOOLEAN NOT NULL DEFAULT false,
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "maxTavler" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HmsTavleSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsTavle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "publicToken" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "kioskMode" BOOLEAN NOT NULL DEFAULT false,
    "bransje" TEXT DEFAULT 'BYGG_ANLEGG',
    "siteAddress" TEXT,
    "clientName" TEXT,
    "workEndedAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "manualContacts" JSONB,
    "manualDocuments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HmsTavle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsTavleSection" (
    "id" TEXT NOT NULL,
    "tavleId" TEXT NOT NULL,
    "type" "HmsTavleSectionType" NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "displayMode" "TavleDisplayMode" NOT NULL DEFAULT 'KARUSELL',
    "config" JSONB NOT NULL,

    CONSTRAINT "HmsTavleSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsTavleExternalLink" (
    "id" TEXT NOT NULL,
    "tavleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ExternalLinkType" NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HmsTavleExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractorPortal" (
    "id" TEXT NOT NULL,
    "tavleId" TEXT NOT NULL,
    "portalToken" TEXT NOT NULL,
    "allowAvvik" BOOLEAN NOT NULL DEFAULT true,
    "allowRuh" BOOLEAN NOT NULL DEFAULT true,
    "allowSja" BOOLEAN NOT NULL DEFAULT true,
    "allowPdfUpload" BOOLEAN NOT NULL DEFAULT true,
    "requireEmail" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SubcontractorPortal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractorSubmission" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "SubcontractorSubmissionType" NOT NULL,
    "status" "SubcontractorSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT,
    "company" TEXT,
    "orgNr" TEXT,
    "data" JSONB NOT NULL,
    "attachmentUrls" JSONB NOT NULL DEFAULT '[]',
    "linkedIncidentId" TEXT,
    "linkedRuhId" TEXT,
    "linkedSjaId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcontractorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "status" "EmployeeReviewStatus" NOT NULL DEFAULT 'PLANLAGT',
    "ansattForberedelse" TEXT,
    "ansattMedvirkning" TEXT,
    "trivselScore" INTEGER,
    "arbeidsmiljoeScore" INTEGER,
    "samarbeidScore" INTEGER,
    "psykKravOgForventninger" "PsykososialtNiva",
    "psykEmosjonelleKrav" "PsykososialtNiva",
    "psykArbeidsmengde" "PsykososialtNiva",
    "psykStotteOgHjelp" "PsykososialtNiva",
    "psykKommentar" TEXT,
    "maloppnaelseKommentar" TEXT,
    "kompetanseKommentar" TEXT,
    "opplaeringsOnske" TEXT,
    "karrierePlaner" TEXT,
    "tilretteleggingBehov" TEXT,
    "arbeidstidKommentar" TEXT,
    "lederTilbakemeldingTilAnsatt" TEXT,
    "ansattTilbakemeldingTilLeder" TEXT,
    "oppsummeringKommentar" TEXT,
    "signertAvAnsatt" BOOLEAN NOT NULL DEFAULT false,
    "signertAvLeder" BOOLEAN NOT NULL DEFAULT false,
    "ansattSignertAt" TIMESTAMP(3),
    "lederSignertAt" TIMESTAMP(3),
    "konfidensielt" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeReviewGoal" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EmployeeReviewGoalCategory" NOT NULL DEFAULT 'FAGLIG',
    "status" "EmployeeReviewGoalStatus" NOT NULL DEFAULT 'IKKE_STARTET',
    "deadline" TIMESTAMP(3),
    "note" TEXT,
    "overfortTilNeste" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeReviewGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeReviewAction" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ansvarlig" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeReviewAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TavleCheckin" (
    "id" TEXT NOT NULL,
    "tavleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employer" TEXT,
    "employerOrgNr" TEXT,
    "hmsCardNr" TEXT,
    "birthDate" TEXT,
    "phone" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMP(3),
    "date" TEXT NOT NULL,

    CONSTRAINT "TavleCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TavleGuestSubmission" (
    "id" TEXT NOT NULL,
    "tavleId" TEXT NOT NULL,
    "type" "GuestSubmissionType" NOT NULL,
    "message" TEXT NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "roomOrTable" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NY',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "trackingToken" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'nb',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "attachments" JSONB,
    "consentContact" BOOLEAN NOT NULL DEFAULT false,
    "internalNotes" TEXT,
    "assignedToId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "slaDueAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TavleGuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GjesteHendelse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "guestName" TEXT,
    "guestContact" TEXT,
    "injurySeverity" TEXT,
    "actionsTaken" TEXT,
    "notifiedPolice" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAmbulance" BOOLEAN NOT NULL DEFAULT false,
    "notifiedParents" BOOLEAN NOT NULL DEFAULT false,
    "reportedToMattilsynet" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'AAPEN',
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GjesteHendelse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotellEvakueringsplan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "buildingName" TEXT,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "maxOccupancy" INTEGER,
    "assemblyPoint" TEXT,
    "fireWarden" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReviewedAt" TIMESTAMP(3),
    "floors" JSONB NOT NULL DEFAULT '[]',
    "emergencyContacts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotellEvakueringsplan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktivitetsUtstyrssjekk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "utstyrsType" TEXT NOT NULL,
    "utstyrsNavn" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "checkedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "findings" TEXT,
    "actionsTaken" TEXT,
    "nextCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktivitetsUtstyrssjekk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportJournal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleReg" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT,
    "routeDesc" TEXT,
    "kmStart" DOUBLE PRECISION,
    "kmEnd" DOUBLE PRECISION,
    "drivingHours" DOUBLE PRECISION,
    "breakHours" DOUBLE PRECISION,
    "preCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "preCheckNote" TEXT,
    "incidents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SjaforDokument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "kompetansebevis" TEXT,
    "kbUtlopDato" TIMESTAMP(3),
    "forerkortNr" TEXT,
    "forerkortKlasse" TEXT,
    "forerkortUtlop" TIMESTAMP(3),
    "adrSertifikat" TEXT,
    "adrUtlop" TIMESTAMP(3),
    "notat" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SjaforDokument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyveRegister" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loyveType" TEXT NOT NULL,
    "loyveNummer" TEXT NOT NULL,
    "kjoretoyReg" TEXT,
    "utstedtAv" TEXT,
    "utlopDato" TIMESTAMP(3),
    "vilkar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyveRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaccpPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaccpPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaccpCcp" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "hazardDesc" TEXT NOT NULL,
    "hazardType" TEXT NOT NULL,
    "criticalLimit" TEXT NOT NULL,
    "monitorMethod" TEXT NOT NULL,
    "monitorFreq" TEXT NOT NULL,
    "corrAction" TEXT NOT NULL,
    "verifyMethod" TEXT NOT NULL,
    "recordRequired" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HaccpCcp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperaturLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "measuredBy" TEXT,
    "isDeviation" BOOLEAN NOT NULL DEFAULT false,
    "deviationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperaturLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergenOversikt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dishName" TEXT NOT NULL,
    "category" TEXT,
    "hasGluten" BOOLEAN NOT NULL DEFAULT false,
    "hasKrepsdyr" BOOLEAN NOT NULL DEFAULT false,
    "hasEgg" BOOLEAN NOT NULL DEFAULT false,
    "hasFisk" BOOLEAN NOT NULL DEFAULT false,
    "hasPeanut" BOOLEAN NOT NULL DEFAULT false,
    "hasSoya" BOOLEAN NOT NULL DEFAULT false,
    "hasMelk" BOOLEAN NOT NULL DEFAULT false,
    "hasNotter" BOOLEAN NOT NULL DEFAULT false,
    "hasSelleri" BOOLEAN NOT NULL DEFAULT false,
    "hasSennep" BOOLEAN NOT NULL DEFAULT false,
    "hasSesamfro" BOOLEAN NOT NULL DEFAULT false,
    "hasSulfitt" BOOLEAN NOT NULL DEFAULT false,
    "hasLupin" BOOLEAN NOT NULL DEFAULT false,
    "hasBlotkdyr" BOOLEAN NOT NULL DEFAULT false,
    "additionalInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerified" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllergenOversikt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MattilsynetInspeksjon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "inspector" TEXT,
    "smilejesKarakter" TEXT,
    "findings" TEXT,
    "followUpDeadline" TIMESTAMP(3),
    "followUpNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MattilsynetInspeksjon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhtAvtale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leverandorNavn" TEXT NOT NULL,
    "leverandorOrgnr" TEXT,
    "kontaktperson" TEXT,
    "kontaktTelefon" TEXT,
    "kontaktEpost" TEXT,
    "startDato" TIMESTAMP(3) NOT NULL,
    "sluttDato" TIMESTAMP(3),
    "arsTimeverk" INTEGER,
    "naringskode" TEXT,
    "bransjeKrav" TEXT,
    "avtaleUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhtAvtale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NattarbeidVurdering" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stillingNavn" TEXT NOT NULL,
    "begrunnelse" TEXT NOT NULL,
    "alternativVurd" TEXT,
    "helseVurdering" BOOLEAN NOT NULL DEFAULT false,
    "samRadVo" BOOLEAN NOT NULL DEFAULT false,
    "godkjentAv" TEXT,
    "godkjentDato" TIMESTAMP(3),
    "gyldigTil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NattarbeidVurdering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceConsent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "optedIn" BOOLEAN NOT NULL DEFAULT true,
    "optedInAt" TIMESTAMP(3),
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustrySnapshot" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "tenantCount" INTEGER NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "incidentCount" INTEGER NOT NULL,
    "incidentsByType" JSONB NOT NULL,
    "incidentsBySeverity" JSONB NOT NULL,
    "avgMttr" DOUBLE PRECISION,
    "trir" DOUBLE PRECISION,
    "ltir" DOUBLE PRECISION,
    "avgRiskScore" DOUBLE PRECISION,
    "risksByCategory" JSONB NOT NULL,
    "risksOpenCount" INTEGER NOT NULL,
    "measuresTotal" INTEGER NOT NULL,
    "measuresCompleted" INTEGER NOT NULL,
    "avgMeasureTime" DOUBLE PRECISION,
    "trainingComplianceRate" DOUBLE PRECISION,
    "expiredTrainingCount" INTEGER NOT NULL,
    "inspectionCount" INTEGER NOT NULL,
    "findingsAvgSeverity" DOUBLE PRECISION,
    "highRiskChemicalCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustrySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantIntelligenceScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "incidentScore" DOUBLE PRECISION NOT NULL,
    "trainingScore" DOUBLE PRECISION NOT NULL,
    "measureScore" DOUBLE PRECISION NOT NULL,
    "inspectionScore" DOUBLE PRECISION NOT NULL,
    "industryPercentile" INTEGER,
    "factors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantIntelligenceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendDataPoint" (
    "id" TEXT NOT NULL,
    "industry" TEXT,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "prevValue" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntelligenceApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceApiLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "params" JSONB,
    "responseMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntelligenceApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsHandbook" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HmsHandbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandbookVersion" (
    "id" TEXT NOT NULL,
    "handbookId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "HandbookVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "changeNote" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedNote" TEXT,
    "basedOnTemplateId" TEXT,
    "basedOnVersionId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandbookVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandbookSection" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "parentId" TEXT,
    "sectionKey" TEXT NOT NULL,
    "sectionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "legalRef" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "moduleLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandbookSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandbookTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandbookTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandbookBranding" (
    "id" TEXT NOT NULL,
    "handbookId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "headerText" TEXT,
    "footerText" TEXT,
    "primaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandbookBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandbookSignature" (
    "id" TEXT NOT NULL,
    "handbookId" TEXT NOT NULL,
    "versionId" TEXT,
    "userId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "HandbookSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternCache" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patternType" "PatternType" NOT NULL,
    "patternKey" TEXT NOT NULL,
    "matchCount" INTEGER NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "severity" INTEGER NOT NULL,
    "linkedIncidentIds" JSONB NOT NULL DEFAULT '[]',
    "linkedFindingIds" JSONB NOT NULL DEFAULT '[]',
    "linkedRuhIds" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatternCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementSuggestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patternCacheId" TEXT NOT NULL,
    "suggestionType" "SuggestionTarget" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "legalBasis" TEXT,
    "targetRoutineId" TEXT,
    "targetSectionKey" TEXT,
    "priority" INTEGER NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "implementedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprovementSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "description" TEXT NOT NULL,
    "legalReference" TEXT,
    "suggestionId" TEXT,
    "routineId" TEXT,
    "incidentIds" JSONB NOT NULL DEFAULT '[]',
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpDate" TIMESTAMP(3),
    "effectReviewed" BOOLEAN NOT NULL DEFAULT false,
    "effectNote" TEXT,

    CONSTRAINT "ImprovementLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantHmsScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "incidentScore" INTEGER NOT NULL,
    "routineScore" INTEGER NOT NULL,
    "inspectionScore" INTEGER NOT NULL,
    "trainingScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "measureScore" INTEGER NOT NULL,
    "handbookScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "trend" "ScoreTrend" NOT NULL,
    "scoreDate" TIMESTAMP(3) NOT NULL,
    "openIncidents" INTEGER NOT NULL,
    "overdueMeasures" INTEGER NOT NULL,
    "expiredTraining" INTEGER NOT NULL,
    "routinesNeedReview" INTEGER NOT NULL,
    "pendingSuggestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantHmsScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HmsKnowledgeEntry" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lawReference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "applicableAreas" JSONB NOT NULL DEFAULT '[]',
    "industry" JSONB NOT NULL DEFAULT '[]',
    "triggerPatterns" JSONB NOT NULL DEFAULT '[]',
    "lastVerified" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HmsKnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymizedTenantStats" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "incidentsTotal" INTEGER NOT NULL,
    "incidentsByType" JSONB NOT NULL,
    "incidentsBySeverity" JSONB NOT NULL,
    "avgClosureDays" DOUBLE PRECISION,
    "trir" DOUBLE PRECISION,
    "ltir" DOUBLE PRECISION,
    "risksTotal" INTEGER NOT NULL,
    "risksHighCount" INTEGER NOT NULL,
    "inspectionsTotal" INTEGER NOT NULL,
    "findingsTotal" INTEGER NOT NULL,
    "findingsClosed" INTEGER NOT NULL,
    "avgFindingSeverity" DOUBLE PRECISION,
    "trainingCompliance" DOUBLE PRECISION,
    "trainingsExpired" INTEGER NOT NULL,
    "measuresTotal" INTEGER NOT NULL,
    "measuresCompleted" INTEGER NOT NULL,
    "measuresOverdue" INTEGER NOT NULL,
    "avgMeasureDays" DOUBLE PRECISION,
    "chemicalsTotal" INTEGER NOT NULL,
    "chemicalsHighRisk" INTEGER NOT NULL,
    "hmsScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymizedTenantStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlogPostToBlogTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogPostToBlogTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isSuperAdmin_idx" ON "User"("isSuperAdmin");

-- CreateIndex
CREATE INDEX "User_isSupport_idx" ON "User"("isSupport");

-- CreateIndex
CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expires_idx" ON "PasswordResetToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_companyNumber_idx" ON "Tenant"("companyNumber");

-- CreateIndex
CREATE INDEX "Tenant_pricingTier_idx" ON "Tenant"("pricingTier");

-- CreateIndex
CREATE INDEX "Tenant_onboardingStatus_idx" ON "Tenant"("onboardingStatus");

-- CreateIndex
CREATE INDEX "Tenant_registrationType_idx" ON "Tenant"("registrationType");

-- CreateIndex
CREATE INDEX "TenantModule_tenantId_idx" ON "TenantModule"("tenantId");

-- CreateIndex
CREATE INDEX "TenantModule_status_idx" ON "TenantModule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModule_tenantId_moduleKey_key" ON "TenantModule"("tenantId", "moduleKey");

-- CreateIndex
CREATE INDEX "TenantSequence_tenantId_idx" ON "TenantSequence"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSequence_tenantId_sequenceType_year_key" ON "TenantSequence"("tenantId", "sequenceType", "year");

-- CreateIndex
CREATE INDEX "HmsAnnualPlanCompletion_tenantId_idx" ON "HmsAnnualPlanCompletion"("tenantId");

-- CreateIndex
CREATE INDEX "HmsAnnualPlanCompletion_tenantId_year_idx" ON "HmsAnnualPlanCompletion"("tenantId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "HmsAnnualPlanCompletion_tenantId_year_stepKey_key" ON "HmsAnnualPlanCompletion"("tenantId", "year", "stepKey");

-- CreateIndex
CREATE INDEX "TenantActivity_tenantId_createdAt_idx" ON "TenantActivity"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOffer_token_key" ON "TenantOffer"("token");

-- CreateIndex
CREATE INDEX "TenantOffer_tenantId_idx" ON "TenantOffer"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOffer_status_idx" ON "TenantOffer"("status");

-- CreateIndex
CREATE INDEX "TenantOffer_createdAt_idx" ON "TenantOffer"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_email_idx" ON "GeneratedDocument"("email");

-- CreateIndex
CREATE INDEX "GeneratedDocument_industry_idx" ON "GeneratedDocument"("industry");

-- CreateIndex
CREATE INDEX "GeneratedDocument_status_idx" ON "GeneratedDocument"("status");

-- CreateIndex
CREATE INDEX "GeneratedDocument_createdAt_idx" ON "GeneratedDocument"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_convertedToTrial_idx" ON "GeneratedDocument"("convertedToTrial");

-- CreateIndex
CREATE INDEX "GeneratedDocument_newsletterSubscribed_idx" ON "GeneratedDocument"("newsletterSubscribed");

-- CreateIndex
CREATE INDEX "GeneratedDocument_isFreeTrialPackage_idx" ON "GeneratedDocument"("isFreeTrialPackage");

-- CreateIndex
CREATE INDEX "GeneratedDocument_tenantId_idx" ON "GeneratedDocument"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_stripeInvoiceId_idx" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "InvoiceExport_createdAt_idx" ON "InvoiceExport"("createdAt");

-- CreateIndex
CREATE INDEX "InvoiceExport_exportedById_idx" ON "InvoiceExport"("exportedById");

-- CreateIndex
CREATE INDEX "UserTenant_userId_idx" ON "UserTenant"("userId");

-- CreateIndex
CREATE INDEX "UserTenant_tenantId_idx" ON "UserTenant"("tenantId");

-- CreateIndex
CREATE INDEX "UserTenant_managerId_idx" ON "UserTenant"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTenant_userId_tenantId_key" ON "UserTenant"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_nextReviewDate_idx" ON "Document"("nextReviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "Document_tenantId_slug_key" ON "Document"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "DocumentVersion_tenantId_idx" ON "DocumentVersion"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVersion_version_idx" ON "DocumentVersion"("version");

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_idx" ON "DocumentTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_isGlobal_idx" ON "DocumentTemplate"("isGlobal");

-- CreateIndex
CREATE INDEX "DocumentSignature_tenantId_idx" ON "DocumentSignature"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentId_idx" ON "DocumentSignature"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_documentId_signedById_role_key" ON "DocumentSignature"("documentId", "signedById", "role");

-- CreateIndex
CREATE INDEX "OrgChartNode_tenantId_idx" ON "OrgChartNode"("tenantId");

-- CreateIndex
CREATE INDEX "OrgChartNode_parentId_idx" ON "OrgChartNode"("parentId");

-- CreateIndex
CREATE INDEX "ElectroComplianceDeclaration_tenantId_idx" ON "ElectroComplianceDeclaration"("tenantId");

-- CreateIndex
CREATE INDEX "ElectroComplianceDeclaration_tenantId_createdAt_idx" ON "ElectroComplianceDeclaration"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ElectroInstruction_tenantId_idx" ON "ElectroInstruction"("tenantId");

-- CreateIndex
CREATE INDEX "ElectroInstruction_tenantId_sortOrder_idx" ON "ElectroInstruction"("tenantId", "sortOrder");

-- CreateIndex
CREATE INDEX "LegalReference_sortOrder_idx" ON "LegalReference"("sortOrder");

-- CreateIndex
CREATE INDEX "RiskAssessment_tenantId_idx" ON "RiskAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "RiskAssessment_projectId_idx" ON "RiskAssessment"("projectId");

-- CreateIndex
CREATE INDEX "RiskAssessment_assessmentYear_idx" ON "RiskAssessment"("assessmentYear");

-- CreateIndex
CREATE INDEX "RiskAssessment_approvedById_idx" ON "RiskAssessment"("approvedById");

-- CreateIndex
CREATE INDEX "RiskAssessment_reviewedById_idx" ON "RiskAssessment"("reviewedById");

-- CreateIndex
CREATE INDEX "Risk_tenantId_idx" ON "Risk"("tenantId");

-- CreateIndex
CREATE INDEX "Risk_riskAssessmentId_idx" ON "Risk"("riskAssessmentId");

-- CreateIndex
CREATE INDEX "Risk_status_idx" ON "Risk"("status");

-- CreateIndex
CREATE INDEX "Risk_score_idx" ON "Risk"("score");

-- CreateIndex
CREATE INDEX "Risk_category_idx" ON "Risk"("category");

-- CreateIndex
CREATE INDEX "Risk_nextReviewDate_idx" ON "Risk"("nextReviewDate");

-- CreateIndex
CREATE INDEX "Risk_kpiId_idx" ON "Risk"("kpiId");

-- CreateIndex
CREATE INDEX "Risk_inspectionTemplateId_idx" ON "Risk"("inspectionTemplateId");

-- CreateIndex
CREATE INDEX "RiskDocumentLink_tenantId_idx" ON "RiskDocumentLink"("tenantId");

-- CreateIndex
CREATE INDEX "RiskDocumentLink_documentId_idx" ON "RiskDocumentLink"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskDocumentLink_riskId_documentId_key" ON "RiskDocumentLink"("riskId", "documentId");

-- CreateIndex
CREATE INDEX "RiskAuditLink_tenantId_idx" ON "RiskAuditLink"("tenantId");

-- CreateIndex
CREATE INDEX "RiskAuditLink_auditId_idx" ON "RiskAuditLink"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAuditLink_riskId_auditId_key" ON "RiskAuditLink"("riskId", "auditId");

-- CreateIndex
CREATE INDEX "RiskControl_tenantId_idx" ON "RiskControl"("tenantId");

-- CreateIndex
CREATE INDEX "RiskControl_riskId_idx" ON "RiskControl"("riskId");

-- CreateIndex
CREATE INDEX "RiskControl_ownerId_idx" ON "RiskControl"("ownerId");

-- CreateIndex
CREATE INDEX "RiskControl_controlType_idx" ON "RiskControl"("controlType");

-- CreateIndex
CREATE INDEX "RiskControl_status_idx" ON "RiskControl"("status");

-- CreateIndex
CREATE INDEX "RiskChemicalLink_tenantId_idx" ON "RiskChemicalLink"("tenantId");

-- CreateIndex
CREATE INDEX "RiskChemicalLink_chemicalId_idx" ON "RiskChemicalLink"("chemicalId");

-- CreateIndex
CREATE INDEX "RiskChemicalLink_exposure_idx" ON "RiskChemicalLink"("exposure");

-- CreateIndex
CREATE UNIQUE INDEX "RiskChemicalLink_riskId_chemicalId_key" ON "RiskChemicalLink"("riskId", "chemicalId");

-- CreateIndex
CREATE INDEX "RiskTrainingRequirement_tenantId_idx" ON "RiskTrainingRequirement"("tenantId");

-- CreateIndex
CREATE INDEX "RiskTrainingRequirement_courseKey_idx" ON "RiskTrainingRequirement"("courseKey");

-- CreateIndex
CREATE UNIQUE INDEX "RiskTrainingRequirement_riskId_courseKey_key" ON "RiskTrainingRequirement"("riskId", "courseKey");

-- CreateIndex
CREATE INDEX "SecurityAsset_tenantId_idx" ON "SecurityAsset"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityAsset_ownerId_idx" ON "SecurityAsset"("ownerId");

-- CreateIndex
CREATE INDEX "SecurityControl_tenantId_idx" ON "SecurityControl"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityControl_ownerId_idx" ON "SecurityControl"("ownerId");

-- CreateIndex
CREATE INDEX "SecurityControl_linkedAssetId_idx" ON "SecurityControl"("linkedAssetId");

-- CreateIndex
CREATE INDEX "SecurityControl_linkedRiskId_idx" ON "SecurityControl"("linkedRiskId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityControl_tenantId_code_key" ON "SecurityControl"("tenantId", "code");

-- CreateIndex
CREATE INDEX "SecurityControlDocument_documentId_idx" ON "SecurityControlDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityControlDocument_controlId_documentId_key" ON "SecurityControlDocument"("controlId", "documentId");

-- CreateIndex
CREATE INDEX "SecurityEvidence_controlId_idx" ON "SecurityEvidence"("controlId");

-- CreateIndex
CREATE INDEX "SecurityEvidence_collectedById_idx" ON "SecurityEvidence"("collectedById");

-- CreateIndex
CREATE INDEX "AccessReview_tenantId_idx" ON "AccessReview"("tenantId");

-- CreateIndex
CREATE INDEX "AccessReview_ownerId_idx" ON "AccessReview"("ownerId");

-- CreateIndex
CREATE INDEX "AccessReviewEntry_tenantId_idx" ON "AccessReviewEntry"("tenantId");

-- CreateIndex
CREATE INDEX "AccessReviewEntry_reviewId_idx" ON "AccessReviewEntry"("reviewId");

-- CreateIndex
CREATE INDEX "AccessReviewEntry_decidedById_idx" ON "AccessReviewEntry"("decidedById");

-- CreateIndex
CREATE INDEX "CustomerFeedback_tenantId_idx" ON "CustomerFeedback"("tenantId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_recordedAt_idx" ON "CustomerFeedback"("recordedAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_followUpStatus_idx" ON "CustomerFeedback"("followUpStatus");

-- CreateIndex
CREATE INDEX "CustomerFeedback_followUpOwnerId_idx" ON "CustomerFeedback"("followUpOwnerId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_linkedGoalId_idx" ON "CustomerFeedback"("linkedGoalId");

-- CreateIndex
CREATE INDEX "Measure_tenantId_idx" ON "Measure"("tenantId");

-- CreateIndex
CREATE INDEX "Measure_status_idx" ON "Measure"("status");

-- CreateIndex
CREATE INDEX "Measure_dueAt_idx" ON "Measure"("dueAt");

-- CreateIndex
CREATE INDEX "Measure_riskId_idx" ON "Measure"("riskId");

-- CreateIndex
CREATE INDEX "Measure_incidentId_idx" ON "Measure"("incidentId");

-- CreateIndex
CREATE INDEX "Measure_auditId_idx" ON "Measure"("auditId");

-- CreateIndex
CREATE INDEX "Measure_goalId_idx" ON "Measure"("goalId");

-- CreateIndex
CREATE INDEX "Measure_environmentalAspectId_idx" ON "Measure"("environmentalAspectId");

-- CreateIndex
CREATE INDEX "Measure_projectId_idx" ON "Measure"("projectId");

-- CreateIndex
CREATE INDEX "Measure_fireDrillId_idx" ON "Measure"("fireDrillId");

-- CreateIndex
CREATE INDEX "EnvironmentalAspect_tenantId_idx" ON "EnvironmentalAspect"("tenantId");

-- CreateIndex
CREATE INDEX "EnvironmentalAspect_category_idx" ON "EnvironmentalAspect"("category");

-- CreateIndex
CREATE INDEX "EnvironmentalAspect_status_idx" ON "EnvironmentalAspect"("status");

-- CreateIndex
CREATE INDEX "EnvironmentalAspect_significanceScore_idx" ON "EnvironmentalAspect"("significanceScore");

-- CreateIndex
CREATE INDEX "EnvironmentalAspect_ownerId_idx" ON "EnvironmentalAspect"("ownerId");

-- CreateIndex
CREATE INDEX "EnvironmentalAspect_goalId_idx" ON "EnvironmentalAspect"("goalId");

-- CreateIndex
CREATE INDEX "EnvironmentalMeasurement_aspectId_idx" ON "EnvironmentalMeasurement"("aspectId");

-- CreateIndex
CREATE INDEX "EnvironmentalMeasurement_measurementDate_idx" ON "EnvironmentalMeasurement"("measurementDate");

-- CreateIndex
CREATE INDEX "EnvironmentalMeasurement_status_idx" ON "EnvironmentalMeasurement"("status");

-- CreateIndex
CREATE INDEX "EnvironmentalMeasurement_responsibleId_idx" ON "EnvironmentalMeasurement"("responsibleId");

-- CreateIndex
CREATE INDEX "Incident_tenantId_idx" ON "Incident"("tenantId");

-- CreateIndex
CREATE INDEX "Incident_avviksnummer_idx" ON "Incident"("avviksnummer");

-- CreateIndex
CREATE INDEX "Incident_type_idx" ON "Incident"("type");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_occurredAt_idx" ON "Incident"("occurredAt");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_responsibleId_idx" ON "Incident"("responsibleId");

-- CreateIndex
CREATE INDEX "Incident_reportedForUserId_idx" ON "Incident"("reportedForUserId");

-- CreateIndex
CREATE INDEX "Incident_riskReferenceId_idx" ON "Incident"("riskReferenceId");

-- CreateIndex
CREATE INDEX "Incident_projectId_idx" ON "Incident"("projectId");

-- CreateIndex
CREATE INDEX "Incident_relatedRoutineId_idx" ON "Incident"("relatedRoutineId");

-- CreateIndex
CREATE INDEX "Incident_areaTag_idx" ON "Incident"("areaTag");

-- CreateIndex
CREATE INDEX "RuhReport_tenantId_idx" ON "RuhReport"("tenantId");

-- CreateIndex
CREATE INDEX "RuhReport_ruhNummer_idx" ON "RuhReport"("ruhNummer");

-- CreateIndex
CREATE INDEX "RuhReport_status_idx" ON "RuhReport"("status");

-- CreateIndex
CREATE INDEX "RuhReport_occurredAt_idx" ON "RuhReport"("occurredAt");

-- CreateIndex
CREATE INDEX "RuhReport_reportedById_idx" ON "RuhReport"("reportedById");

-- CreateIndex
CREATE INDEX "IncidentSubcategoryOption_incidentType_idx" ON "IncidentSubcategoryOption"("incidentType");

-- CreateIndex
CREATE INDEX "IncidentSubcategoryOption_tenantId_idx" ON "IncidentSubcategoryOption"("tenantId");

-- CreateIndex
CREATE INDEX "IncidentSubcategoryOption_industry_idx" ON "IncidentSubcategoryOption"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentSubcategoryOption_tenantId_incidentType_key_key" ON "IncidentSubcategoryOption"("tenantId", "incidentType", "key");

-- CreateIndex
CREATE INDEX "SjaAnalysis_tenantId_idx" ON "SjaAnalysis"("tenantId");

-- CreateIndex
CREATE INDEX "SjaAnalysis_sjaNummer_idx" ON "SjaAnalysis"("sjaNummer");

-- CreateIndex
CREATE INDEX "SjaAnalysis_status_idx" ON "SjaAnalysis"("status");

-- CreateIndex
CREATE INDEX "SjaAnalysis_plannedDate_idx" ON "SjaAnalysis"("plannedDate");

-- CreateIndex
CREATE INDEX "SjaAnalysis_createdById_idx" ON "SjaAnalysis"("createdById");

-- CreateIndex
CREATE INDEX "SjaAnalysis_projectId_idx" ON "SjaAnalysis"("projectId");

-- CreateIndex
CREATE INDEX "SjaHazard_sjaAnalysisId_idx" ON "SjaHazard"("sjaAnalysisId");

-- CreateIndex
CREATE INDEX "SjaTemplate_tenantId_idx" ON "SjaTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "SjaTemplate_tenantId_isActive_idx" ON "SjaTemplate"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "SjaTemplateHazard_templateId_idx" ON "SjaTemplateHazard"("templateId");

-- CreateIndex
CREATE INDEX "Training_tenantId_idx" ON "Training"("tenantId");

-- CreateIndex
CREATE INDEX "Training_userId_idx" ON "Training"("userId");

-- CreateIndex
CREATE INDEX "Training_courseKey_idx" ON "Training"("courseKey");

-- CreateIndex
CREATE INDEX "Training_validUntil_idx" ON "Training"("validUntil");

-- CreateIndex
CREATE INDEX "Training_completedAt_idx" ON "Training"("completedAt");

-- CreateIndex
CREATE INDEX "CourseTemplate_tenantId_idx" ON "CourseTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "CourseTemplate_isGlobal_idx" ON "CourseTemplate"("isGlobal");

-- CreateIndex
CREATE INDEX "CourseTemplate_isActive_idx" ON "CourseTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTemplate_tenantId_courseKey_key" ON "CourseTemplate"("tenantId", "courseKey");

-- CreateIndex
CREATE INDEX "Audit_tenantId_idx" ON "Audit"("tenantId");

-- CreateIndex
CREATE INDEX "Audit_scheduledDate_idx" ON "Audit"("scheduledDate");

-- CreateIndex
CREATE INDEX "Audit_status_idx" ON "Audit"("status");

-- CreateIndex
CREATE INDEX "Audit_auditType_idx" ON "Audit"("auditType");

-- CreateIndex
CREATE INDEX "Audit_leadAuditorId_idx" ON "Audit"("leadAuditorId");

-- CreateIndex
CREATE INDEX "AuditFinding_auditId_idx" ON "AuditFinding"("auditId");

-- CreateIndex
CREATE INDEX "AuditFinding_status_idx" ON "AuditFinding"("status");

-- CreateIndex
CREATE INDEX "AuditFinding_findingType_idx" ON "AuditFinding"("findingType");

-- CreateIndex
CREATE INDEX "AuditFinding_responsibleId_idx" ON "AuditFinding"("responsibleId");

-- CreateIndex
CREATE INDEX "AuditFinding_dueDate_idx" ON "AuditFinding"("dueDate");

-- CreateIndex
CREATE INDEX "Goal_tenantId_idx" ON "Goal"("tenantId");

-- CreateIndex
CREATE INDEX "Goal_year_idx" ON "Goal"("year");

-- CreateIndex
CREATE INDEX "Goal_quarter_idx" ON "Goal"("quarter");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "Goal_category_idx" ON "Goal"("category");

-- CreateIndex
CREATE INDEX "Goal_ownerId_idx" ON "Goal"("ownerId");

-- CreateIndex
CREATE INDEX "KpiMeasurement_goalId_idx" ON "KpiMeasurement"("goalId");

-- CreateIndex
CREATE INDEX "KpiMeasurement_tenantId_idx" ON "KpiMeasurement"("tenantId");

-- CreateIndex
CREATE INDEX "KpiMeasurement_measurementDate_idx" ON "KpiMeasurement"("measurementDate");

-- CreateIndex
CREATE INDEX "Chemical_tenantId_idx" ON "Chemical"("tenantId");

-- CreateIndex
CREATE INDEX "Chemical_status_idx" ON "Chemical"("status");

-- CreateIndex
CREATE INDEX "Chemical_nextReviewDate_idx" ON "Chemical"("nextReviewDate");

-- CreateIndex
CREATE INDEX "Chemical_casNumber_idx" ON "Chemical"("casNumber");

-- CreateIndex
CREATE INDEX "Chemical_isCMR_idx" ON "Chemical"("isCMR");

-- CreateIndex
CREATE INDEX "Chemical_isSVHC_idx" ON "Chemical"("isSVHC");

-- CreateIndex
CREATE INDEX "Chemical_containsIsocyanates_idx" ON "Chemical"("containsIsocyanates");

-- CreateIndex
CREATE INDEX "Chemical_hazardLevel_idx" ON "Chemical"("hazardLevel");

-- CreateIndex
CREATE INDEX "ExposureRegister_tenantId_idx" ON "ExposureRegister"("tenantId");

-- CreateIndex
CREATE INDEX "ExposureRegister_employeeId_idx" ON "ExposureRegister"("employeeId");

-- CreateIndex
CREATE INDEX "ExposureRegister_chemicalId_idx" ON "ExposureRegister"("chemicalId");

-- CreateIndex
CREATE INDEX "ExposureRegister_ruhReportId_idx" ON "ExposureRegister"("ruhReportId");

-- CreateIndex
CREATE INDEX "ExposureRegister_riskId_idx" ON "ExposureRegister"("riskId");

-- CreateIndex
CREATE INDEX "ExposureRegister_status_idx" ON "ExposureRegister"("status");

-- CreateIndex
CREATE INDEX "ExposureRegister_exposureStartDate_idx" ON "ExposureRegister"("exposureStartDate");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_idx" ON "Attachment"("tenantId");

-- CreateIndex
CREATE INDEX "Attachment_objectType_objectId_idx" ON "Attachment"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "Attachment_incidentId_idx" ON "Attachment"("incidentId");

-- CreateIndex
CREATE INDEX "Attachment_ruhReportId_idx" ON "Attachment"("ruhReportId");

-- CreateIndex
CREATE INDEX "Attachment_sjaAnalysisId_idx" ON "Attachment"("sjaAnalysisId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_ipAddress_idx" ON "AuditLog"("ipAddress");

-- CreateIndex
CREATE INDEX "Inspection_tenantId_idx" ON "Inspection"("tenantId");

-- CreateIndex
CREATE INDEX "Inspection_scheduledDate_idx" ON "Inspection"("scheduledDate");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE INDEX "Inspection_type_idx" ON "Inspection"("type");

-- CreateIndex
CREATE INDEX "Inspection_templateId_idx" ON "Inspection"("templateId");

-- CreateIndex
CREATE INDEX "Inspection_formTemplateId_idx" ON "Inspection"("formTemplateId");

-- CreateIndex
CREATE INDEX "Inspection_formSubmissionId_idx" ON "Inspection"("formSubmissionId");

-- CreateIndex
CREATE INDEX "Inspection_riskCategory_idx" ON "Inspection"("riskCategory");

-- CreateIndex
CREATE INDEX "Inspection_nextInspection_idx" ON "Inspection"("nextInspection");

-- CreateIndex
CREATE INDEX "Inspection_projectId_idx" ON "Inspection"("projectId");

-- CreateIndex
CREATE INDEX "InspectionTemplate_tenantId_idx" ON "InspectionTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "InspectionTemplate_category_idx" ON "InspectionTemplate"("category");

-- CreateIndex
CREATE INDEX "InspectionTemplate_riskCategory_idx" ON "InspectionTemplate"("riskCategory");

-- CreateIndex
CREATE INDEX "InspectionTemplate_isGlobal_idx" ON "InspectionTemplate"("isGlobal");

-- CreateIndex
CREATE INDEX "InspectionFinding_inspectionId_idx" ON "InspectionFinding"("inspectionId");

-- CreateIndex
CREATE INDEX "InspectionFinding_status_idx" ON "InspectionFinding"("status");

-- CreateIndex
CREATE INDEX "InspectionFinding_responsibleId_idx" ON "InspectionFinding"("responsibleId");

-- CreateIndex
CREATE INDEX "InspectionFinding_linkedRiskId_idx" ON "InspectionFinding"("linkedRiskId");

-- CreateIndex
CREATE INDEX "InspectionFinding_linkedMeasureId_idx" ON "InspectionFinding"("linkedMeasureId");

-- CreateIndex
CREATE INDEX "FormTemplate_tenantId_idx" ON "FormTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "FormTemplate_createdBy_idx" ON "FormTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "FormTemplate_category_idx" ON "FormTemplate"("category");

-- CreateIndex
CREATE INDEX "FormTemplate_isActive_idx" ON "FormTemplate"("isActive");

-- CreateIndex
CREATE INDEX "FormTemplate_accessType_idx" ON "FormTemplate"("accessType");

-- CreateIndex
CREATE INDEX "FormField_formTemplateId_idx" ON "FormField"("formTemplateId");

-- CreateIndex
CREATE INDEX "FormField_order_idx" ON "FormField"("order");

-- CreateIndex
CREATE INDEX "FormSubmission_tenantId_idx" ON "FormSubmission"("tenantId");

-- CreateIndex
CREATE INDEX "FormSubmission_projectId_idx" ON "FormSubmission"("projectId");

-- CreateIndex
CREATE INDEX "FormSubmission_submissionNumber_idx" ON "FormSubmission"("submissionNumber");

-- CreateIndex
CREATE INDEX "FormSubmission_submittedById_idx" ON "FormSubmission"("submittedById");

-- CreateIndex
CREATE INDEX "FormSubmission_formTemplateId_idx" ON "FormSubmission"("formTemplateId");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_createdAt_idx" ON "FormSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "RoutineTemplate_tenantId_idx" ON "RoutineTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "RoutineTemplate_isGlobal_idx" ON "RoutineTemplate"("isGlobal");

-- CreateIndex
CREATE INDEX "RoutineTemplate_isActive_idx" ON "RoutineTemplate"("isActive");

-- CreateIndex
CREATE INDEX "Routine_tenantId_idx" ON "Routine"("tenantId");

-- CreateIndex
CREATE INDEX "Routine_templateId_idx" ON "Routine"("templateId");

-- CreateIndex
CREATE INDEX "Routine_status_idx" ON "Routine"("status");

-- CreateIndex
CREATE INDEX "Routine_responsibleId_idx" ON "Routine"("responsibleId");

-- CreateIndex
CREATE INDEX "Routine_nextReviewAt_idx" ON "Routine"("nextReviewAt");

-- CreateIndex
CREATE INDEX "FormFieldValue_submissionId_idx" ON "FormFieldValue"("submissionId");

-- CreateIndex
CREATE INDEX "FormFieldValue_fieldId_idx" ON "FormFieldValue"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "BlogCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_name_key" ON "BlogTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");

-- CreateIndex
CREATE INDEX "BlogTag_slug_idx" ON "BlogTag"("slug");

-- CreateIndex
CREATE INDEX "ManagementReview_tenantId_idx" ON "ManagementReview"("tenantId");

-- CreateIndex
CREATE INDEX "ManagementReview_reviewDate_idx" ON "ManagementReview"("reviewDate");

-- CreateIndex
CREATE INDEX "ManagementReview_status_idx" ON "ManagementReview"("status");

-- CreateIndex
CREATE INDEX "Meeting_tenantId_idx" ON "Meeting"("tenantId");

-- CreateIndex
CREATE INDEX "Meeting_scheduledDate_idx" ON "Meeting"("scheduledDate");

-- CreateIndex
CREATE INDEX "Meeting_type_idx" ON "Meeting"("type");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetingId_idx" ON "MeetingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "MeetingParticipant"("userId");

-- CreateIndex
CREATE INDEX "MeetingDecision_meetingId_idx" ON "MeetingDecision"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingDecision_responsibleId_idx" ON "MeetingDecision"("responsibleId");

-- CreateIndex
CREATE INDEX "MeetingDecision_status_idx" ON "MeetingDecision"("status");

-- CreateIndex
CREATE INDEX "MeetingDecision_dueDate_idx" ON "MeetingDecision"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Whistleblowing_caseNumber_key" ON "Whistleblowing"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Whistleblowing_accessCode_key" ON "Whistleblowing"("accessCode");

-- CreateIndex
CREATE INDEX "Whistleblowing_tenantId_idx" ON "Whistleblowing"("tenantId");

-- CreateIndex
CREATE INDEX "Whistleblowing_caseNumber_idx" ON "Whistleblowing"("caseNumber");

-- CreateIndex
CREATE INDEX "Whistleblowing_accessCode_idx" ON "Whistleblowing"("accessCode");

-- CreateIndex
CREATE INDEX "Whistleblowing_status_idx" ON "Whistleblowing"("status");

-- CreateIndex
CREATE INDEX "Whistleblowing_category_idx" ON "Whistleblowing"("category");

-- CreateIndex
CREATE INDEX "Whistleblowing_handledBy_idx" ON "Whistleblowing"("handledBy");

-- CreateIndex
CREATE INDEX "WhistleblowMessage_whistleblowingId_idx" ON "WhistleblowMessage"("whistleblowingId");

-- CreateIndex
CREATE INDEX "WhistleblowMessage_createdAt_idx" ON "WhistleblowMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationPushToken_tenantId_idx" ON "NotificationPushToken"("tenantId");

-- CreateIndex
CREATE INDEX "NotificationPushToken_userId_idx" ON "NotificationPushToken"("userId");

-- CreateIndex
CREATE INDEX "NotificationPushToken_expoPushToken_idx" ON "NotificationPushToken"("expoPushToken");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPushToken_tenantId_userId_expoPushToken_key" ON "NotificationPushToken"("tenantId", "userId", "expoPushToken");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicket_lastMessageAt_idx" ON "SupportTicket"("lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportTicket_createdById_idx" ON "SupportTicket"("createdById");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_idx" ON "SupportMessage"("ticketId");

-- CreateIndex
CREATE INDEX "SupportMessage_createdAt_idx" ON "SupportMessage"("createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_senderUserId_idx" ON "SupportMessage"("senderUserId");

-- CreateIndex
CREATE INDEX "ScheduledReminder_tenantId_idx" ON "ScheduledReminder"("tenantId");

-- CreateIndex
CREATE INDEX "ScheduledReminder_userId_idx" ON "ScheduledReminder"("userId");

-- CreateIndex
CREATE INDEX "ScheduledReminder_scheduledFor_idx" ON "ScheduledReminder"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledReminder_status_idx" ON "ScheduledReminder"("status");

-- CreateIndex
CREATE INDEX "ScheduledReminder_entityType_entityId_idx" ON "ScheduledReminder"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "BhtClient_status_idx" ON "BhtClient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BhtClient_tenantId_key" ON "BhtClient"("tenantId");

-- CreateIndex
CREATE INDEX "BhtAssessment_status_idx" ON "BhtAssessment"("status");

-- CreateIndex
CREATE INDEX "BhtAssessment_year_idx" ON "BhtAssessment"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BhtAssessment_bhtClientId_year_key" ON "BhtAssessment"("bhtClientId", "year");

-- CreateIndex
CREATE INDEX "BhtConsultation_bhtClientId_idx" ON "BhtConsultation"("bhtClientId");

-- CreateIndex
CREATE INDEX "BhtConsultation_conductedAt_idx" ON "BhtConsultation"("conductedAt");

-- CreateIndex
CREATE INDEX "BhtAmoMeeting_status_idx" ON "BhtAmoMeeting"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BhtAmoMeeting_bhtClientId_year_key" ON "BhtAmoMeeting"("bhtClientId", "year");

-- CreateIndex
CREATE INDEX "BhtInspection_status_idx" ON "BhtInspection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BhtInspection_bhtClientId_year_key" ON "BhtInspection"("bhtClientId", "year");

-- CreateIndex
CREATE INDEX "BhtExposureAssessment_status_idx" ON "BhtExposureAssessment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BhtExposureAssessment_bhtClientId_year_key" ON "BhtExposureAssessment"("bhtClientId", "year");

-- CreateIndex
CREATE INDEX "BhtAnnualReport_status_idx" ON "BhtAnnualReport"("status");

-- CreateIndex
CREATE INDEX "BhtAnnualReport_year_idx" ON "BhtAnnualReport"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BhtAnnualReport_bhtClientId_year_key" ON "BhtAnnualReport"("bhtClientId", "year");

-- CreateIndex
CREATE INDEX "PackageLead_email_idx" ON "PackageLead"("email");

-- CreateIndex
CREATE INDEX "PackageLead_type_idx" ON "PackageLead"("type");

-- CreateIndex
CREATE INDEX "PackageLead_createdAt_idx" ON "PackageLead"("createdAt");

-- CreateIndex
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "Project_projectManagerId_idx" ON "Project"("projectManagerId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionShaPlan_projectId_key" ON "ConstructionShaPlan"("projectId");

-- CreateIndex
CREATE INDEX "ConstructionShaPlan_tenantId_idx" ON "ConstructionShaPlan"("tenantId");

-- CreateIndex
CREATE INDEX "ConstructionShaPlan_status_idx" ON "ConstructionShaPlan"("status");

-- CreateIndex
CREATE INDEX "CdmDutyHolder_tenantId_idx" ON "CdmDutyHolder"("tenantId");

-- CreateIndex
CREATE INDEX "CdmDutyHolder_projectId_idx" ON "CdmDutyHolder"("projectId");

-- CreateIndex
CREATE INDEX "CoshhAssessment_tenantId_idx" ON "CoshhAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "CoshhAssessment_chemicalId_idx" ON "CoshhAssessment"("chemicalId");

-- CreateIndex
CREATE INDEX "PermitToWork_tenantId_idx" ON "PermitToWork"("tenantId");

-- CreateIndex
CREATE INDEX "PermitToWork_projectId_idx" ON "PermitToWork"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionPreNotification_projectId_key" ON "ConstructionPreNotification"("projectId");

-- CreateIndex
CREATE INDEX "ConstructionPreNotification_tenantId_idx" ON "ConstructionPreNotification"("tenantId");

-- CreateIndex
CREATE INDEX "ConstructionPreNotification_status_idx" ON "ConstructionPreNotification"("status");

-- CreateIndex
CREATE INDEX "ConstructionPreNotification_expectedStartDate_idx" ON "ConstructionPreNotification"("expectedStartDate");

-- CreateIndex
CREATE INDEX "ConstructionRosterEntry_tenantId_idx" ON "ConstructionRosterEntry"("tenantId");

-- CreateIndex
CREATE INDEX "ConstructionRosterEntry_projectId_idx" ON "ConstructionRosterEntry"("projectId");

-- CreateIndex
CREATE INDEX "ConstructionRosterEntry_isActive_idx" ON "ConstructionRosterEntry"("isActive");

-- CreateIndex
CREATE INDEX "ConstructionRosterDailyCheck_tenantId_idx" ON "ConstructionRosterDailyCheck"("tenantId");

-- CreateIndex
CREATE INDEX "ConstructionRosterDailyCheck_checkedDate_idx" ON "ConstructionRosterDailyCheck"("checkedDate");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionRosterDailyCheck_projectId_checkedDate_key" ON "ConstructionRosterDailyCheck"("projectId", "checkedDate");

-- CreateIndex
CREATE INDEX "TimeEntry_tenantId_idx" ON "TimeEntry"("tenantId");

-- CreateIndex
CREATE INDEX "TimeEntry_projectId_idx" ON "TimeEntry"("projectId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_date_idx" ON "TimeEntry"("date");

-- CreateIndex
CREATE INDEX "MileageEntry_tenantId_idx" ON "MileageEntry"("tenantId");

-- CreateIndex
CREATE INDEX "MileageEntry_projectId_idx" ON "MileageEntry"("projectId");

-- CreateIndex
CREATE INDEX "MileageEntry_userId_idx" ON "MileageEntry"("userId");

-- CreateIndex
CREATE INDEX "MileageEntry_date_idx" ON "MileageEntry"("date");

-- CreateIndex
CREATE INDEX "NavigationItem_tenantId_idx" ON "NavigationItem"("tenantId");

-- CreateIndex
CREATE INDEX "NavigationItem_isActive_idx" ON "NavigationItem"("isActive");

-- CreateIndex
CREATE INDEX "NavigationItem_order_idx" ON "NavigationItem"("order");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationItem_tenantId_key_key" ON "NavigationItem"("tenantId", "key");

-- CreateIndex
CREATE INDEX "DashboardConfig_userId_idx" ON "DashboardConfig"("userId");

-- CreateIndex
CREATE INDEX "DashboardConfig_tenantId_idx" ON "DashboardConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardConfig_userId_tenantId_key" ON "DashboardConfig"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "FireDrill_tenantId_idx" ON "FireDrill"("tenantId");

-- CreateIndex
CREATE INDEX "FireDrill_status_idx" ON "FireDrill"("status");

-- CreateIndex
CREATE INDEX "FireDrill_plannedDate_idx" ON "FireDrill"("plannedDate");

-- CreateIndex
CREATE INDEX "FireDrill_drillType_idx" ON "FireDrill"("drillType");

-- CreateIndex
CREATE INDEX "FireDrill_responsibleId_idx" ON "FireDrill"("responsibleId");

-- CreateIndex
CREATE UNIQUE INDEX "HmsTavleSubscription_tenantId_key" ON "HmsTavleSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "HmsTavleSubscription_tenantId_idx" ON "HmsTavleSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "HmsTavleSubscription_status_idx" ON "HmsTavleSubscription"("status");

-- CreateIndex
CREATE INDEX "HmsTavleSubscription_endsAt_idx" ON "HmsTavleSubscription"("endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "HmsTavle_projectId_key" ON "HmsTavle"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "HmsTavle_publicToken_key" ON "HmsTavle"("publicToken");

-- CreateIndex
CREATE INDEX "HmsTavle_tenantId_idx" ON "HmsTavle"("tenantId");

-- CreateIndex
CREATE INDEX "HmsTavle_publicToken_idx" ON "HmsTavle"("publicToken");

-- CreateIndex
CREATE INDEX "HmsTavleSection_tavleId_idx" ON "HmsTavleSection"("tavleId");

-- CreateIndex
CREATE INDEX "HmsTavleExternalLink_tavleId_idx" ON "HmsTavleExternalLink"("tavleId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcontractorPortal_tavleId_key" ON "SubcontractorPortal"("tavleId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcontractorPortal_portalToken_key" ON "SubcontractorPortal"("portalToken");

-- CreateIndex
CREATE INDEX "SubcontractorPortal_portalToken_idx" ON "SubcontractorPortal"("portalToken");

-- CreateIndex
CREATE INDEX "SubcontractorSubmission_portalId_idx" ON "SubcontractorSubmission"("portalId");

-- CreateIndex
CREATE INDEX "SubcontractorSubmission_tenantId_idx" ON "SubcontractorSubmission"("tenantId");

-- CreateIndex
CREATE INDEX "SubcontractorSubmission_status_idx" ON "SubcontractorSubmission"("status");

-- CreateIndex
CREATE INDEX "SubcontractorSubmission_createdAt_idx" ON "SubcontractorSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "EmployeeReview_tenantId_idx" ON "EmployeeReview"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeReview_employeeId_idx" ON "EmployeeReview"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeReview_reviewerId_idx" ON "EmployeeReview"("reviewerId");

-- CreateIndex
CREATE INDEX "EmployeeReview_status_idx" ON "EmployeeReview"("status");

-- CreateIndex
CREATE INDEX "EmployeeReview_scheduledDate_idx" ON "EmployeeReview"("scheduledDate");

-- CreateIndex
CREATE INDEX "EmployeeReviewGoal_reviewId_idx" ON "EmployeeReviewGoal"("reviewId");

-- CreateIndex
CREATE INDEX "EmployeeReviewGoal_tenantId_idx" ON "EmployeeReviewGoal"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeReviewAction_reviewId_idx" ON "EmployeeReviewAction"("reviewId");

-- CreateIndex
CREATE INDEX "EmployeeReviewAction_tenantId_idx" ON "EmployeeReviewAction"("tenantId");

-- CreateIndex
CREATE INDEX "TavleCheckin_tavleId_idx" ON "TavleCheckin"("tavleId");

-- CreateIndex
CREATE INDEX "TavleCheckin_date_idx" ON "TavleCheckin"("date");

-- CreateIndex
CREATE INDEX "TavleCheckin_tavleId_checkedInAt_idx" ON "TavleCheckin"("tavleId", "checkedInAt");

-- CreateIndex
CREATE UNIQUE INDEX "TavleGuestSubmission_trackingToken_key" ON "TavleGuestSubmission"("trackingToken");

-- CreateIndex
CREATE INDEX "TavleGuestSubmission_tavleId_idx" ON "TavleGuestSubmission"("tavleId");

-- CreateIndex
CREATE INDEX "TavleGuestSubmission_status_idx" ON "TavleGuestSubmission"("status");

-- CreateIndex
CREATE INDEX "TavleGuestSubmission_createdAt_idx" ON "TavleGuestSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "TavleGuestSubmission_tavleId_status_createdAt_idx" ON "TavleGuestSubmission"("tavleId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GjesteHendelse_tenantId_idx" ON "GjesteHendelse"("tenantId");

-- CreateIndex
CREATE INDEX "GjesteHendelse_occurredAt_idx" ON "GjesteHendelse"("occurredAt");

-- CreateIndex
CREATE INDEX "HotellEvakueringsplan_tenantId_idx" ON "HotellEvakueringsplan"("tenantId");

-- CreateIndex
CREATE INDEX "AktivitetsUtstyrssjekk_tenantId_idx" ON "AktivitetsUtstyrssjekk"("tenantId");

-- CreateIndex
CREATE INDEX "AktivitetsUtstyrssjekk_checkDate_idx" ON "AktivitetsUtstyrssjekk"("checkDate");

-- CreateIndex
CREATE INDEX "TransportJournal_tenantId_idx" ON "TransportJournal"("tenantId");

-- CreateIndex
CREATE INDEX "TransportJournal_date_idx" ON "TransportJournal"("date");

-- CreateIndex
CREATE INDEX "TransportJournal_vehicleReg_idx" ON "TransportJournal"("vehicleReg");

-- CreateIndex
CREATE INDEX "SjaforDokument_tenantId_idx" ON "SjaforDokument"("tenantId");

-- CreateIndex
CREATE INDEX "LoyveRegister_tenantId_idx" ON "LoyveRegister"("tenantId");

-- CreateIndex
CREATE INDEX "HaccpPlan_tenantId_idx" ON "HaccpPlan"("tenantId");

-- CreateIndex
CREATE INDEX "HaccpCcp_planId_idx" ON "HaccpCcp"("planId");

-- CreateIndex
CREATE INDEX "TemperaturLog_tenantId_idx" ON "TemperaturLog"("tenantId");

-- CreateIndex
CREATE INDEX "TemperaturLog_measuredAt_idx" ON "TemperaturLog"("measuredAt");

-- CreateIndex
CREATE INDEX "TemperaturLog_unitName_idx" ON "TemperaturLog"("unitName");

-- CreateIndex
CREATE INDEX "AllergenOversikt_tenantId_idx" ON "AllergenOversikt"("tenantId");

-- CreateIndex
CREATE INDEX "MattilsynetInspeksjon_tenantId_idx" ON "MattilsynetInspeksjon"("tenantId");

-- CreateIndex
CREATE INDEX "MattilsynetInspeksjon_inspectedAt_idx" ON "MattilsynetInspeksjon"("inspectedAt");

-- CreateIndex
CREATE INDEX "BhtAvtale_tenantId_idx" ON "BhtAvtale"("tenantId");

-- CreateIndex
CREATE INDEX "NattarbeidVurdering_tenantId_idx" ON "NattarbeidVurdering"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceConsent_tenantId_key" ON "IntelligenceConsent"("tenantId");

-- CreateIndex
CREATE INDEX "IndustrySnapshot_industry_idx" ON "IndustrySnapshot"("industry");

-- CreateIndex
CREATE INDEX "IndustrySnapshot_periodType_period_idx" ON "IndustrySnapshot"("periodType", "period");

-- CreateIndex
CREATE UNIQUE INDEX "IndustrySnapshot_industry_period_periodType_key" ON "IndustrySnapshot"("industry", "period", "periodType");

-- CreateIndex
CREATE INDEX "TenantIntelligenceScore_tenantId_idx" ON "TenantIntelligenceScore"("tenantId");

-- CreateIndex
CREATE INDEX "TenantIntelligenceScore_period_idx" ON "TenantIntelligenceScore"("period");

-- CreateIndex
CREATE UNIQUE INDEX "TenantIntelligenceScore_tenantId_period_key" ON "TenantIntelligenceScore"("tenantId", "period");

-- CreateIndex
CREATE INDEX "TrendDataPoint_metric_period_idx" ON "TrendDataPoint"("metric", "period");

-- CreateIndex
CREATE UNIQUE INDEX "TrendDataPoint_industry_metric_period_key" ON "TrendDataPoint"("industry", "metric", "period");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceApiKey_hashedKey_key" ON "IntelligenceApiKey"("hashedKey");

-- CreateIndex
CREATE INDEX "IntelligenceApiLog_apiKeyId_idx" ON "IntelligenceApiLog"("apiKeyId");

-- CreateIndex
CREATE INDEX "IntelligenceApiLog_createdAt_idx" ON "IntelligenceApiLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HmsHandbook_tenantId_key" ON "HmsHandbook"("tenantId");

-- CreateIndex
CREATE INDEX "HmsHandbook_tenantId_idx" ON "HmsHandbook"("tenantId");

-- CreateIndex
CREATE INDEX "HandbookVersion_handbookId_status_idx" ON "HandbookVersion"("handbookId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HandbookVersion_handbookId_version_key" ON "HandbookVersion"("handbookId", "version");

-- CreateIndex
CREATE INDEX "HandbookSection_versionId_sortOrder_idx" ON "HandbookSection"("versionId", "sortOrder");

-- CreateIndex
CREATE INDEX "HandbookSection_parentId_idx" ON "HandbookSection"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "HandbookSection_versionId_sectionKey_key" ON "HandbookSection"("versionId", "sectionKey");

-- CreateIndex
CREATE INDEX "HandbookTemplate_industry_isActive_idx" ON "HandbookTemplate"("industry", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HandbookBranding_handbookId_key" ON "HandbookBranding"("handbookId");

-- CreateIndex
CREATE INDEX "HandbookSignature_handbookId_idx" ON "HandbookSignature"("handbookId");

-- CreateIndex
CREATE INDEX "HandbookSignature_versionId_idx" ON "HandbookSignature"("versionId");

-- CreateIndex
CREATE INDEX "HandbookSignature_userId_idx" ON "HandbookSignature"("userId");

-- CreateIndex
CREATE INDEX "PatternCache_tenantId_isActive_idx" ON "PatternCache"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PatternCache_tenantId_patternKey_key" ON "PatternCache"("tenantId", "patternKey");

-- CreateIndex
CREATE INDEX "ImprovementSuggestion_tenantId_status_idx" ON "ImprovementSuggestion"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ImprovementLog_tenantId_changedAt_idx" ON "ImprovementLog"("tenantId", "changedAt");

-- CreateIndex
CREATE INDEX "ImprovementLog_suggestionId_idx" ON "ImprovementLog"("suggestionId");

-- CreateIndex
CREATE INDEX "TenantHmsScore_tenantId_scoreDate_idx" ON "TenantHmsScore"("tenantId", "scoreDate");

-- CreateIndex
CREATE UNIQUE INDEX "TenantHmsScore_tenantId_scoreDate_key" ON "TenantHmsScore"("tenantId", "scoreDate");

-- CreateIndex
CREATE UNIQUE INDEX "HmsKnowledgeEntry_lawReference_key" ON "HmsKnowledgeEntry"("lawReference");

-- CreateIndex
CREATE INDEX "AnonymizedTenantStats_tenantId_idx" ON "AnonymizedTenantStats"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymizedTenantStats_tenantId_periodStart_key" ON "AnonymizedTenantStats"("tenantId", "periodStart");

-- CreateIndex
CREATE INDEX "_BlogPostToBlogTag_B_index" ON "_BlogPostToBlogTag"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSequence" ADD CONSTRAINT "TenantSequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsAnnualPlanCompletion" ADD CONSTRAINT "HmsAnnualPlanCompletion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsAnnualPlanCompletion" ADD CONSTRAINT "HmsAnnualPlanCompletion_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantActivity" ADD CONSTRAINT "TenantActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantOffer" ADD CONSTRAINT "TenantOffer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceExport" ADD CONSTRAINT "InvoiceExport_exportedById_fkey" FOREIGN KEY ("exportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgChartNode" ADD CONSTRAINT "OrgChartNode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgChartNode" ADD CONSTRAINT "OrgChartNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgChartNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectroComplianceDeclaration" ADD CONSTRAINT "ElectroComplianceDeclaration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectroComplianceDeclaration" ADD CONSTRAINT "ElectroComplianceDeclaration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectroInstruction" ADD CONSTRAINT "ElectroInstruction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectroInstruction" ADD CONSTRAINT "ElectroInstruction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "RiskAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_inspectionTemplateId_fkey" FOREIGN KEY ("inspectionTemplateId") REFERENCES "InspectionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskDocumentLink" ADD CONSTRAINT "RiskDocumentLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskDocumentLink" ADD CONSTRAINT "RiskDocumentLink_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskDocumentLink" ADD CONSTRAINT "RiskDocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAuditLink" ADD CONSTRAINT "RiskAuditLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAuditLink" ADD CONSTRAINT "RiskAuditLink_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAuditLink" ADD CONSTRAINT "RiskAuditLink_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskChemicalLink" ADD CONSTRAINT "RiskChemicalLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskChemicalLink" ADD CONSTRAINT "RiskChemicalLink_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskChemicalLink" ADD CONSTRAINT "RiskChemicalLink_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTrainingRequirement" ADD CONSTRAINT "RiskTrainingRequirement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTrainingRequirement" ADD CONSTRAINT "RiskTrainingRequirement_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAsset" ADD CONSTRAINT "SecurityAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAsset" ADD CONSTRAINT "SecurityAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControl" ADD CONSTRAINT "SecurityControl_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControl" ADD CONSTRAINT "SecurityControl_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControl" ADD CONSTRAINT "SecurityControl_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "SecurityAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControl" ADD CONSTRAINT "SecurityControl_linkedRiskId_fkey" FOREIGN KEY ("linkedRiskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControlDocument" ADD CONSTRAINT "SecurityControlDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControlDocument" ADD CONSTRAINT "SecurityControlDocument_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityControlDocument" ADD CONSTRAINT "SecurityControlDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvidence" ADD CONSTRAINT "SecurityEvidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvidence" ADD CONSTRAINT "SecurityEvidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvidence" ADD CONSTRAINT "SecurityEvidence_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReview" ADD CONSTRAINT "AccessReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReview" ADD CONSTRAINT "AccessReview_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReviewEntry" ADD CONSTRAINT "AccessReviewEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReviewEntry" ADD CONSTRAINT "AccessReviewEntry_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AccessReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessReviewEntry" ADD CONSTRAINT "AccessReviewEntry_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_followUpOwnerId_fkey" FOREIGN KEY ("followUpOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_linkedIncidentId_fkey" FOREIGN KEY ("linkedIncidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_environmentalAspectId_fkey" FOREIGN KEY ("environmentalAspectId") REFERENCES "EnvironmentalAspect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_fireDrillId_fkey" FOREIGN KEY ("fireDrillId") REFERENCES "FireDrill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalAspect" ADD CONSTRAINT "EnvironmentalAspect_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalAspect" ADD CONSTRAINT "EnvironmentalAspect_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalAspect" ADD CONSTRAINT "EnvironmentalAspect_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalMeasurement" ADD CONSTRAINT "EnvironmentalMeasurement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalMeasurement" ADD CONSTRAINT "EnvironmentalMeasurement_aspectId_fkey" FOREIGN KEY ("aspectId") REFERENCES "EnvironmentalAspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalMeasurement" ADD CONSTRAINT "EnvironmentalMeasurement_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_riskReferenceId_fkey" FOREIGN KEY ("riskReferenceId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_relatedRoutineId_fkey" FOREIGN KEY ("relatedRoutineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuhReport" ADD CONSTRAINT "RuhReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentSubcategoryOption" ADD CONSTRAINT "IncidentSubcategoryOption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjaAnalysis" ADD CONSTRAINT "SjaAnalysis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjaAnalysis" ADD CONSTRAINT "SjaAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjaHazard" ADD CONSTRAINT "SjaHazard_sjaAnalysisId_fkey" FOREIGN KEY ("sjaAnalysisId") REFERENCES "SjaAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjaTemplate" ADD CONSTRAINT "SjaTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjaTemplateHazard" ADD CONSTRAINT "SjaTemplateHazard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SjaTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTemplate" ADD CONSTRAINT "CourseTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiMeasurement" ADD CONSTRAINT "KpiMeasurement_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiMeasurement" ADD CONSTRAINT "KpiMeasurement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chemical" ADD CONSTRAINT "Chemical_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureRegister" ADD CONSTRAINT "ExposureRegister_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureRegister" ADD CONSTRAINT "ExposureRegister_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureRegister" ADD CONSTRAINT "ExposureRegister_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureRegister" ADD CONSTRAINT "ExposureRegister_ruhReportId_fkey" FOREIGN KEY ("ruhReportId") REFERENCES "RuhReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureRegister" ADD CONSTRAINT "ExposureRegister_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ruhReportId_fkey" FOREIGN KEY ("ruhReportId") REFERENCES "RuhReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_sjaAnalysisId_fkey" FOREIGN KEY ("sjaAnalysisId") REFERENCES "SjaAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_formSubmissionId_fkey" FOREIGN KEY ("formSubmissionId") REFERENCES "FormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTemplate" ADD CONSTRAINT "InspectionTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionFinding" ADD CONSTRAINT "InspectionFinding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionFinding" ADD CONSTRAINT "InspectionFinding_linkedRiskId_fkey" FOREIGN KEY ("linkedRiskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionFinding" ADD CONSTRAINT "InspectionFinding_linkedMeasureId_fkey" FOREIGN KEY ("linkedMeasureId") REFERENCES "Measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTemplate" ADD CONSTRAINT "RoutineTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoutineTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldValue" ADD CONSTRAINT "FormFieldValue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldValue" ADD CONSTRAINT "FormFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementReview" ADD CONSTRAINT "ManagementReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whistleblowing" ADD CONSTRAINT "Whistleblowing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhistleblowMessage" ADD CONSTRAINT "WhistleblowMessage_whistleblowingId_fkey" FOREIGN KEY ("whistleblowingId") REFERENCES "Whistleblowing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPushToken" ADD CONSTRAINT "NotificationPushToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPushToken" ADD CONSTRAINT "NotificationPushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReminder" ADD CONSTRAINT "ScheduledReminder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReminder" ADD CONSTRAINT "ScheduledReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtClient" ADD CONSTRAINT "BhtClient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtAssessment" ADD CONSTRAINT "BhtAssessment_bhtClientId_fkey" FOREIGN KEY ("bhtClientId") REFERENCES "BhtClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtConsultation" ADD CONSTRAINT "BhtConsultation_bhtClientId_fkey" FOREIGN KEY ("bhtClientId") REFERENCES "BhtClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtAmoMeeting" ADD CONSTRAINT "BhtAmoMeeting_bhtClientId_fkey" FOREIGN KEY ("bhtClientId") REFERENCES "BhtClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtInspection" ADD CONSTRAINT "BhtInspection_bhtClientId_fkey" FOREIGN KEY ("bhtClientId") REFERENCES "BhtClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtExposureAssessment" ADD CONSTRAINT "BhtExposureAssessment_bhtClientId_fkey" FOREIGN KEY ("bhtClientId") REFERENCES "BhtClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtAnnualReport" ADD CONSTRAINT "BhtAnnualReport_bhtClientId_fkey" FOREIGN KEY ("bhtClientId") REFERENCES "BhtClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionShaPlan" ADD CONSTRAINT "ConstructionShaPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionShaPlan" ADD CONSTRAINT "ConstructionShaPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CdmDutyHolder" ADD CONSTRAINT "CdmDutyHolder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CdmDutyHolder" ADD CONSTRAINT "CdmDutyHolder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoshhAssessment" ADD CONSTRAINT "CoshhAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitToWork" ADD CONSTRAINT "PermitToWork_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionPreNotification" ADD CONSTRAINT "ConstructionPreNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionPreNotification" ADD CONSTRAINT "ConstructionPreNotification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionRosterEntry" ADD CONSTRAINT "ConstructionRosterEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionRosterEntry" ADD CONSTRAINT "ConstructionRosterEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionRosterDailyCheck" ADD CONSTRAINT "ConstructionRosterDailyCheck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionRosterDailyCheck" ADD CONSTRAINT "ConstructionRosterDailyCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionRosterDailyCheck" ADD CONSTRAINT "ConstructionRosterDailyCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardConfig" ADD CONSTRAINT "DashboardConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardConfig" ADD CONSTRAINT "DashboardConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireDrill" ADD CONSTRAINT "FireDrill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsTavleSubscription" ADD CONSTRAINT "HmsTavleSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsTavle" ADD CONSTRAINT "HmsTavle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsTavle" ADD CONSTRAINT "HmsTavle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsTavleSection" ADD CONSTRAINT "HmsTavleSection_tavleId_fkey" FOREIGN KEY ("tavleId") REFERENCES "HmsTavle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsTavleExternalLink" ADD CONSTRAINT "HmsTavleExternalLink_tavleId_fkey" FOREIGN KEY ("tavleId") REFERENCES "HmsTavle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorPortal" ADD CONSTRAINT "SubcontractorPortal_tavleId_fkey" FOREIGN KEY ("tavleId") REFERENCES "HmsTavle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorSubmission" ADD CONSTRAINT "SubcontractorSubmission_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "SubcontractorPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReviewGoal" ADD CONSTRAINT "EmployeeReviewGoal_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "EmployeeReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReviewAction" ADD CONSTRAINT "EmployeeReviewAction_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "EmployeeReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TavleCheckin" ADD CONSTRAINT "TavleCheckin_tavleId_fkey" FOREIGN KEY ("tavleId") REFERENCES "HmsTavle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TavleGuestSubmission" ADD CONSTRAINT "TavleGuestSubmission_tavleId_fkey" FOREIGN KEY ("tavleId") REFERENCES "HmsTavle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GjesteHendelse" ADD CONSTRAINT "GjesteHendelse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotellEvakueringsplan" ADD CONSTRAINT "HotellEvakueringsplan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktivitetsUtstyrssjekk" ADD CONSTRAINT "AktivitetsUtstyrssjekk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportJournal" ADD CONSTRAINT "TransportJournal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SjaforDokument" ADD CONSTRAINT "SjaforDokument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyveRegister" ADD CONSTRAINT "LoyveRegister_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaccpPlan" ADD CONSTRAINT "HaccpPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaccpCcp" ADD CONSTRAINT "HaccpCcp_planId_fkey" FOREIGN KEY ("planId") REFERENCES "HaccpPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperaturLog" ADD CONSTRAINT "TemperaturLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergenOversikt" ADD CONSTRAINT "AllergenOversikt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MattilsynetInspeksjon" ADD CONSTRAINT "MattilsynetInspeksjon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhtAvtale" ADD CONSTRAINT "BhtAvtale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NattarbeidVurdering" ADD CONSTRAINT "NattarbeidVurdering_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceConsent" ADD CONSTRAINT "IntelligenceConsent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantIntelligenceScore" ADD CONSTRAINT "TenantIntelligenceScore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceApiLog" ADD CONSTRAINT "IntelligenceApiLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "IntelligenceApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsHandbook" ADD CONSTRAINT "HmsHandbook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HmsHandbook" ADD CONSTRAINT "HmsHandbook_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookVersion" ADD CONSTRAINT "HandbookVersion_handbookId_fkey" FOREIGN KEY ("handbookId") REFERENCES "HmsHandbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookVersion" ADD CONSTRAINT "HandbookVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookSection" ADD CONSTRAINT "HandbookSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "HandbookVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookSection" ADD CONSTRAINT "HandbookSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "HandbookSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookBranding" ADD CONSTRAINT "HandbookBranding_handbookId_fkey" FOREIGN KEY ("handbookId") REFERENCES "HmsHandbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookSignature" ADD CONSTRAINT "HandbookSignature_handbookId_fkey" FOREIGN KEY ("handbookId") REFERENCES "HmsHandbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookSignature" ADD CONSTRAINT "HandbookSignature_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "HandbookVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandbookSignature" ADD CONSTRAINT "HandbookSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternCache" ADD CONSTRAINT "PatternCache_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementSuggestion" ADD CONSTRAINT "ImprovementSuggestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementSuggestion" ADD CONSTRAINT "ImprovementSuggestion_patternCacheId_fkey" FOREIGN KEY ("patternCacheId") REFERENCES "PatternCache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementLog" ADD CONSTRAINT "ImprovementLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementLog" ADD CONSTRAINT "ImprovementLog_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "ImprovementSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHmsScore" ADD CONSTRAINT "TenantHmsScore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymizedTenantStats" ADD CONSTRAINT "AnonymizedTenantStats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_B_fkey" FOREIGN KEY ("B") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

