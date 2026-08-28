import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/weather?q=Oslo&days=3
 *
 * Proxyer:
 *  1. Nominatim (OpenStreetMap) for geocoding — ingen API-nøkkel
 *  2. MET Norway Locationforecast 2.0 — ingen API-nøkkel, krever User-Agent
 *
 * Returnerer: { current, forecast: [{ date, symbolCode, tempMin, tempMax, precipitation }] }
 */

const APP_UA = "HSEQ-Nova-Digital-Board/1.0 (support@hseqnova.co.uk)";
const GEO_URL = "https://nominatim.openstreetmap.org/search";
const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact";

export const revalidate = 1800; // 30 min cache

const SYMBOL_EMOJI: Record<string, string> = {
  clearsky_day: "☀️", clearsky_night: "🌙", clearsky_polartwilight: "☀️",
  fair_day: "🌤️", fair_night: "🌙", fair_polartwilight: "🌤️",
  partlycloudy_day: "⛅", partlycloudy_night: "🌥️",
  cloudy: "☁️",
  rainshowers_day: "🌦️", rainshowers_night: "🌦️",
  rainshowersandthunder_day: "⛈️",
  sleetshowers_day: "🌨️", sleetshowersandthunder_day: "⛈️",
  snowshowers_day: "❄️", snowshowersandthunder_day: "⛈️",
  rain: "🌧️", rainandthunder: "⛈️",
  sleet: "🌨️", sleetandthunder: "⛈️",
  snow: "❄️", snowandthunder: "⛈️",
  fog: "🌫️",
  lightrainshowers_day: "🌦️", lightrainshowers_night: "🌦️",
  lightrain: "🌦️", lightrainandthunder: "⛈️",
  lightsleetshowers_day: "🌨️", lightsleet: "🌨️",
  lightsnowshowers_day: "❄️", lightsnow: "❄️",
  heavyrainshowers_day: "🌧️", heavyrain: "🌧️",
  heavyrainandthunder: "⛈️", heavysleet: "🌨️",
  heavysnow: "❄️",
};

const SYMBOL_LABEL: Record<string, string> = {
  clearsky_day: "Clear", clearsky_night: "Clear",
  fair_day: "Fair", fair_night: "Fair",
  partlycloudy_day: "Partly cloudy", partlycloudy_night: "Partly cloudy",
  cloudy: "Overcast",
  rainshowers_day: "Rain showers", rainshowers_night: "Rain showers",
  rain: "Rain", lightrain: "Light rain", heavyrain: "Heavy rain",
  sleet: "Sleet", snow: "Snow", fog: "Fog",
  rainandthunder: "Thunder and rain", snowandthunder: "Thunder and snow",
};

function getEmoji(code: string): string {
  return SYMBOL_EMOJI[code] ?? "🌡️";
}

function getLabel(code: string): string {
  const base = code.replace(/_day$|_night$|_polartwilight$/, "");
  return SYMBOL_LABEL[code] ?? SYMBOL_LABEL[base] ?? code;
}

async function geocode(q: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const url = `${GEO_URL}?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=gb`;
  const res = await fetch(url, {
    headers: { "User-Agent": APP_UA, "Accept-Language": "en-GB" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
}

function groupByDay(timeseries: any[]): any[] {
  const days: Record<string, { temps: number[]; symbols: string[]; precip: number }> = {};
  for (const ts of timeseries) {
    const date = ts.time.slice(0, 10);
    const temp = ts.data?.instant?.details?.air_temperature;
    const symbol = ts.data?.next_1_hours?.summary?.symbol_code
      ?? ts.data?.next_6_hours?.summary?.symbol_code
      ?? ts.data?.next_12_hours?.summary?.symbol_code;
    const precip = ts.data?.next_1_hours?.details?.precipitation_amount
      ?? ts.data?.next_6_hours?.details?.precipitation_amount ?? 0;
    if (!days[date]) days[date] = { temps: [], symbols: [], precip: 0 };
    if (temp !== undefined) days[date].temps.push(temp);
    if (symbol) days[date].symbols.push(symbol);
    days[date].precip += precip;
  }
  return Object.entries(days).slice(0, 4).map(([date, d]) => ({
    date,
    tempMin: d.temps.length ? Math.round(Math.min(...d.temps)) : null,
    tempMax: d.temps.length ? Math.round(Math.max(...d.temps)) : null,
    symbolCode: d.symbols[Math.floor(d.symbols.length / 2)] ?? d.symbols[0] ?? "cloudy",
    emoji: getEmoji(d.symbols[Math.floor(d.symbols.length / 2)] ?? "cloudy"),
    label: getLabel(d.symbols[Math.floor(d.symbols.length / 2)] ?? "cloudy"),
    precipitation: Math.round(d.precip * 10) / 10,
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Missing location (?q=...)" }, { status: 400 });
  }

  try {
    const geo = await geocode(q);
    if (!geo) {
      return NextResponse.json({ error: `Location "${q}" not found` }, { status: 404 });
    }

    const metRes = await fetch(`${MET_URL}?lat=${geo.lat}&lon=${geo.lon}`, {
      headers: { "User-Agent": APP_UA },
      next: { revalidate: 1800 },
    });
    if (!metRes.ok) throw new Error("MET Norway request failed");

    const metData = await metRes.json();
    const timeseries: any[] = metData.properties?.timeseries ?? [];

    const now = timeseries[0];
    const currentTemp = Math.round(now?.data?.instant?.details?.air_temperature ?? 0);
    const currentSymbol = now?.data?.next_1_hours?.summary?.symbol_code ?? now?.data?.next_6_hours?.summary?.symbol_code ?? "cloudy";
    const windSpeed = Math.round(now?.data?.instant?.details?.wind_speed ?? 0);
    const humidity = Math.round(now?.data?.instant?.details?.relative_humidity ?? 0);

    const forecast = groupByDay(timeseries);

    return NextResponse.json({
      location: q,
      displayName: geo.displayName,
      current: {
        temp: currentTemp,
        symbolCode: currentSymbol,
        emoji: getEmoji(currentSymbol),
        label: getLabel(currentSymbol),
        windSpeed,
        humidity,
      },
      forecast,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
