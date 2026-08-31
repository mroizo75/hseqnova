"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Users, AlertTriangle, CalendarCheck } from "lucide-react";
import { OVERSIKTSLISTE_RETENTION_MONTHS } from "@/features/hms-tavle/lib/oversiktsliste-config";

interface CheckinRad {
  id: string;
  name: string;
  employer: string | null;
  employerOrgNr: string | null;
  hmsCardNr: string | null;
  birthDate: string | null;
  phone: string | null;
  checkedInAt: string;
  checkedOutAt: string | null;
  date: string;
}

interface SiteInfo {
  siteName: string;
  siteAddress: string | null;
  clientName: string | null;
}

interface Props {
  tavleId: string;
  hasCheckin: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function lastMonthIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 10);
}

function formatTime(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function TavleOversiktslistePane({ tavleId, hasCheckin }: Props) {
  const [from, setFrom] = useState(lastMonthIso());
  const [to, setTo] = useState(todayIso());
  const [rader, setRader] = useState<CheckinRad[]>([]);
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [laster, setLaster] = useState(false);

  const hentListe = useCallback(async () => {
    setLaster(true);
    try {
      const res = await fetch(
        `/api/hms-tavle/${tavleId}/oversiktsliste?from=${from}&to=${to}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load the site register");
      setRader(json.data?.checkins ?? []);
      setSite(json.data?.site ?? null);
      setTruncated(Boolean(json.data?.truncated));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not load the site register");
    } finally {
      setLaster(false);
    }
  }, [tavleId, from, to]);

  useEffect(() => {
    if (hasCheckin) void hentListe();
  }, [hasCheckin, hentListe]);

  function lastNedCsv() {
    window.location.href = `/api/hms-tavle/${tavleId}/oversiktsliste?from=${from}&to=${to}&format=csv`;
  }

  if (!hasCheckin) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            QR check-in requires the Standard plan or higher.
          </p>
        </CardContent>
      </Card>
    );
  }

  const manglerFelter = rader.filter(
    (rad) => !rad.birthDate || !rad.employerOrgNr || !rad.hmsCardNr
  ).length;

  const dagerIListen = new Set(rader.map((rad) => rad.date)).size;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Site register</h3>
        <p className="text-sm text-muted-foreground">
          Operational attendance record — not a CDM 2015 duty. Keep it for
          {" "}{OVERSIKTSLISTE_RETENTION_MONTHS} months after work ends (UK GDPR storage
          limitation).
        </p>
      </div>

      {site && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Site details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Site</p>
              <p className="font-medium break-words">{site.siteName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className={site.siteAddress ? "font-medium break-words" : "text-orange-600"}>
                {site.siteAddress ?? "Missing — add it in Settings"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className={site.clientName ? "font-medium break-words" : "text-orange-600"}>
                {site.clientName ?? "Missing — add it in Settings"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="oversiktsliste-fra">From</Label>
              <Input
                id="oversiktsliste-fra"
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oversiktsliste-til">To</Label>
              <Input
                id="oversiktsliste-til"
                type="date"
                value={to}
                min={from}
                max={todayIso()}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="bg-transparent" onClick={hentListe} disabled={laster}>
                {laster ? "Loading…" : "Refresh"}
              </Button>
              <Button onClick={lastNedCsv} disabled={rader.length === 0}>
                <Download className="h-4 w-4 mr-1.5" />
                Download CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              {rader.length} record(s) over {dagerIListen} day(s)
            </span>
            {manglerFelter > 0 && (
              <span className="inline-flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {manglerFelter} row(s) missing date of birth, company number or competence card
              </span>
            )}
            {truncated && (
              <span className="text-orange-600">
                Showing the newest rows. Narrow the dates for the full list.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {rader.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No check-ins in this period.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Date</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Name</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Date of birth</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Employer</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Company number</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Competence card</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">In</th>
                    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {rader.map((rad) => (
                    <tr key={rad.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{rad.date}</td>
                      <td className="px-3 py-2">{rad.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rad.birthDate ?? <span className="text-orange-600">Missing</span>}
                      </td>
                      <td className="px-3 py-2">{rad.employer ?? "–"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rad.employerOrgNr ?? <span className="text-orange-600">Missing</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rad.hmsCardNr ?? <span className="text-orange-600">Missing</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatTime(rad.checkedInAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rad.checkedOutAt ? (
                          formatTime(rad.checkedOutAt)
                        ) : rad.date === todayIso() ? (
                          <Badge variant="secondary" className="text-[10px]">
                            On site
                          </Badge>
                        ) : (
                          "–"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
