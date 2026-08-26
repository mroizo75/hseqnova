import {
  FileText,
  AlertCircle,
  Beaker,
  GraduationCap,
  HardHat,
  Eye,
  Flame,
  Headphones,
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
  /** Admin widget-ID som denne ansatt-widgeten mapper til */
  adminWidgetId?: string;
  /** Om widgeten skal vises i bunnnavigasjonen */
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
    id: "emp-chemicals",
    label: "COSHH",
    description: "Hazardous substances and safety data sheets",
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
    label: "Fire drills",
    description: "Planned and completed fire drills",
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
 * Filtrerer ansatt-widgets basert på admin-dashboardets lockedDashboardConfig.
 */
export function getEmployeeWidgetsFromLockedConfig(
  lockedConfig: Array<{ id: string }> | null | undefined
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
  widgets: EmployeeWidgetDefinition[]
): EmployeeWidgetDefinition[] {
  return widgets.filter((w) => w.showInBottomNav);
}
