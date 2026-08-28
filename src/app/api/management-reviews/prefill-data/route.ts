import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/management-reviews/prefill-data - Fetch data for pre-filling
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Hent periode fra query params (default: siste 3 måneder)
    const { searchParams } = new URL(req.url);
    const monthsBack = parseInt(searchParams.get("months") || "3");
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    // Parallell henting av alle data
    const [
      goals,
      incidents,
      risks,
      audits,
      inspections,
      trainings,
      measures,
    ] = await Promise.all([
      // HMS-mål
      db.goal.findMany({
        where: { tenantId },
        include: {
          measurements: {
            orderBy: { measurementDate: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Hendelser og avvik
      db.incident.findMany({
        where: {
          tenantId,
          occurredAt: { gte: startDate },
        },
        orderBy: { occurredAt: "desc" },
      }),

      // Risikovurderinger
      db.risk.findMany({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
      }),

      // Revisjoner
      db.audit.findMany({
        where: {
          tenantId,
          scheduledDate: { gte: startDate },
        },
        include: {
          findings: true,
        },
        orderBy: { scheduledDate: "desc" },
      }),

      // Inspeksjoner/Vernerunder
      db.inspection.findMany({
        where: {
          tenantId,
          scheduledDate: { gte: startDate },
        },
        include: {
          findings: true,
        },
        orderBy: { scheduledDate: "desc" },
      }),

      // Opplæring
      db.training.findMany({
        where: {
          tenantId,
          completedAt: { gte: startDate },
        },
        orderBy: { completedAt: "desc" },
      }),

      // Tiltak
      db.measure.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Generer tekst for HMS-mål
    const hmsGoalsReview = generateGoalsReview(goals);

    // Generer tekst for hendelser
    const incidentStatistics = generateIncidentStatistics(incidents);

    // Generer tekst for risikovurderinger
    const riskReview = generateRiskReview(risks);

    // Generer tekst for revisjoner
    const auditResults = generateAuditResults(audits, inspections);

    // Generer tekst for opplæring
    const trainingStatus = generateTrainingStatus(trainings);

    return NextResponse.json({
      data: {
        hmsGoalsReview,
        incidentStatistics,
        riskReview,
        auditResults,
        trainingStatus,
        // Raw data for evt. videre prosessering
        raw: {
          goals,
          incidents,
          risks,
          audits,
          inspections,
          trainings,
          measures,
        },
      },
    });
  } catch (error: any) {
    console.error("[MANAGEMENT_REVIEWS_PREFILL_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Generer tekst for HMS-mål
function generateGoalsReview(goals: any[]): string {
  if (goals.length === 0) {
    return "No HSEQ objectives recorded in the period.\n\n⚠️ RECOMMENDATION: Set measurable HSEQ objectives for the next period.";
  }

  let text = `## HSEQ objectives and achievement\n\n`;
  text += `Total number of objectives: ${goals.length}\n\n`;

  goals.forEach((goal, index) => {
    text += `### ${index + 1}. ${goal.title}\n`;
    text += `- Type: ${goal.type}\n`;
    text += `- Target: ${goal.targetValue} ${goal.unit}\n`;
    text += `- Status: ${goal.status}\n`;
    text += `- Start date: ${new Date(goal.startDate).toLocaleDateString("en-GB")}\n`;
    text += `- End date: ${new Date(goal.endDate).toLocaleDateString("en-GB")}\n`;

    if (goal.measurements && goal.measurements.length > 0) {
      const latest = goal.measurements[0];
      text += `- Latest measurement: ${latest.value} ${goal.unit} (${new Date(latest.measurementDate).toLocaleDateString("en-GB")})\n`;
      
      const progress = (parseFloat(latest.value) / parseFloat(goal.targetValue)) * 100;
      text += `- Achievement: ${progress.toFixed(1)}%\n`;
    } else {
      text += `- ⚠️ No measurements recorded\n`;
    }

    text += `\n`;
  });

  const completedGoals = goals.filter(g => g.status === "COMPLETED").length;
  const inProgressGoals = goals.filter(g => g.status === "IN_PROGRESS").length;
  const notStartedGoals = goals.filter(g => g.status === "NOT_STARTED").length;

  text += `\n### Summary\n`;
  text += `- ✅ Completed: ${completedGoals}\n`;
  text += `- 🔄 In progress: ${inProgressGoals}\n`;
  text += `- ⏸️ Not started: ${notStartedGoals}\n`;

  return text;
}

// Generer tekst for hendelser
function generateIncidentStatistics(incidents: any[]): string {
  if (incidents.length === 0) {
    return "No incidents recorded in the period.\n\n✅ This is positive, but ensure employees know how to report incidents.";
  }

  let text = `## Incidents\n\n`;
  text += `Total number of incidents: ${incidents.length}\n\n`;

  const types = {
    ACCIDENT: 0,
    NEAR_MISS: 0,
    OBSERVATION: 0,
    ILLNESS: 0,
  };

  incidents.forEach((incident) => {
    if (incident.type in types) {
      types[incident.type as keyof typeof types]++;
    }
  });

  text += `### Incidents by type\n`;
  text += `- 🚨 Accidents: ${types.ACCIDENT}\n`;
  text += `- ⚠️ Near misses: ${types.NEAR_MISS}\n`;
  text += `- 👁️ Observations: ${types.OBSERVATION}\n`;
  text += `- 🏥 Illness/health issues: ${types.ILLNESS}\n\n`;

  const severities = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
    NOT_ASSESSED: 0,
  };

  incidents.forEach((incident) => {
    if (incident.severity === null || incident.severity === undefined) {
      severities.NOT_ASSESSED++;
    } else if (incident.severity >= 5) {
      severities.CRITICAL++;
    } else if (incident.severity === 4) {
      severities.HIGH++;
    } else if (incident.severity === 3) {
      severities.MEDIUM++;
    } else {
      severities.LOW++;
    }
  });

  text += `### Severity\n`;
  text += `- 🟢 Low: ${severities.LOW}\n`;
  text += `- 🟡 Medium: ${severities.MEDIUM}\n`;
  text += `- 🟠 High: ${severities.HIGH}\n`;
  text += `- 🔴 Critical: ${severities.CRITICAL}\n`;
  text += `- ⚪ Not assessed: ${severities.NOT_ASSESSED}\n\n`;

  const statuses = {
    OPEN: 0,
    UNDER_INVESTIGATION: 0,
    CLOSED: 0,
  };

  incidents.forEach((incident) => {
    if (incident.status in statuses) {
      statuses[incident.status as keyof typeof statuses]++;
    }
  });

  text += `### Status\n`;
  text += `- 📂 Open: ${statuses.OPEN}\n`;
  text += `- 🔍 Under investigation: ${statuses.UNDER_INVESTIGATION}\n`;
  text += `- ✅ Closed: ${statuses.CLOSED}\n\n`;

  const investigated = incidents.filter(i => i.rootCause && i.rootCause.trim().length > 0).length;
  text += `### Investigation\n`;
  text += `- ${investigated} of ${incidents.length} incidents have completed investigation (${((investigated / incidents.length) * 100).toFixed(0)}%)\n\n`;

  if (statuses.OPEN > 0 || statuses.UNDER_INVESTIGATION > 0) {
    text += `⚠️ ACTION REQUIRED: ${statuses.OPEN + statuses.UNDER_INVESTIGATION} incidents require closure.\n`;
  }

  if (types.ACCIDENT > 0) {
    text += `⚠️ IMPORTANT: ${types.ACCIDENT} accidents recorded. Ensure thorough root cause analysis and corrective actions.\n`;
  }

  return text;
}

// Generer tekst for risikovurderinger
function generateRiskReview(risks: any[]): string {
  if (risks.length === 0) {
    return "No risk assessments recorded.\n\n🚨 CRITICAL: Risk assessment is a legal requirement (MHSWR 1999 reg. 3). This must be done immediately.";
  }

  let text = `## Risk assessments\n\n`;
  text += `Total number of recorded risks: ${risks.length}\n\n`;

  const riskLevels = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  risks.forEach((risk) => {
    const score = risk.probability * risk.consequence;
    if (score <= 4) riskLevels.LOW++;
    else if (score <= 9) riskLevels.MEDIUM++;
    else if (score <= 16) riskLevels.HIGH++;
    else riskLevels.CRITICAL++;
  });

  text += `### Risk level (5x5 matrix)\n`;
  text += `- 🟢 Low risk (1-4): ${riskLevels.LOW}\n`;
  text += `- 🟡 Medium risk (5-9): ${riskLevels.MEDIUM}\n`;
  text += `- 🟠 High risk (10-16): ${riskLevels.HIGH}\n`;
  text += `- 🔴 Critical risk (17-25): ${riskLevels.CRITICAL}\n\n`;

  const withMeasures = risks.filter(r => r.proposedMeasures && r.proposedMeasures.trim().length > 0).length;
  text += `### Actions\n`;
  text += `- ${withMeasures} of ${risks.length} risks have proposed actions (${((withMeasures / risks.length) * 100).toFixed(0)}%)\n\n`;

  const highRisksWithoutMeasures = risks.filter(r => {
    const score = r.probability * r.consequence;
    return score >= 10 && (!r.proposedMeasures || r.proposedMeasures.trim().length === 0);
  });

  if (highRisksWithoutMeasures.length > 0) {
    text += `🚨 CRITICAL: ${highRisksWithoutMeasures.length} high/critical risks lack actions:\n`;
    highRisksWithoutMeasures.slice(0, 5).forEach(r => {
      text += `  - ${r.hazard} (Score: ${r.probability * r.consequence})\n`;
    });
    text += `\n`;
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const outdatedRisks = risks.filter(r => new Date(r.updatedAt) < oneYearAgo);

  if (outdatedRisks.length > 0) {
    text += `⚠️ RECOMMENDATION: ${outdatedRisks.length} risk assessments have not been updated in the last 12 months. These should be reviewed.\n`;
  }

  return text;
}

// Generer tekst for revisjoner
function generateAuditResults(audits: any[], inspections: any[]): string {
  let text = `## Audits and inspections\n\n`;

  if (audits.length === 0) {
    text += `⚠️ No audits conducted in the period.\n`;
    text += `ISO 9001 requires a minimum of one internal audit per year.\n\n`;
  } else {
    text += `### Audits\n`;
    text += `Total number of audits: ${audits.length}\n\n`;

    const auditStatuses = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    let totalFindings = 0;
    let criticalFindings = 0;

    audits.forEach((audit) => {
      if (audit.status in auditStatuses) {
        auditStatuses[audit.status as keyof typeof auditStatuses]++;
      }
      if (audit.findings) {
        totalFindings += audit.findings.length;
        criticalFindings += audit.findings.filter((f: any) => f.severity === "MAJOR" || f.severity === "CRITICAL").length;
      }
    });

    text += `Status:\n`;
    text += `- Planned: ${auditStatuses.PLANNED}\n`;
    text += `- In progress: ${auditStatuses.IN_PROGRESS}\n`;
    text += `- Completed: ${auditStatuses.COMPLETED}\n\n`;

    text += `Findings:\n`;
    text += `- Total findings: ${totalFindings}\n`;
    text += `- Critical/major findings: ${criticalFindings}\n\n`;

    if (criticalFindings > 0) {
      text += `🚨 ACTION REQUIRED: ${criticalFindings} critical/major findings must be followed up.\n\n`;
    }
  }

  if (inspections.length === 0) {
    text += `### Workplace inspections\n`;
    text += `⚠️ No workplace inspections conducted in the period.\n`;
    text += `MHSWR 1999 requires regular workplace inspections.\n\n`;
  } else {
    text += `### Workplace inspections\n`;
    text += `Total number of inspections: ${inspections.length}\n\n`;

    const inspectionStatuses = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    let totalInspectionFindings = 0;
    let criticalInspectionFindings = 0;

    inspections.forEach((inspection) => {
      if (inspection.status in inspectionStatuses) {
        inspectionStatuses[inspection.status as keyof typeof inspectionStatuses]++;
      }
      if (inspection.findings) {
        totalInspectionFindings += inspection.findings.length;
        criticalInspectionFindings += inspection.findings.filter((f: any) => f.severity === "HIGH" || f.severity === "CRITICAL").length;
      }
    });

    text += `Status:\n`;
    text += `- Planned: ${inspectionStatuses.PLANNED}\n`;
    text += `- In progress: ${inspectionStatuses.IN_PROGRESS}\n`;
    text += `- Completed: ${inspectionStatuses.COMPLETED}\n\n`;

    text += `Findings:\n`;
    text += `- Total findings: ${totalInspectionFindings}\n`;
    text += `- Critical/high severity: ${criticalInspectionFindings}\n\n`;

    if (criticalInspectionFindings > 0) {
      text += `⚠️ IMPORTANT: ${criticalInspectionFindings} critical findings from workplace inspections must be followed up.\n`;
    }
  }

  return text;
}

// Generer tekst for opplæring
function generateTrainingStatus(trainings: any[]): string {
  if (trainings.length === 0) {
    return "No training recorded in the period.\n\n⚠️ RECOMMENDATION: Document all training. This is important for compliance and during inspections.";
  }

  let text = `## Training and competence\n\n`;
  text += `Total number of recorded training sessions: ${trainings.length}\n\n`;

  const courseTypes: { [key: string]: number } = {};
  trainings.forEach((training) => {
    const key = training.courseKey || "other";
    courseTypes[key] = (courseTypes[key] || 0) + 1;
  });

  text += `### Training by type\n`;
  Object.entries(courseTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([key, count]) => {
      text += `- ${key}: ${count}\n`;
    });
  text += `\n`;

  const completed = trainings.filter(t => t.completedAt).length;
  const notCompleted = trainings.length - completed;

  text += `### Status\n`;
  text += `- ✅ Completed: ${completed}\n`;
  text += `- ⏳ Not completed: ${notCompleted}\n\n`;

  const withExpiry = trainings.filter(t => t.validUntil);
  const now = new Date();
  const expired = withExpiry.filter(t => new Date(t.validUntil) < now).length;
  const expiringSoon = withExpiry.filter(t => {
    const expiryDate = new Date(t.validUntil);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate >= now && expiryDate <= threeMonthsFromNow;
  }).length;

  if (withExpiry.length > 0) {
    text += `### Certificates with expiry date\n`;
    text += `- Total: ${withExpiry.length}\n`;
    text += `- ❌ Expired: ${expired}\n`;
    text += `- ⚠️ Expiring soon (3 months): ${expiringSoon}\n\n`;
  }

  const required = trainings.filter(t => t.isRequired);
  if (required.length > 0) {
    text += `### Mandatory training\n`;
    text += `- ${required.length} of ${trainings.length} are marked as mandatory\n\n`;
  }

  const evaluated = trainings.filter(t => t.effectiveness && t.effectiveness.trim().length > 0).length;
  if (trainings.length > 0) {
    text += `### Effectiveness evaluation (ISO 9001)\n`;
    text += `- ${evaluated} of ${trainings.length} training sessions have effectiveness evaluation (${((evaluated / trainings.length) * 100).toFixed(0)}%)\n\n`;
  }

  if (expired > 0) {
    text += `🚨 CRITICAL: ${expired} certificates have expired and must be renewed.\n`;
  }

  if (expiringSoon > 0) {
    text += `⚠️ IMPORTANT: ${expiringSoon} certificates expire within 3 months.\n`;
  }

  if (notCompleted > 0) {
    text += `📅 INFO: ${notCompleted} training sessions are not yet completed.\n`;
  }

  if (evaluated < trainings.length * 0.5) {
    text += `⚠️ RECOMMENDATION: Only ${((evaluated / trainings.length) * 100).toFixed(0)}% of training has effectiveness evaluation. ISO 9001 requires this.\n`;
  }

  return text;
}

