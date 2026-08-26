/** Norwegian HMS Intelligence engine — disabled in the UK product. */

export async function onIncidentCreated(_tenantId: string, _incidentId: string): Promise<void> {}

export async function onIncidentClosed(_tenantId: string, _incidentId: string): Promise<void> {}

export async function onRuhCreated(_tenantId: string, _ruhId: string): Promise<void> {}

export async function onFindingCreated(_tenantId: string, _findingId: string): Promise<void> {}

export async function onRoutineUpdated(_tenantId: string, _routineId: string): Promise<void> {}

export async function onMeasureClosed(_tenantId: string, _measureId: string): Promise<void> {}

export async function onTrainingExpired(_tenantId: string): Promise<void> {}

export async function onRiskReviewOverdue(_tenantId: string): Promise<void> {}

export async function onChemicalSdsExpired(_tenantId: string): Promise<void> {}

export async function onFireDrillOverdue(_tenantId: string): Promise<void> {}
