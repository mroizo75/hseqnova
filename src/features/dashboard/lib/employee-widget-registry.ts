import {
  FileText,
  AlertCircle,
  Beaker,
  GraduationCap,
  HardHat,
  Eye,
  Flame,
  Headphones,
  ListChecks,
  ShieldCheck,
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  FileKey,
  type LucideIcon,
} from "lucide-react";

export interface EmployeeWidgetDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  /** Admin widget-ID this employee widget maps to */
  adminWidgetId?: string;
  /** Whether this widget appears in the bottom navigation */
  showInBottomNav?: boolean;
}

export const EMPLOYEE_WIDGET_REGISTRY: EmployeeWidgetDefinition[] = [
  {
    id: "emp-documents",
    label: "Documents",
    description: "Read health and safety documents and instructions",
    icon: FileText,
    href: "/ansatt/dokumenter",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    adminWidgetId: "documents",
    showInBottomNav: true,
  },
  {
    id: "emp-incidents",
    label: "Accident book",
    description: "Report accidents, injuries and near misses",
    icon: AlertCircle,
    href: "/ansatt/avvik/ny",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    adminWidgetId: "incidents",
    showInBottomNav: true,
  },
  {
    id: "emp-actions",
    label: "My actions",
    description: "Actions assigned to you from incidents and audits",
    icon: ListChecks,
    href: "/ansatt/tiltak",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-300",
    adminWidgetId: "actions",
  },
  {
    id: "emp-sja",
    label: "RAMS",
    description: "Risk assessment and method statement",
    icon: HardHat,
    href: "/ansatt/sja",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    adminWidgetId: "sja",
  },
  {
    id: "emp-permits",
    label: "Permits to work",
    description: "Live permits for high-risk work",
    icon: FileKey,
    href: "/ansatt/permits",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    adminWidgetId: "permits",
  },
  {
    id: "emp-risks",
    label: "Risk assessments",
    description: "View workplace risk assessments",
    icon: ShieldCheck,
    href: "/ansatt/risikovurderinger",
    color: "text-sky-600",
    bgColor: "bg-sky-100",
    borderColor: "border-sky-300",
    adminWidgetId: "risks",
  },
  {
    id: "emp-chemicals",
    label: "COSHH",
    description: "Hazardous substances, safety data sheets and COSHH assessments",
    icon: Beaker,
    href: "/ansatt/stoffkartotek",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    adminWidgetId: "chemicals",
    showInBottomNav: true,
  },
  {
    id: "emp-training",
    label: "Training",
    description: "Courses and competence records",
    icon: GraduationCap,
    href: "/ansatt/opplaering",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    adminWidgetId: "training",
    showInBottomNav: true,
  },
  {
    id: "emp-fire-safety",
    label: "Fire safety",
    description: "Fire risk assessment, marshals and drills",
    icon: Flame,
    href: "/ansatt/brannoevelser",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    adminWidgetId: "fire-safety",
  },
  {
    id: "emp-inspections",
    label: "Workplace inspections",
    description: "Take part in workplace inspections",
    icon: Eye,
    href: "/ansatt/vernerunder",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    borderColor: "border-teal-300",
    adminWidgetId: "inspections",
  },
  {
    id: "emp-procedures",
    label: "Procedures",
    description: "Company procedures and work arrangements",
    icon: ClipboardList,
    href: "/ansatt/rutiner",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    borderColor: "border-indigo-300",
    adminWidgetId: "routines",
  },
  {
    id: "emp-hs-policy",
    label: "H&S Policy",
    description: "Health and safety policy and organisation",
    icon: BookOpen,
    href: "/ansatt/hms-handbok",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    borderColor: "border-teal-300",
    adminWidgetId: "hms-handbok",
  },
  {
    id: "emp-safety-board",
    label: "Safety board",
    description: "Digital safety information board",
    icon: LayoutDashboard,
    href: "/ansatt/hms-tavle",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
    adminWidgetId: "hms-tavle",
  },
  {
    id: "emp-whistleblowing",
    label: "Whistleblowing",
    description: "Report concerns confidentially (PIDA 1998)",
    icon: ShieldAlert,
    href: "/ansatt/varsling",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    adminWidgetId: "whistleblowing",
  },
  {
    id: "emp-support",
    label: "Help",
    description: "Chat with the HSEQ team",
    icon: Headphones,
    href: "/ansatt/hjelp",
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    borderColor: "border-violet-300",
    showInBottomNav: true,
  },
];

export const DEFAULT_EMPLOYEE_WIDGET_IDS = EMPLOYEE_WIDGET_REGISTRY.map((w) => w.id);

/**
 * Filter employee widgets based on the admin dashboard's lockedDashboardConfig.
 */
export function getEmployeeWidgetsFromLockedConfig(
  lockedConfig: Array<{ id: string }> | null | undefined,
): EmployeeWidgetDefinition[] {
  if (!lockedConfig || lockedConfig.length === 0) {
    return EMPLOYEE_WIDGET_REGISTRY;
  }

  const adminWidgetIds = new Set(lockedConfig.map((w) => w.id));

  return EMPLOYEE_WIDGET_REGISTRY.filter((empWidget) => {
    if (!empWidget.adminWidgetId) return true;
    return adminWidgetIds.has(empWidget.adminWidgetId);
  });
}

export function getEmployeeBottomNavItems(
  widgets: EmployeeWidgetDefinition[],
): EmployeeWidgetDefinition[] {
  return widgets.filter((w) => w.showInBottomNav);
}
