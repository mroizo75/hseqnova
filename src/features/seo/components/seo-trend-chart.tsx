"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/server/queries/seo-dashboard.queries";

type SeoTrendChartProps = {
  points: TrendPoint[];
};

const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function formatDay(isoDate: string): string {
  return dayFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

export function SeoTrendChart({ points }: SeoTrendChartProps) {
  if (points.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No search data for this period yet.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis yAxisId="clicks" tick={{ fontSize: 12 }} width={40} allowDecimals={false} />
          <YAxis yAxisId="impressions" orientation="right" tick={{ fontSize: 12 }} width={48} allowDecimals={false} />
          <Tooltip labelFormatter={(value) => formatDay(String(value))} />
          <Legend />
          <Line yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line
            yAxisId="impressions"
            type="monotone"
            dataKey="impressions"
            name="Impressions"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
