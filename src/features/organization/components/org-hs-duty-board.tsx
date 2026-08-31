import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { dutyLabel } from "@/lib/org-chart-duties";
import type { OrgChartTreeNode } from "@/features/organization/lib/org-chart-tree";

export function OrgHsDutyBoard({ nodes }: { nodes: OrgChartTreeNode[] }) {
  const namedDuties = nodes.filter((node) => node.hsDutyKey && node.name?.trim());
  const unnamedDuties = nodes.filter((node) => node.hsDutyKey && !node.name?.trim());

  if (namedDuties.length === 0 && unnamedDuties.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Your employer has not yet named who does what for health and safety. Under HSWA 1974 s.2(3)
          the written policy must set out organisation — names, positions and roles.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Who does what
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Names, positions and roles for health and safety (HSWA 1974 s.2(3); MHSWR 1999
          reg.7). This is Part 2 of the written policy. The competent person is the named
          appointment — not a login role.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {namedDuties.map((node) => (
          <div key={node.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{node.name}</p>
              {dutyLabel(node.hsDutyKey) ? (
                <Badge variant="outline" className="font-normal">
                  {dutyLabel(node.hsDutyKey)}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{node.title}</p>
            {node.hsDuty ? <p className="mt-1 text-sm">{node.hsDuty}</p> : null}
          </div>
        ))}
        {unnamedDuties.length > 0 ? (
          <p className="text-xs text-amber-800">
            Some health and safety roles are on the chart but have no name yet. Ask your competent
            person who holds them.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
