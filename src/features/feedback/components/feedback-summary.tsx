"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ThumbsUp, ClipboardList, Users } from "lucide-react";

interface FeedbackSummaryProps {
  total: number;
  positiveCount: number;
  averageRating: number | null;
  followUpCount: number;
  sharedCount: number;
}

export function FeedbackSummary({
  total,
  positiveCount,
  averageRating,
  followUpCount,
  sharedCount,
}: FeedbackSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Registrerte</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            Tilbakemeldinger registrert siste periode
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Positiv andel</CardTitle>
          <ThumbsUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {total > 0 ? Math.round((positiveCount / total) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            {positiveCount} av {total} er positive
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Snittscore</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageRating ? averageRating.toFixed(1) : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Gjennomsnittlig vurdering (1-5)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Under oppfølging</CardTitle>
          <Users className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{followUpCount}</div>
          <p className="text-xs text-muted-foreground">
            {sharedCount} delt med organisasjonen
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

