"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  ClipboardCheck,
  AlertCircle,
  ListTodo,
  Mail,
  CheckCircle2,
  Loader2,
  Bell,
  Target,
  FileBarChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailTestPanelProps {
  currentUser: {
    id: string;
    email: string;
    name: string | null;
    notifyByEmail: boolean;
  };
  tenantUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    notifyByEmail: boolean;
    notifyBySms: boolean;
    phone: string | null;
  }>;
  tenantId: string;
  tenantName: string;
}

type NotificationType =
  | "meeting"
  | "inspection"
  | "audit"
  | "measure"
  | "incident"
  | "training"
  | "document"
  | "management-review";

const notificationTypes: Array<{
  value: NotificationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "meeting",
    label: "Consultation meeting",
    description: "Reminder for a scheduled safety or management meeting",
    icon: Calendar,
  },
  {
    value: "inspection",
    label: "Workplace inspection",
    description: "Reminder for a planned inspection or fire drill",
    icon: ClipboardCheck,
  },
  {
    value: "audit",
    label: "Audit",
    description: "Reminder for a scheduled internal or external audit",
    icon: Target,
  },
  {
    value: "measure",
    label: "Action due",
    description: "Reminder for actions approaching their due date",
    icon: ListTodo,
  },
  {
    value: "incident",
    label: "Accident book",
    description: "New injury, near miss or RIDDOR-reportable event",
    icon: AlertCircle,
  },
  {
    value: "training",
    label: "Training",
    description: "Certificate or course due to expire",
    icon: Target,
  },
  {
    value: "document",
    label: "Document review",
    description: "Controlled document waiting for review or approval",
    icon: FileBarChart,
  },
  {
    value: "management-review",
    label: "Management review",
    description: "Reminder for a planned management review (ISO 45001)",
    icon: FileBarChart,
  },
];

export function EmailTestPanel({
  currentUser,
  tenantUsers,
  tenantId,
  tenantName,
}: EmailTestPanelProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<NotificationType>("meeting");
  const [selectedUser, setSelectedUser] = useState<string>(currentUser.id);
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState<{ type: string; email: string; time: Date } | null>(
    null
  );

  const selectedNotification = notificationTypes.find((n) => n.value === selectedType);
  const selectedUserData = tenantUsers.find((u) => u.id === selectedUser);

  const handleSendTest = async () => {
    if (!selectedUserData) {
      toast({
        title: "No recipient",
        description: "Choose a person to send the test to",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUserData.notifyByEmail) {
      toast({
        title: "Email is off",
        description: `${selectedUserData.name || selectedUserData.email} has turned off email notifications`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          userId: selectedUser,
          tenantId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Test email sent",
          description: `${selectedNotification?.label} sent to ${selectedUserData.email}`,
          className: "bg-green-50 border-green-200",
        });
        setLastSent({
          type: selectedNotification?.label || "",
          email: selectedUserData.email,
          time: new Date(),
        });
      } else {
        toast({
          title: "Could not send",
          description: result.error || "Could not send the test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      toast({
        title: "Could not send",
        description: "Could not send the test email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const Icon = selectedNotification?.icon || Bell;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Send a test email</CardTitle>
              <CardDescription>
                Choose a type and a recipient to confirm the mail server is working
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type velger */}
          <div className="space-y-2">
            <Label>Notification type</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedNotification && (
              <p className="text-sm text-muted-foreground">{selectedNotification.description}</p>
            )}
          </div>

          {/* Mottaker */}
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tenantUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.name || user.email}</span>
                      {user.notifyByEmail && (
                        <Badge variant="outline" className="text-xs">
                          ✓ Email on
                        </Badge>
                      )}
                      {!user.notifyByEmail && (
                        <Badge variant="destructive" className="text-xs">
                          Email off
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserData && (
              <p className="text-sm text-muted-foreground">
                Email will be sent to: <code className="bg-muted px-1 py-0.5 rounded">{selectedUserData.email}</code>
              </p>
            )}
          </div>

          {/* Forhåndsvisning */}
          {selectedNotification && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Subject:</span>{" "}
                  <span className="text-muted-foreground">
                    {getEmailSubject(selectedType, tenantName)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Body:</span>{" "}
                  <span className="text-muted-foreground">
                    {getEmailPreview(selectedType, tenantName)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send knapp */}
          <Button onClick={handleSendTest} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send test email
              </>
            )}
          </Button>

          {/* Siste sending */}
          {lastSent && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Last sent</p>
                <p className="text-green-700">
                  {lastSent.type} to {lastSent.email}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  {lastSent.time.toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brukeroversikt */}
      <Card>
        <CardHeader>
          <CardTitle>People with email</CardTitle>
          <CardDescription>
            Who currently has email notifications on for this company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tenantUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  {user.notifyByEmail && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                  )}
                  {user.notifyBySms && user.phone && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      SMS
                    </Badge>
                  )}
                  {!user.notifyByEmail && !user.notifyBySms && (
                    <Badge variant="outline" className="text-muted-foreground">
                      None
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getEmailSubject(type: NotificationType, tenantName: string): string {
  switch (type) {
    case "meeting":
      return `Reminder: meeting tomorrow — ${tenantName}`;
    case "inspection":
      return `Reminder: workplace inspection — ${tenantName}`;
    case "audit":
      return `Reminder: audit scheduled — ${tenantName}`;
    case "measure":
      return `Reminder: action due soon — ${tenantName}`;
    case "incident":
      return `New accident book entry — ${tenantName}`;
    case "training":
      return `Reminder: training expiry — ${tenantName}`;
    case "document":
      return `Document waiting for approval — ${tenantName}`;
    case "management-review":
      return `Reminder: management review — ${tenantName}`;
    default:
      return `Notification from ${tenantName}`;
  }
}

function getEmailPreview(type: NotificationType, tenantName: string): string {
  switch (type) {
    case "meeting":
      return "You have a meeting tomorrow at 10:00. Review the agenda beforehand.";
    case "inspection":
      return "A workplace inspection is planned for tomorrow. Please have the area ready.";
    case "audit":
      return "An audit is scheduled next week. Check that controlled documents are current.";
    case "measure":
      return "You have 3 actions due in the next 7 days. Sign in to see the list.";
    case "incident":
      return "A new accident book entry needs follow-up. Sign in to review it.";
    case "training":
      return "Your first-aid certificate expires in 30 days. Arrange a refresher.";
    case "document":
      return "One or more documents are waiting for approval.";
    case "management-review":
      return "Management review is due. Prepare the report and figures.";
    default:
      return `You have a new notification from ${tenantName}.`;
  }
}
