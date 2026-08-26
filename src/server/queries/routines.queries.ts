import { getAdminDb } from "@/lib/supabase/admin";
import type { Routine, RoutineStatus, RoutineTemplate } from "@prisma/client";

export type RoutineListPerson = { id: string; name: string | null; email: string | null };
export type RoutineListTemplate = {
  id: string;
  title: string;
  isGlobal: boolean;
  industryScope: unknown;
};

export type RoutineListItem = Routine & {
  responsibleUser: RoutineListPerson | null;
  template: RoutineListTemplate | null;
};

export type RoutineDetail = Routine & {
  responsibleUser: RoutineListPerson | null;
  template: RoutineTemplate | null;
};

export type ProcedureFormUser = {
  userId: string;
  role: string;
  user: { name: string | null; email: string | null };
};

const EMPLOYEE_STATUSES: RoutineStatus[] = ["ACTIVE", "NEEDS_REVIEW"];

function asRoutine(row: Record<string, unknown>): Routine {
  return row as unknown as Routine;
}

export async function loadRoutinesForList(input: {
  tenantId: string;
  query?: string;
  forEmployee?: boolean;
}): Promise<RoutineListItem[]> {
  const db = getAdminDb();
  let request = db.from("Routine").select("*").eq("tenantId", input.tenantId);

  if (input.forEmployee) {
    request = request.in("status", EMPLOYEE_STATUSES);
  }
  if (input.query) {
    request = request.ilike("title", `%${input.query}%`);
  }

  const { data: rows, error } = await request.order("status", { ascending: true }).order("updatedAt", {
    ascending: false,
  });

  if (error) {
    throw { code: "ROUTINE_LIST_FAILED", message: error.message };
  }

  const routines = ((rows ?? []) as Record<string, unknown>[]).map(asRoutine);
  const responsibleIds = [...new Set(routines.map((row) => row.responsibleId).filter(Boolean))] as string[];
  const templateIds = [...new Set(routines.map((row) => row.templateId).filter(Boolean))] as string[];

  const [{ data: people }, { data: templates }] = await Promise.all([
    responsibleIds.length > 0
      ? db.from("User").select("id, name, email").in("id", responsibleIds)
      : Promise.resolve({ data: [] as RoutineListPerson[] }),
    templateIds.length > 0
      ? db.from("RoutineTemplate").select("id, title, isGlobal, industryScope").in("id", templateIds)
      : Promise.resolve({ data: [] as RoutineListTemplate[] }),
  ]);

  const peopleById = new Map(((people ?? []) as RoutineListPerson[]).map((person) => [person.id, person]));
  const templateById = new Map(
    ((templates ?? []) as RoutineListTemplate[]).map((template) => [template.id, template])
  );

  return routines.map((routine) => ({
    ...routine,
    responsibleUser: routine.responsibleId ? peopleById.get(routine.responsibleId) ?? null : null,
    template: routine.templateId ? templateById.get(routine.templateId) ?? null : null,
  }));
}

export async function loadRoutineDetail(input: {
  id: string;
  tenantId: string;
  forEmployee?: boolean;
}): Promise<RoutineDetail | null> {
  const db = getAdminDb();
  let request = db.from("Routine").select("*").eq("id", input.id).eq("tenantId", input.tenantId);

  if (input.forEmployee) {
    request = request.in("status", EMPLOYEE_STATUSES);
  }

  const { data: row, error } = await request.maybeSingle();
  if (error) {
    throw { code: "ROUTINE_LOAD_FAILED", message: error.message };
  }
  if (!row) return null;

  const routine = asRoutine(row as Record<string, unknown>);
  const [{ data: person }, { data: template }] = await Promise.all([
    routine.responsibleId
      ? db.from("User").select("id, name, email").eq("id", routine.responsibleId).maybeSingle()
      : Promise.resolve({ data: null }),
    routine.templateId
      ? db.from("RoutineTemplate").select("*").eq("id", routine.templateId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...routine,
    responsibleUser: (person as RoutineListPerson | null) ?? null,
    template: (template as RoutineTemplate | null) ?? null,
  };
}

export async function loadProcedureFormUsers(tenantId: string): Promise<ProcedureFormUser[]> {
  const db = getAdminDb();
  const { data: memberships } = await db.from("UserTenant").select("userId, role").eq("tenantId", tenantId);
  const rows = (memberships ?? []) as Array<{ userId: string; role: string }>;
  const userIds = rows.map((row) => row.userId);
  if (userIds.length === 0) return [];

  const { data: users } = await db.from("User").select("id, name, email").in("id", userIds);
  const userById = new Map(
    ((users ?? []) as Array<{ id: string; name: string | null; email: string | null }>).map((person) => [
      person.id,
      person,
    ])
  );

  return rows
    .map((row) => {
      const user = userById.get(row.userId);
      return {
        userId: row.userId,
        role: row.role,
        user: { name: user?.name ?? null, email: user?.email ?? null },
      };
    })
    .sort((a, b) => a.role.localeCompare(b.role));
}

export async function loadRoutineTemplates(input: {
  tenantId: string;
  query?: string;
  category?: string;
  includeInactive?: boolean;
}): Promise<RoutineTemplate[]> {
  const db = getAdminDb();
  let request = db
    .from("RoutineTemplate")
    .select("*")
    .or(`isGlobal.eq.true,tenantId.eq.${input.tenantId}`);

  if (!input.includeInactive) {
    request = request.eq("isActive", true);
  }
  if (input.category) {
    request = request.eq("category", input.category);
  }
  if (input.query) {
    request = request.ilike("title", `%${input.query}%`);
  }

  const { data, error } = await request.order("isGlobal", { ascending: false }).order("createdAt", {
    ascending: false,
  });

  if (error) {
    throw { code: "ROUTINE_TEMPLATE_LIST_FAILED", message: error.message };
  }

  return (data ?? []) as RoutineTemplate[];
}
