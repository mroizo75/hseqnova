"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { linkAuditToRisk, unlinkAuditFromRisk } from "@/server/actions/risk-register.actions";
import { useToast } from "@/hooks/use-toast";
import type { RiskAuditLink, RiskAuditRelation } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const relationLabels: Record<RiskAuditRelation, string> = {
  CONTROL_TEST: "Kontrolltest",
  FOLLOW_UP: "Oppfølging",
  OBSERVATION: "Observasjon",
  OTHER: "Annet",
};

interface RiskAuditLinksProps {
  riskId: string;
  audits: Array<{ id: string; title: string; scheduledDate: Date | null; status: string }>;
  links: Array<
    RiskAuditLink & {
      audit: { id: string; title: string; scheduledDate: Date | null; status: string };
    }
  >;
}

export function RiskAuditLinks({ riskId, audits, links }: RiskAuditLinksProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedAudit, setSelectedAudit] = useState<string>(audits[0]?.id ?? "");
  const [relation, setRelation] = useState<RiskAuditRelation>("CONTROL_TEST");
  const [summary, setSummary] = useState("");

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAudit) return;

    startTransition(async () => {
      const result = await linkAuditToRisk({
        riskId,
        auditId: selectedAudit,
        relation,
        summary,
      });

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result.error || "Kunne ikke koble revisjon",
        });
      } else {
        toast({
          title: "Revisjon koblet",
          description: "Revisjonen er nå knyttet til risikoregisteret",
        });
        setSummary("");
      }
    });
  };

  const handleRemove = (linkId: string) => {
    startTransition(async () => {
      const result = await unlinkAuditFromRisk(linkId);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result.error || "Kunne ikke fjerne kobling",
        });
      } else {
        toast({
          title: "Kobling fjernet",
          description: "Revisjonen er fjernet fra denne risikoen",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Revisjon</Label>
          <Select
            value={selectedAudit}
            onValueChange={setSelectedAudit}
            disabled={isPending || audits.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={audits.length ? "Velg revisjon" : "Ingen revisjoner"} />
            </SelectTrigger>
            <SelectContent>
              {audits.map((audit) => (
                <SelectItem key={audit.id} value={audit.id}>
                  {audit.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Relasjon</Label>
          <Select value={relation} onValueChange={(value: RiskAuditRelation) => setRelation(value)} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(relationLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Oppsummering</Label>
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Kort funn/observasjon"
            disabled={isPending}
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={isPending || !selectedAudit}>
            {isPending ? "Kobler..." : "Koble revisjon"}
          </Button>
        </div>
      </form>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen revisjoner er koblet til denne risikoen.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Revisjon</TableHead>
                <TableHead>Relasjon</TableHead>
                <TableHead>Oppsummering</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{link.audit.title}</p>
                      {link.audit.scheduledDate && (
                        <p className="text-xs text-muted-foreground">
                          {format(link.audit.scheduledDate, "dd. MMM yyyy", { locale: nb })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{link.audit.status}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{relationLabels[link.relation]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {link.summary ? link.summary : <span className="text-xs text-muted-foreground">Ingen</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(link.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

