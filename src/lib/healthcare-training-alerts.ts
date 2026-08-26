import { hasTenantFeature } from "@/lib/tenant-features";
import { publishNotification } from "@/lib/redis-pubsub";
import {
  findExistingTrainingAlert,
  insertTrainingAlertNotification,
  loadPeopleByIds,
  loadRequiredTrainingsExpiringBy,
  loadTenantsForHealthcareAlerts,
  loadTrainingAlertRecipients,
} from "@/server/queries/training.queries";

type AlertRunResult = {
  tenantId: string;
  tenantName: string;
  sent: number;
};

export async function runHealthcareTrainingExpiryAlerts(options?: {
  tenantId?: string;
}): Promise<{
  totalSent: number;
  tenantsProcessed: number;
  results: AlertRunResult[];
}> {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const tenants = await loadTenantsForHealthcareAlerts(options?.tenantId);
  const healthcareTenants = tenants.filter((tenant) =>
    hasTenantFeature(tenant.industry, "helseforetak"),
  );

  const results: AlertRunResult[] = [];

  for (const tenant of healthcareTenants) {
    const trainings = await loadRequiredTrainingsExpiringBy(tenant.id, in30Days);
    if (trainings.length === 0) {
      results.push({ tenantId: tenant.id, tenantName: tenant.name, sent: 0 });
      continue;
    }

    const recipients = (await loadTrainingAlertRecipients(tenant.id)).filter(
      (recipient) => recipient.notifyTraining,
    );
    const employeeIds = [...new Set(trainings.map((training) => training.userId))];
    const employees = await loadPeopleByIds(employeeIds);
    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

    let tenantSent = 0;
    for (const training of trainings) {
      if (!training.validUntil) continue;

      const validUntil = new Date(training.validUntil);
      const daysUntilExpiry = Math.ceil(
        (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const isExpired = daysUntilExpiry <= 0;
      const type = isExpired ? "TRAINING_EXPIRED" : "TRAINING_DUE";
      const title = isExpired ? "Competence expired (healthcare)" : "Competence expiring soon (healthcare)";
      const employee = employeeById.get(training.userId);
      const employeeName = employee?.name || employee?.email || "Unknown employee";
      const message = isExpired
        ? `${training.title} for ${employeeName} has expired and must be renewed.`
        : `${training.title} for ${employeeName} expires in ${daysUntilExpiry} days.`;
      const link = `/dashboard/training?trainingId=${training.id}`;

      for (const recipient of recipients) {
        const exists = await findExistingTrainingAlert({
          tenantId: tenant.id,
          userId: recipient.userId,
          type,
          title,
          link,
          createdSince: dayStart,
        });
        if (exists) continue;

        const created = await insertTrainingAlertNotification({
          tenantId: tenant.id,
          userId: recipient.userId,
          type,
          title,
          message,
          link,
        });
        await publishNotification(
          recipient.userId,
          {
            id: created.id,
            tenantId: tenant.id,
            userId: recipient.userId,
            type,
            title,
            message,
            link,
            isRead: false,
          },
          tenant.id,
        );
        tenantSent += 1;
      }
    }

    results.push({ tenantId: tenant.id, tenantName: tenant.name, sent: tenantSent });
  }

  return {
    totalSent: results.reduce((sum, result) => sum + result.sent, 0),
    tenantsProcessed: healthcareTenants.length,
    results,
  };
}
