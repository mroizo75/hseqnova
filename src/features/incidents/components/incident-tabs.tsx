"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentList } from "./incident-list";
import { getMainCategory } from "@/features/incidents/schemas/incident.schema";
import type { Incident, Measure } from "@prisma/client";

type IncidentWithRelations = Incident & {
  measures: Measure[];
  risk?: { id: string; title: string; category: string | null } | null;
};

interface IncidentTabsProps {
  incidents: IncidentWithRelations[];
}

export function IncidentTabs({ incidents }: IncidentTabsProps) {
  const [tab, setTab] = useState<"ALL" | "ACCIDENT_BOOK" | "OTHER">("ALL");

  const { accidentBook, otherRecords } = useMemo(() => {
    const accident: IncidentWithRelations[] = [];
    const other: IncidentWithRelations[] = [];
    for (const incident of incidents) {
      if (getMainCategory(incident.type) === "RUH") {
        accident.push(incident);
      } else {
        other.push(incident);
      }
    }
    return { accidentBook: accident, otherRecords: other };
  }, [incidents]);

  const displayedIncidents =
    tab === "ACCIDENT_BOOK"
      ? accidentBook
      : tab === "OTHER"
        ? otherRecords
        : incidents;

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
      <TabsList>
        <TabsTrigger value="ALL">All ({incidents.length})</TabsTrigger>
        <TabsTrigger value="ACCIDENT_BOOK" className="gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          Accident book ({accidentBook.length})
        </TabsTrigger>
        <TabsTrigger value="OTHER" className="gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Other records ({otherRecords.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value={tab} className="mt-4">
        <IncidentList incidents={displayedIncidents} />
      </TabsContent>
    </Tabs>
  );
}
