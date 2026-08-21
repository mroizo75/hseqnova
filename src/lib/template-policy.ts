import { Role } from "@prisma/client";

export function assertSuperAdminTemplateWrite(role: Role, isSuperAdmin: boolean): void {
  if (isSuperAdmin || role === "ADMIN") {
    return;
  }
  throw {
    code: "TEMPLATE_LOCKED",
    message: "Custom forms and inspection templates are set up by HSEQ Nova. Call us to add a new type. You can edit the text on existing templates.",
  };
}

export function canCreateFormTemplate(isSuperAdmin: boolean): boolean {
  return isSuperAdmin;
}

export function canCreateInspectionTemplate(isSuperAdmin: boolean): boolean {
  return isSuperAdmin;
}
