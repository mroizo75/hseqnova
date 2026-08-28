"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Shield,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { enGB } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type WhistleblowStatus =
  | "RECEIVED"
  | "ACKNOWLEDGED"
  | "UNDER_INVESTIGATION"
  | "ACTION_TAKEN"
  | "RESOLVED"
  | "CLOSED"
  | "DISMISSED";

type WhistleblowSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type WhistleblowCategory =
  | "HARASSMENT"
  | "DISCRIMINATION"
  | "WORK_ENVIRONMENT"
  | "SAFETY"
  | "CORRUPTION"
  | "ETHICS"
  | "LEGAL"
  | "OTHER";
type MessageSender = "REPORTER" | "HANDLER" | "SYSTEM";

interface TenantUser {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CaseAction {
  id: string;
  description: string;
  createdAt: string;
  completedAt?: string;
}

interface WhistleblowCase {
  id: string;
  caseNumber: string;
  category: WhistleblowCategory;
  title: string;
  description: string;
  occurredAt?: string;
  location?: string;
  involvedPersons?: string;
  witnesses?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  isAnonymous: boolean;
  status: WhistleblowStatus;
  severity: WhistleblowSeverity;
  handledBy?: string;
  assignedTo?: string;
  investigationNotes?: string;
  actions?: string;
  outcome?: string;
  closedReason?: string;
  receivedAt: string;
  acknowledgedAt?: string;
  investigatedAt?: string;
  closedAt?: string;
  messages: Message[];
}

interface Message {
  id: string;
  sender: MessageSender;
  senderUserId?: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

// --- Badges ---

function getStatusBadge(status: WhistleblowStatus) {
  const map: Record<WhistleblowStatus, JSX.Element> = {
    RECEIVED: <Badge variant="secondary">Received</Badge>,
    ACKNOWLEDGED: <Badge className="bg-blue-500 hover:bg-blue-500">Acknowledged</Badge>,
    UNDER_INVESTIGATION: (
      <Badge className="bg-purple-500 hover:bg-purple-500">Under investigation</Badge>
    ),
    ACTION_TAKEN: <Badge className="bg-yellow-500 hover:bg-yellow-500">Action taken</Badge>,
    RESOLVED: <Badge className="bg-green-600 hover:bg-green-600">Resolved</Badge>,
    CLOSED: <Badge variant="outline">Closed</Badge>,
    DISMISSED: <Badge variant="destructive">Dismissed</Badge>,
  };
  return map[status];
}

function getSeverityBadge(severity: WhistleblowSeverity) {
  const map: Record<WhistleblowSeverity, JSX.Element> = {
    LOW: <Badge variant="outline">Low</Badge>,
    MEDIUM: <Badge className="bg-yellow-500 hover:bg-yellow-500">Medium</Badge>,
    HIGH: <Badge className="bg-orange-500 hover:bg-orange-500">High</Badge>,
    CRITICAL: <Badge variant="destructive">Critical</Badge>,
  };
  return map[severity];
}

const CATEGORY_LABELS: Record<WhistleblowCategory, string> = {
  HARASSMENT: "Harassment",
  DISCRIMINATION: "Discrimination",
  WORK_ENVIRONMENT: "Work environment",
  SAFETY: "Health & safety",
  CORRUPTION: "Corruption",
  ETHICS: "Ethics",
  LEGAL: "Legal breach",
  OTHER: "Other",
};

// --- Case handling procedure (PIDA 1998; Employment Rights Act 1996 Part IVA) ---
// PIDA 1998 s.43A-L defines protected disclosures.
// Best practice: acknowledge receipt within 7 days.

interface ProcessStep {
  id: WhistleblowStatus;
  label: string;
  description: string;
  legalRef: string;
  daysLimit?: number;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "RECEIVED",
    label: "1. Received",
    description: "The disclosure has been logged. A case handler must be assigned and the whistleblower informed.",
    legalRef: "PIDA 1998 s.43A — Protected disclosure",
  },
  {
    id: "ACKNOWLEDGED",
    label: "2. Acknowledged",
    description:
      "Acknowledge receipt to the whistleblower. The employer should confirm receipt and outline next steps.",
    legalRef: "Best practice — acknowledge within 7 days",
    daysLimit: 7,
  },
  {
    id: "UNDER_INVESTIGATION",
    label: "3. Under investigation",
    description:
      "Conduct necessary enquiries. The case must be handled fairly and confidentially. All parties should be given the opportunity to respond.",
    legalRef: "ERA 1996 Part IVA — Fair treatment of disclosures",
  },
  {
    id: "ACTION_TAKEN",
    label: "4. Action taken",
    description:
      "Actions have been decided and implemented. Document all measures taken.",
    legalRef: "ERA 1996 s.47B — Protection from detriment",
  },
  {
    id: "RESOLVED",
    label: "5. Resolved",
    description:
      "The case has been concluded. The whistleblower should be informed of the outcome where possible. Document the rationale.",
    legalRef: "PIDA 1998 — Duty to inform; ERA 1996 s.103A",
  },
];

function CaseProcessCard({
  caseData,
  onStatusChange,
}: {
  caseData: WhistleblowCase;
  onStatusChange: (status: WhistleblowStatus) => void;
}) {
  const activeIndex = PROCESS_STEPS.findIndex((s) => s.id === caseData.status);
  const daysSinceReceived = differenceInDays(new Date(), new Date(caseData.receivedAt));
  const isDismissed = caseData.status === "DISMISSED" || caseData.status === "CLOSED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Case handling procedure
        </CardTitle>
        <CardDescription>
          Based on the Public Interest Disclosure Act 1998 (PIDA) and Employment Rights Act 1996
          Part IVA. Follow the steps for proper case management.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!caseData.acknowledgedAt && daysSinceReceived >= 5 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deadline approaching</AlertTitle>
            <AlertDescription>
              This case is {daysSinceReceived} days old. Best practice is to acknowledge receipt
              within 7 days. Change the status to &ldquo;Acknowledged&rdquo; and send an
              acknowledgement message to the whistleblower.
            </AlertDescription>
          </Alert>
        )}

        {isDismissed && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Case closed / dismissed</AlertTitle>
            <AlertDescription>
              This case has been concluded. Documentation is retained in accordance with UK GDPR
              and employment law requirements.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {PROCESS_STEPS.map((step, i) => {
            const isPast = i < activeIndex && !isDismissed;
            const isActive = step.id === caseData.status && !isDismissed;
            const isFuture = i > activeIndex && !isDismissed;

            return (
              <div
                key={step.id}
                className={`rounded-lg border p-4 transition-colors ${
                  isActive
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                    : isPast
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isPast
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-blue-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isFuture ? "text-muted-foreground" : ""
                        }`}
                      >
                        {step.label}
                        {step.daysLimit && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (max {step.daysLimit} days)
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                      <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {step.legalRef}
                      </p>
                    </div>
                  </div>

                  {isActive && i < PROCESS_STEPS.length - 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => onStatusChange(PROCESS_STEPS[i + 1].id)}
                    >
                      Next step &rarr;
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Inline-editable text field ---
function EditableTextField({
  label,
  value,
  placeholder,
  onSave,
  rows = 4,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onSave: (val: string) => void;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold">{label}</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </div>
        {value ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          <Save className="mr-1 h-3 w-3" />
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          <X className="mr-1 h-3 w-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Actions list ---
function ActionsList({
  actions,
  onAdd,
  onToggle,
  onRemove,
}: {
  actions: CaseAction[];
  onAdd: (description: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [newAction, setNewAction] = useState("");

  const handleAdd = () => {
    if (!newAction.trim()) return;
    onAdd(newAction.trim());
    setNewAction("");
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Actions and follow-up</h3>
      <p className="text-xs text-muted-foreground">
        Document all actions decided and taken (ERA 1996 s.47B — protection from detriment).
      </p>

      {actions.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No actions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                action.completedAt ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "bg-muted/30"
              }`}
            >
              <button
                onClick={() => onToggle(action.id)}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  action.completedAt
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-border bg-background"
                }`}
              >
                {action.completedAt && <CheckCircle2 className="h-3 w-3" />}
              </button>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    action.completedAt ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {action.description}
                </p>
                {action.completedAt && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Completed {format(new Date(action.completedAt), "dd MMM yyyy", { locale: enGB })}
                  </p>
                )}
              </div>
              <button
                onClick={() => onRemove(action.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newAction}
          onChange={(e) => setNewAction(e.target.value)}
          placeholder="Describe the action..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd} disabled={!newAction.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

// --- Close section ---
function CloseSection({
  status,
  closedReason,
  outcome,
  onClose,
}: {
  status: WhistleblowStatus;
  closedReason?: string;
  outcome?: string;
  onClose: (status: WhistleblowStatus, reason: string, outcome: string) => void;
}) {
  const [reason, setReason] = useState(closedReason ?? "");
  const [outcomeText, setOutcomeText] = useState(outcome ?? "");
  const [open, setOpen] = useState(false);

  const isAlreadyClosed =
    status === "RESOLVED" || status === "CLOSED" || status === "DISMISSED";

  if (isAlreadyClosed) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold">Case closed</p>
        {outcome && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Outcome</p>
            <p className="mt-0.5 text-sm">{outcome}</p>
          </div>
        )}
        {closedReason && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Closure note</p>
            <p className="mt-0.5 text-sm">{closedReason}</p>
          </div>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setOpen(true); }}
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Resolve case
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setOpen(true); }}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <X className="mr-1 h-4 w-4" />
          Dismiss case
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>Outcome (visible to whistleblower)</Label>
        <Textarea
          value={outcomeText}
          onChange={(e) => setOutcomeText(e.target.value)}
          placeholder="Describe the result of the investigation..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Internal closure note</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Internal rationale for closure..."
          rows={2}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onClose("RESOLVED", reason, outcomeText)}
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Resolve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onClose("DISMISSED", reason, outcomeText)}
        >
          <X className="mr-1 h-4 w-4" />
          Dismiss
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Main component ---

export default function WhistleblowingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [caseData, setCaseData] = useState<WhistleblowCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [isInternalMessage, setIsInternalMessage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingField, setSavingField] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [params.id]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    fetch(`/api/tenants/${session.user.tenantId}/users`)
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [session?.user?.tenantId]);

  const fetchCase = async () => {
    try {
      const response = await fetch(`/api/admin/whistleblowing/${params.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not fetch case");
      setCaseData(data.data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      router.push("/dashboard/whistleblowing");
    } finally {
      setLoading(false);
    }
  };

  const patchCase = async (payload: Record<string, unknown>) => {
    setSavingField(true);
    try {
      const response = await fetch(`/api/admin/whistleblowing/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save");
      setCaseData(data.data);
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setSavingField(false);
    }
  };

  const updateStatus = async (newStatus: WhistleblowStatus) => {
    const ok = await patchCase({ status: newStatus });
    if (ok) {
      toast({ title: "Status updated", description: `Status set to: ${newStatus}` });
    }
  };

  const updateSeverity = async (newSeverity: WhistleblowSeverity) => {
    await patchCase({ severity: newSeverity });
    toast({ title: "Severity updated" });
  };

  const updateAssignedTo = async (userId: string) => {
    const actualUserId = userId === "NONE" ? null : userId;
    const ok = await patchCase({ assignedTo: actualUserId });
    if (ok) {
      toast({
        title: actualUserId ? "Case assigned" : "Assignment removed",
        description: actualUserId
          ? "The case handler has been notified."
          : "The case no longer has an assigned handler.",
      });
    }
  };

  const saveInvestigationNotes = async (notes: string) => {
    await patchCase({ investigationNotes: notes });
    toast({ title: "Notes saved" });
  };

  const saveOutcome = async (outcome: string) => {
    await patchCase({ outcome });
    toast({ title: "Outcome saved" });
  };

  const closeCase = async (status: WhistleblowStatus, reason: string, outcome: string) => {
    await patchCase({ status, closedReason: reason, outcome });
    toast({ title: status === "DISMISSED" ? "Case dismissed" : "Case resolved" });
  };

  const parsedActions: CaseAction[] = (() => {
    if (!caseData?.actions) return [];
    try {
      return JSON.parse(caseData.actions);
    } catch {
      return [];
    }
  })();

  const saveActions = async (actions: CaseAction[]) => {
    await patchCase({ actions });
  };

  const addAction = async (description: string) => {
    const newAction: CaseAction = {
      id: `${Date.now()}`,
      description,
      createdAt: new Date().toISOString(),
    };
    const updated = [...parsedActions, newAction];
    await saveActions(updated);
    toast({ title: "Action added" });
  };

  const toggleAction = async (id: string) => {
    const updated = parsedActions.map((a) =>
      a.id === id
        ? { ...a, completedAt: a.completedAt ? undefined : new Date().toISOString() }
        : a
    );
    await saveActions(updated);
  };

  const removeAction = async (id: string) => {
    const updated = parsedActions.filter((a) => a.id !== id);
    await saveActions(updated);
    toast({ title: "Action removed" });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMessage(true);
    try {
      const response = await fetch(`/api/admin/whistleblowing/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, isInternal: isInternalMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send message");
      toast({
        title: "Message sent",
        description: isInternalMessage ? "Internal note added" : "Message sent to whistleblower",
      });
      setMessageText("");
      setIsInternalMessage(false);
      fetchCase();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading case...</p>
      </div>
    );
  }

  if (!caseData) return null;

  const daysSinceReceived = differenceInDays(new Date(), new Date(caseData.receivedAt));
  const assignedUser = users.find((u) => u.user.id === caseData.assignedTo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/whistleblowing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{caseData.title}</h1>
            <p className="text-sm text-muted-foreground">
              Case number: <span className="font-mono font-semibold">{caseData.caseNumber}</span>
              {" · "}
              Received {daysSinceReceived} {daysSinceReceived === 1 ? "day" : "days"} ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getSeverityBadge(caseData.severity)}
          {getStatusBadge(caseData.status)}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Case handling procedure (PIDA 1998) */}
          <CaseProcessCard caseData={caseData} onStatusChange={updateStatus} />

          {/* Case details */}
          <Card>
            <CardHeader>
              <CardTitle>Reported case details</CardTitle>
              <CardDescription>
                Category: {CATEGORY_LABELS[caseData.category]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-1 font-semibold">Description</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {caseData.description}
                </p>
              </div>

              {(caseData.occurredAt || caseData.location) && (
                <>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    {caseData.occurredAt && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">When</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(caseData.occurredAt), "dd MMMM yyyy HH:mm", {
                              locale: enGB,
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {caseData.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{caseData.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {caseData.involvedPersons && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-1 font-semibold">Persons involved</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {caseData.involvedPersons}
                    </p>
                  </div>
                </>
              )}

              {caseData.witnesses && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-1 font-semibold">Witnesses</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {caseData.witnesses}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Internal case handling notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal case management</CardTitle>
              <CardDescription>
                Internal notes and documentation (not visible to the whistleblower)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EditableTextField
                label="Investigation notes"
                value={caseData.investigationNotes}
                placeholder="Add notes about the investigation, findings and assessments..."
                onSave={saveInvestigationNotes}
                rows={5}
              />

              <Separator />

              <ActionsList
                actions={parsedActions}
                onAdd={addAction}
                onToggle={toggleAction}
                onRemove={removeAction}
              />

              <Separator />

              <EditableTextField
                label="Outcome (may be communicated to whistleblower)"
                value={caseData.outcome}
                placeholder="Describe the result of the investigation..."
                onSave={saveOutcome}
                rows={3}
              />

              <Separator />

              {/* Close case */}
              <div>
                <h3 className="mb-2 font-semibold">Close case</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  The whistleblower should be informed of the outcome where possible (PIDA 1998
                  best practice).
                </p>
                <CloseSection
                  status={caseData.status}
                  closedReason={caseData.closedReason}
                  outcome={caseData.outcome}
                  onClose={closeCase}
                />
              </div>
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication
              </CardTitle>
              <CardDescription>
                Messages to/from the whistleblower and internal notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {caseData.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg p-4 ${
                        message.isInternal
                          ? "border-2 border-dashed border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950"
                          : message.sender === "REPORTER"
                          ? "bg-blue-50 dark:bg-blue-950"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {message.sender === "REPORTER"
                              ? "Whistleblower"
                              : message.sender === "HANDLER"
                              ? "Case handler"
                              : "System"}
                          </Badge>
                          {message.isInternal && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-500">Internal</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "dd MMM yyyy HH:mm", {
                            locale: enGB,
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="message">New message</Label>
                <Textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a message to the whistleblower or an internal note..."
                  rows={4}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternalMessage}
                      onChange={(e) => setIsInternalMessage(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Internal note (not visible to whistleblower)
                  </label>
                  <Button onClick={sendMessage} disabled={sendingMessage || !messageText.trim()} className="w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4" />
                    {sendingMessage ? "Sending..." : isInternalMessage ? "Save note" : "Send to whistleblower"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Whistleblower */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Whistleblower
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.isAnonymous ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Anonymous disclosure</span>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {caseData.reporterName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{caseData.reporterName}</span>
                    </div>
                  )}
                  {caseData.reporterEmail && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p>{caseData.reporterEmail}</p>
                    </div>
                  )}
                  {caseData.reporterPhone && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Phone</p>
                      <p>{caseData.reporterPhone}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administration */}
          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={caseData.status}
                  onValueChange={(v) => updateStatus(v as WhistleblowStatus)}
                  disabled={savingField}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                    <SelectItem value="UNDER_INVESTIGATION">Under investigation</SelectItem>
                    <SelectItem value="ACTION_TAKEN">Action taken</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={caseData.severity}
                  onValueChange={(v) => updateSeverity(v as WhistleblowSeverity)}
                  disabled={savingField}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned case handler</Label>
                <Select
                  value={caseData.assignedTo || "NONE"}
                  onValueChange={updateAssignedTo}
                  disabled={loadingUsers || savingField}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "Loading..." : "Select case handler"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.user.id} value={u.user.id}>
                        {u.user.name || u.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedUser && (
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {assignedUser.user.name || assignedUser.user.email}
                  </p>
                )}
              </div>

              <Separator />

              {/* Timeline */}
              <div className="space-y-2 text-sm">
                <p className="font-medium text-muted-foreground">Timeline</p>

                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Received</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(caseData.receivedAt), "dd MMM yyyy HH:mm", { locale: enGB })}
                    </p>
                  </div>
                </div>

                {caseData.acknowledgedAt ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <div>
                      <p className="text-xs font-medium">Acknowledged</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(caseData.acknowledgedAt), "dd MMM yyyy HH:mm", {
                          locale: enGB,
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`h-3.5 w-3.5 ${
                        daysSinceReceived >= 5 ? "text-red-500" : "text-yellow-500"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Not yet acknowledged
                      {daysSinceReceived >= 5 && (
                        <span className="ml-1 font-medium text-red-600">(deadline approaching)</span>
                      )}
                    </p>
                  </div>
                )}

                {caseData.investigatedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                    <div>
                      <p className="text-xs font-medium">Investigation started</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(caseData.investigatedAt), "dd MMM yyyy HH:mm", {
                          locale: enGB,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {caseData.closedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <div>
                      <p className="text-xs font-medium">Closed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(caseData.closedAt), "dd MMM yyyy HH:mm", { locale: enGB })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legal reference */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Legal requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold">PIDA 1998 s.43A–L:</span> Defines protected
                disclosures and qualifying criteria.
              </p>
              <p>
                <span className="font-semibold">ERA 1996 s.47B:</span> Protection from detriment
                for making a protected disclosure.
              </p>
              <p>
                <span className="font-semibold">ERA 1996 s.103A:</span> Automatic unfair dismissal
                if reason is a protected disclosure.
              </p>
              <p>
                <span className="font-semibold">Best practice:</span> Maintain internal
                whistleblowing procedures and protect confidentiality.
              </p>
              <Separator />
              <p className="text-xs">
                Acknowledge receipt within 7 days. All handling must be documented.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
