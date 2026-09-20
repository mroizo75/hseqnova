import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Headphones,
  PoundSterling,
  Shield,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatGbp } from "@/features/crm/lib/labels";
import { SUPPORT_STATUS_LABELS } from "@/features/support/lib/labels";
import { formatDemoRange } from "@/lib/demo-booking";
import {
  greetingForHour,
  londonHour,
  organisationInitials,
  organisationLiveMix,
  type AttentionItem,
} from "@/lib/admin-dashboard";
import type { AdminCommandCentre } from "@/server/queries/admin.queries";
import { cn } from "@/lib/utils";

type Props = {
  data: AdminCommandCentre;
  operatorName: string | null;
  includeCommercial: boolean;
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  TRIAL: "bg-amber-50 text-amber-800 border-amber-200",
  SUSPENDED: "bg-red-50 text-red-800 border-red-200",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const ATTENTION_TONE: Record<AttentionItem["severity"], string> = {
  critical: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-300/70 bg-amber-50/80",
  info: "border-border bg-card",
};

export function AdminCommandCentre({ data, operatorName, includeCommercial }: Props) {
  const mix = organisationLiveMix(data.counts);
  const firstName = operatorName?.trim().split(/\s+/)[0] ?? null;
  const greeting = `${greetingForHour(londonHour())}${firstName ? `, ${firstName}` : ""}`;
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Command centre
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {today} · Europe/London. What needs a decision today, not a vanity metric.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {includeCommercial && (
            <Button asChild>
              <Link href="/admin/crm/companies/new">
                <UserPlus className="h-4 w-4" />
                Add company
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/admin/tenants">Organisations</Link>
          </Button>
        </div>
      </div>

      {data.attention.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.attention.map((item) => (
            <Link key={item.id} href={item.href} className="group">
              <Card className={cn("h-full transition-colors group-hover:border-primary/40", ATTENTION_TONE[item.severity])}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-semibold leading-snug">{item.title}</CardTitle>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Live organisations"
          value={String(data.liveOrganisations)}
          hint={`${data.counts.active} active · ${data.counts.trial} trial`}
          icon={Building2}
          href="/admin/tenants"
        />
        {includeCommercial ? (
          <MetricCard
            label="Monthly recurring"
            value={formatGbp(data.monthlyRecurringGbp)}
            hint="Active and trial subscriptions"
            icon={PoundSterling}
            href="/admin/invoices"
          />
        ) : (
          <MetricCard
            label="People on the platform"
            value={String(data.totalUsers)}
            hint="User accounts across all organisations"
            icon={Users}
            href="/admin/tenants"
          />
        )}
        <MetricCard
          label="Support queue"
          value={String(data.openSupportCount)}
          hint="Open, in progress, or waiting"
          icon={Headphones}
          href="/admin/support"
          alert={data.openSupportCount > 0}
        />
        {includeCommercial ? (
          <MetricCard
            label="Overdue invoices"
            value={data.overdueInvoiceCount === 0 ? "None" : formatGbp(data.overdueInvoiceGbp)}
            hint={
              data.overdueInvoiceCount === 0
                ? "Collections are clear"
                : `${data.overdueInvoiceCount} invoice${data.overdueInvoiceCount === 1 ? "" : "s"} past due`
            }
            icon={AlertTriangle}
            href="/admin/invoices"
            alert={data.overdueInvoiceCount > 0}
          />
        ) : (
          <MetricCard
            label="Registrations"
            value={String(data.pendingRegistrations)}
            hint="Onboarding not finished"
            icon={ClipboardList}
            href="/admin/registrations"
            alert={data.pendingRegistrations > 0}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Recent organisations</CardTitle>
              <CardDescription>Newest tenants on the platform</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/tenants">
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentOrganisations.length === 0 ? (
              <EmptyRow text="No organisations yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Industry</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrganisations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <Link href={`/admin/tenants/${org.id}`} className="flex items-center gap-3 hover:underline">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                              {organisationInitials(org.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{org.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[org.status] ?? ""}>
                          {org.status.charAt(0) + org.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {org.industry || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(org.createdAt, "d MMM yyyy", { locale: enGB })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisation mix</CardTitle>
            <CardDescription>Live book versus trial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="bg-primary" style={{ width: `${mix.activeShare}%` }} />
              <div className="bg-amber-400" style={{ width: `${mix.trialShare}%` }} />
            </div>
            <MixRow label="Active" value={data.counts.active} tone="bg-primary" />
            <MixRow label="Trial" value={data.counts.trial} tone="bg-amber-400" />
            <MixRow label="Suspended" value={data.counts.suspended} tone="bg-destructive" />
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Incidents (30 days)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{data.incidentsThisMonth}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Open actions</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{data.openActions}</p>
              </div>
            </div>
            {includeCommercial && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm">Open pipeline</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatGbp(data.pipelineValueGbp)}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.openDealCount} live deal{data.openDealCount === 1 ? "" : "s"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Support inbox</CardTitle>
              <CardDescription>Latest tickets still open</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/support">
                Inbox
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.tickets.length === 0 ? (
              <EmptyRow text="Inbox is clear." />
            ) : (
              data.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/support/${ticket.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ticket.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ticket.ticketNumber} · {ticket.organisationName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant="outline" className="font-normal">
                      {SUPPORT_STATUS_LABELS[ticket.status as keyof typeof SUPPORT_STATUS_LABELS] ?? ticket.status}
                    </Badge>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(ticket.lastMessageAt, { addSuffix: true, locale: enGB })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{includeCommercial ? "Diary" : "Trials ending"}</CardTitle>
            <CardDescription>
              {includeCommercial ? "Upcoming demos and trials due to lapse" : "Trials due to lapse within 14 days"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {includeCommercial && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Demos</p>
                {data.upcomingDemos.length === 0 ? (
                  <EmptyRow text="No demos booked ahead." />
                ) : (
                  data.upcomingDemos.map((demo) => (
                    <Link
                      key={demo.id}
                      href="/admin/crm/demos"
                      className="block rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <p className="text-sm font-medium">{demo.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {demo.name} · {formatDemoRange(demo.startAt, demo.endAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            )}
            <div className="space-y-2">
              {includeCommercial && (
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trials</p>
              )}
              {data.trialsEnding.length === 0 ? (
                <EmptyRow text="No trials ending in the next fortnight." />
              ) : (
                data.trialsEnding.map((trial) => (
                  <Link
                    key={trial.id}
                    href={`/admin/tenants/${trial.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span className="truncate text-sm font-medium">{trial.name}</span>
                    <span className="shrink-0 text-xs text-amber-800">
                      {trial.daysLeft === 0 ? "Ends today" : `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left`}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shortcuts</CardTitle>
          <CardDescription>The queues you open most often</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Shortcut href="/admin/support" icon={Headphones} label="Support inbox" hint={`${data.openSupportCount} open`} />
          <Shortcut href="/admin/registrations" icon={ClipboardList} label="Registrations" hint={`${data.pendingRegistrations} pending`} />
          <Shortcut href="/admin/tenants" icon={Building2} label="Organisations" hint={`${data.liveOrganisations} live`} />
          {includeCommercial ? (
            <Shortcut href="/admin/crm" icon={Shield} label="Sales CRM" hint={formatGbp(data.pipelineValueGbp)} />
          ) : (
            <Shortcut href="/admin/tenants" icon={CheckCircle2} label="Open actions" hint={`${data.openActions} across tenants`} />
          )}
          {includeCommercial && (
            <Shortcut href="/admin/crm/demos" icon={CalendarDays} label="Demos" hint={`${data.upcomingDemos.length} upcoming`} />
          )}
          {includeCommercial && (
            <Shortcut href="/admin/users" icon={Users} label="Users" hint={`${data.totalUsers} accounts`} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  alert = false,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              alert ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function MixRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", tone)} />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Shortcut({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
