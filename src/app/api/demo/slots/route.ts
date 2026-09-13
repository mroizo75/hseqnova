import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, getClientIp } from "@/lib/rate-limit";
import { loadMonthSlots } from "@/server/queries/demo-booking.queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await apiRateLimiter.limit(`demo-slots:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const yearParam = Number(req.nextUrl.searchParams.get("year"));
  const monthParam = Number(req.nextUrl.searchParams.get("month"));
  const now = new Date();
  const year = Number.isInteger(yearParam) && yearParam >= 2020 && yearParam <= 2100 ? yearParam : now.getUTCFullYear();
  const month =
    Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : now.getUTCMonth() + 1;

  try {
    const data = await loadMonthSlots(year, month, now);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not load available times. Call or email us and we will book you in." },
      { status: 500 },
    );
  }
}
