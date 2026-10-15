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
import { enGB } from "date-fns/locale/en-GB";

const relationLabels: Record<RiskAuditRelation, string> = {
  CONTROL_TEST: "Control test",
  FOLLOW_UP: "Follow-up",
  OBSERVATION: "Observation",
  OTHER: "Other",
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
          title: "Could not link",
          description: result.error || "The audit could not be linked.",
        });
      } else {
        toast({
          title: "Audit linked",
          description: "The audit is now linked to this risk.",
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
          title: "Could not remove",
          description: result.error || "The link could not be removed.",
        });
      } else {
        toast({
          title: "Link removed",
          description: "The audit is no longer linked to this risk.",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Audit</Label>
          <Select
            value={selectedAudit}
            onValueChange={setSelectedAudit}
            disabled={isPending || audits.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={audits.length ? "Select an audit" : "No audits"} />
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
          <Label>Relationship</Label>
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
          <Label>Summary</Label>
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Short finding or observation"
            disabled={isPending}
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={isPending || !selectedAudit}>
            {isPending ? "Linking..." : "Link audit"}
          </Button>
        </div>
      </form>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audits are linked to this risk.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                          {format(link.audit.scheduledDate, "dd. MMM yyyy", { locale: enGB })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{link.audit.status}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{relationLabels[link.relation]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {link.summary ? link.summary : <span className="text-xs text-muted-foreground">None</span>}
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

