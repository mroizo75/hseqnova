"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Zap,
  Droplet,
  Trash2,
  Wind,
  TrendingDown,
  TrendingUp,
  TreePine,
  Car,
  Home,
} from "lucide-react";
import type { EnvironmentalMeasurement, EnvironmentalAspect } from "@prisma/client";

interface CO2CalculatorCardProps {
  measurements: Array<
    EnvironmentalMeasurement & {
      aspect: Pick<EnvironmentalAspect, "category" | "title">;
    }
  >;
  companyName: string;
}

// CO2 konverteringsfaktorer (kg CO2 per enhet)
const CO2_FACTORS = {
  ENERGY: 0.385, // kg CO2 per kWh (norsk strømmiks)
  WATER: 0.001, // kg CO2 per liter
  WASTE: 0.5, // kg CO2 per kg avfall
  EMISSIONS: 1.0, // direkte CO2
  RESOURCE_USE: 0.2, // generisk ressursbruk
};

// Beregn månedlig CO2-besparelse
function calculateMonthlySavings(
  measurements: Array<
    EnvironmentalMeasurement & {
      aspect: Pick<EnvironmentalAspect, "category" | "title">;
    }
  >
): {
  totalSavings: number;
  breakdown: Record<string, number>;
  trend: "up" | "down" | "stable";
  percentageChange: number;
} {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const breakdown: Record<string, number> = {
    ENERGY: 0,
    WATER: 0,
    WASTE: 0,
    EMISSIONS: 0,
    RESOURCE_USE: 0,
  };

  let currentMonthTotal = 0;
  let lastMonthTotal = 0;

  measurements.forEach((m) => {
    const measureDate = new Date(m.measurementDate);
    const category = m.aspect.category;
    const factor = CO2_FACTORS[category as keyof typeof CO2_FACTORS] || 0;

    // Beregn besparelse (hvis targetValue er lavere enn measuredValue = positiv besparelse)
    let savingsValue = 0;
    if (m.targetValue && m.measuredValue < m.targetValue) {
      savingsValue = (m.targetValue - m.measuredValue) * factor;
    } else if (m.limitValue && m.measuredValue < m.limitValue) {
      savingsValue = (m.limitValue - m.measuredValue) * factor * 0.5;
    }

    // Akkumuler besparelse per kategori
    if (savingsValue > 0) {
      breakdown[category] = (breakdown[category] || 0) + savingsValue;

      // Akkumuler for trendberegning
      if (
        measureDate.getMonth() === currentMonth &&
        measureDate.getFullYear() === currentYear
      ) {
        currentMonthTotal += savingsValue;
      } else if (
        measureDate.getMonth() === lastMonth &&
        measureDate.getFullYear() === lastMonthYear
      ) {
        lastMonthTotal += savingsValue;
      }
    }
  });

  const totalSavings = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  let trend: "up" | "down" | "stable" = "stable";
  let percentageChange = 0;

  if (lastMonthTotal > 0) {
    percentageChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    if (percentageChange > 5) trend = "up";
    else if (percentageChange < -5) trend = "down";
  }

  return { totalSavings, breakdown, trend, percentageChange };
}

// Beregn ekvivalenter
function calculateEquivalents(co2Kg: number) {
  return {
    trees: Math.round(co2Kg / 21), // En tre absorberer ~21kg CO2/år
    cars: Math.round(co2Kg / 4600), // En bil slipper ut ~4600kg CO2/år
    homes: Math.round(co2Kg / 10000), // Ett hjem bruker ~10000kg CO2/år
    flights: Math.round(co2Kg / 250), // En flytur Oslo-Trondheim ~250kg CO2
  };
}

export function CO2CalculatorCard({ measurements, companyName }: CO2CalculatorCardProps) {
  const { totalSavings, breakdown, trend, percentageChange } = calculateMonthlySavings(measurements);
  const equivalents = calculateEquivalents(totalSavings);

  const categoryData = [
    { key: "ENERGY", label: "Energi", icon: Zap, color: "bg-yellow-500" },
    { key: "WATER", label: "Vann", icon: Droplet, color: "bg-blue-500" },
    { key: "WASTE", label: "Avfall", icon: Trash2, color: "bg-green-500" },
    { key: "EMISSIONS", label: "Utslipp", icon: Wind, color: "bg-gray-500" },
    { key: "RESOURCE_USE", label: "Ressurser", icon: Leaf, color: "bg-emerald-500" },
  ];

  const totalBreakdown = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-900">CO₂-Besparelse</CardTitle>
              <CardDescription className="text-green-700">
                {companyName}s miljøpåvirkning
              </CardDescription>
            </div>
          </div>
          {trend !== "stable" && (
            <Badge
              variant={trend === "up" ? "default" : "secondary"}
              className={trend === "up" ? "bg-green-600" : "bg-orange-500"}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(percentageChange).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total besparelse */}
        <div className="text-center p-6 bg-white rounded-lg border-2 border-green-300 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Total CO₂-besparelse (dette året)</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold text-green-600">
              {totalSavings.toFixed(0)}
            </span>
            <span className="text-xl text-green-600 font-medium">kg CO₂</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Basert på {measurements.length} målinger
          </p>
        </div>

        {/* Breakdown per kategori */}
        {totalBreakdown > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-green-900">Besparelse per kategori</p>
            {categoryData.map((cat) => {
              const value = breakdown[cat.key] || 0;
              const percentage = totalBreakdown > 0 ? (value / totalBreakdown) * 100 : 0;
              const Icon = cat.icon;

              if (value === 0) return null;

              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <span className="text-green-700 font-medium">
                      {value.toFixed(1)} kg CO₂
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        )}

        {/* Ekvivalenter */}
        {totalSavings > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TreePine className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Trær plantet</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{equivalents.trees}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tilsvarende CO₂-opptak
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Biler av veien</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{equivalents.cars || "< 1"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ett år uten kjøring
              </p>
            </div>

            {equivalents.homes > 0 && (
              <div className="p-4 bg-white rounded-lg border border-green-200 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">Husholdninger</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{equivalents.homes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Årlig strømforbruk dekket
                </p>
              </div>
            )}
          </div>
        )}

        {totalSavings === 0 && (
          <div className="text-center py-8">
            <Leaf className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Ingen CO₂-besparelser registrert ennå.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Registrer målinger med målverdier for å se besparelser.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground bg-white/50 p-3 rounded border border-green-200">
          <p className="font-medium mb-1">📊 Beregningsmetode:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Energi: {CO2_FACTORS.ENERGY} kg CO₂/kWh</li>
            <li>Vann: {CO2_FACTORS.WATER * 1000} kg CO₂/m³</li>
            <li>Avfall: {CO2_FACTORS.WASTE} kg CO₂/kg</li>
            <li>Besparelse = (Målverdi - Faktisk forbruk) × Faktor</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
