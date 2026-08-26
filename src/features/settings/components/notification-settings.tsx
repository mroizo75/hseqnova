"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Mail,
  Smartphone,
  Calendar,
  ClipboardCheck,
  AlertCircle,
  ListTodo,
  TestTube,
  BookOpen,
  GraduationCap,
  FileText,
  ShieldAlert,
  Newspaper,
} from "lucide-react";
import type { Role, User, UserTenant } from "@prisma/client";
import { updateNotificationSettings } from "@/server/actions/notification-settings.actions";

interface NotificationSettingsProps {
  user: Pick<User, "id" | "email" | "phone">;
  userTenant: UserTenant;
  tenant: {
    constructionDailyCheckAlertsEnabled: boolean;
    constructionDailyCheckAlertRole: Role;
  };
  isAdmin: boolean;
}

function reminderLabel(days: number): string {
  if (days === 0) return "on the day";
  if (days === 1) return "1 day before";
  if (days === 7) return "1 week before";
  if (days === 14) return "2 weeks before";
  return `${days} days before`;
}

export function NotificationSettings({
  user,
  userTenant,
  tenant,
  isAdmin,
}: NotificationSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [notifyByEmail, setNotifyByEmail] = useState(userTenant.notifyByEmail);
  const [notifyBySms, setNotifyBySms] = useState(userTenant.notifyBySms);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(userTenant.reminderDaysBefore);
  const [notifyMeetings, setNotifyMeetings] = useState(userTenant.notifyMeetings);
  const [notifyInspections, setNotifyInspections] = useState(userTenant.notifyInspections);
  const [notifyAudits, setNotifyAudits] = useState(userTenant.notifyAudits);
  const [notifyMeasures, setNotifyMeasures] = useState(userTenant.notifyMeasures);
  const [notifyIncidents, setNotifyIncidents] = useState(userTenant.notifyIncidents);
  const [notifyDocuments, setNotifyDocuments] = useState(userTenant.notifyDocuments);
  const [notifyTraining, setNotifyTraining] = useState(userTenant.notifyTraining);
  const [notifyRisks, setNotifyRisks] = useState(userTenant.notifyRisks);
  const [dailyDigest, setDailyDigest] = useState(userTenant.dailyDigest);
  const [weeklyDigest, setWeeklyDigest] = useState(userTenant.weeklyDigest);
  const [constructionDailyCheckAlertsEnabled, setConstructionDailyCheckAlertsEnabled] = useState(
    tenant.constructionDailyCheckAlertsEnabled
  );
  const [constructionDailyCheckAlertRole, setConstructionDailyCheckAlertRole] = useState<Role>(
    tenant.constructionDailyCheckAlertRole
  );

  const hasPhoneNumber = Boolean(userTenant.phone || user.phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (notifyBySms && !hasPhoneNumber) {
      toast({
        variant: "destructive",
        title: "Telephone number required",
        description: "Add a number on your profile before turning on text messages.",
      });
      setLoading(false);
      return;
    }

    const result = await updateNotificationSettings({
      notifyByEmail,
      notifyBySms,
      reminderDaysBefore,
      notifyMeetings,
      notifyInspections,
      notifyAudits,
      notifyMeasures,
      notifyIncidents,
      notifyDocuments,
      notifyTraining,
      notifyRisks,
      dailyDigest,
      weeklyDigest,
      constructionDailyCheckAlertsEnabled,
      constructionDailyCheckAlertRole,
    });

    if (result.success) {
      toast({
        title: "Notifications saved",
        description: "Your choices apply to this company.",
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not save notification settings",
      });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                How and when HSEQ Nova contacts you. Accident book and RIDDOR items can be sent
                immediately; other reminders follow the lead time below.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>CDM site daily check (company)</CardTitle>
            <CardDescription>
              CDM 2015: remind the chosen role when a site has people on it but no daily check has
              been recorded that day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="constructionDailyCheckAlertsEnabled">
                  Send the daily site check reminder
                </Label>
                <p className="text-sm text-muted-foreground">
                  Applies to construction projects with people currently on site.
                </p>
              </div>
              <Switch
                id="constructionDailyCheckAlertsEnabled"
                checked={constructionDailyCheckAlertsEnabled}
                onCheckedChange={setConstructionDailyCheckAlertsEnabled}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constructionDailyCheckAlertRole">Role to notify</Label>
              <Select
                value={constructionDailyCheckAlertRole}
                onValueChange={(value) => setConstructionDailyCheckAlertRole(value as Role)}
                disabled={loading}
              >
                <SelectTrigger id="constructionDailyCheckAlertRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HMS">HSE manager</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="LEDER">Line manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Email is the default. Text messages are for urgent items only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="notifyByEmail">Email</Label>
                <p className="text-sm text-muted-foreground">Send to {user.email}</p>
              </div>
            </div>
            <Switch
              id="notifyByEmail"
              checked={notifyByEmail}
              onCheckedChange={setNotifyByEmail}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="notifyBySms">Text message (SMS)</Label>
                <p className="text-sm text-muted-foreground">
                  {hasPhoneNumber
                    ? `Send to ${userTenant.phone || user.phone}`
                    : "Add a telephone number on your profile first"}
                </p>
                {notifyBySms && !hasPhoneNumber && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    A telephone number is required
                  </p>
                )}
              </div>
            </div>
            <Switch
              id="notifyBySms"
              checked={notifyBySms}
              onCheckedChange={setNotifyBySms}
              disabled={loading || !hasPhoneNumber}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="reminderDaysBefore">Reminder lead time</Label>
            <Select
              value={reminderDaysBefore.toString()}
              onValueChange={(value) => setReminderDaysBefore(parseInt(value, 10))}
              disabled={loading}
            >
              <SelectTrigger id="reminderDaysBefore">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">On the day</SelectItem>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
                <SelectItem value="14">2 weeks before</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Scheduled items (inspections, meetings, training expiry) are sent {reminderLabel(reminderDaysBefore)}.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What to notify me about</CardTitle>
          <CardDescription>
            Unticked topics are not emailed or texted. In-app notifications still appear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TopicSwitch
            id="notifyIncidents"
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
            label="Accident book"
            description="New injuries, near misses, RIDDOR-reportable events and overdue investigations. Social Security (Claims and Payments) Regulations 1979; RIDDOR 2013."
            checked={notifyIncidents}
            onCheckedChange={setNotifyIncidents}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyInspections"
            icon={<ClipboardCheck className="h-5 w-5 text-green-600" />}
            label="Workplace inspections and fire drills"
            description="Scheduled inspections, overdue findings and fire drill reminders. MHSWR 1999; Fire Safety Order 2005."
            checked={notifyInspections}
            onCheckedChange={setNotifyInspections}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyTraining"
            icon={<GraduationCap className="h-5 w-5 text-indigo-600" />}
            label="Training and competence"
            description="Assigned training, certificates due to expire, and expired competence. HSWA s.2(2)(c)."
            checked={notifyTraining}
            onCheckedChange={setNotifyTraining}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyMeasures"
            icon={<ListTodo className="h-5 w-5 text-orange-600" />}
            label="Actions"
            description="Actions assigned to you, due soon, or overdue."
            checked={notifyMeasures}
            onCheckedChange={setNotifyMeasures}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyRisks"
            icon={<ShieldAlert className="h-5 w-5 text-amber-600" />}
            label="Risk assessments and COSHH"
            description="Risk review due, high residual risk, COSHH SDS review and expired assessments. MHSWR 1999; COSHH 2002."
            checked={notifyRisks}
            onCheckedChange={setNotifyRisks}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyDocuments"
            icon={<FileText className="h-5 w-5 text-slate-600" />}
            label="Documents and procedures"
            description="Review due, expired controlled documents, procedure assignments, and legal-register alerts."
            checked={notifyDocuments}
            onCheckedChange={setNotifyDocuments}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyMeetings"
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            label="Consultation meetings"
            description="Safety committee, management review and other scheduled meetings. SRSCWR 1977 / HSCER 1996."
            checked={notifyMeetings}
            onCheckedChange={setNotifyMeetings}
            disabled={loading}
          />
          <TopicSwitch
            id="notifyAudits"
            icon={<BookOpen className="h-5 w-5 text-purple-600" />}
            label="Audits"
            description="Scheduled audits, reminders and open findings. ISO 45001."
            checked={notifyAudits}
            onCheckedChange={setNotifyAudits}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email digest</CardTitle>
          <CardDescription>
            A summary in addition to immediate emails for urgent accident-book and whistleblowing items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="dailyDigest">Daily digest</Label>
                <p className="text-sm text-muted-foreground">One email each working day with open items.</p>
              </div>
            </div>
            <Switch
              id="dailyDigest"
              checked={dailyDigest}
              onCheckedChange={setDailyDigest}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="weeklyDigest">Weekly digest</Label>
                <p className="text-sm text-muted-foreground">Monday summary of the week ahead.</p>
              </div>
            </div>
            <Switch
              id="weeklyDigest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {notifyBySms && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900">About text messages</p>
                <ul className="list-disc space-y-1 pl-4 text-blue-800">
                  <li>Sent only for urgent items: new accident book entries, overdue actions, expired training, whistleblowing.</li>
                  <li>Email is still sent for those items when email is on.</li>
                  <li>UK GDPR / DPA 2018: the number is used only to send these operational alerts.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Link href="/dashboard/settings/test-notifications">
          <Button type="button" variant="outline" className="bg-transparent">
            <TestTube className="mr-2 h-4 w-4" />
            Send a test email
          </Button>
        </Link>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save notifications"}
        </Button>
      </div>
    </form>
  );
}

function TopicSwitch({
  id,
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="space-y-0.5">
          <Label htmlFor={id}>{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
