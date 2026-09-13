import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, getClientIp } from "@/lib/rate-limit";
import { icsForRecord, loadDemoByToken } from "@/server/queries/demo-booking.queries";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(req);
  const limited = await apiRateLimiter.limit(`demo-ics:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const { token } = await params;
  try {
    const booking = await loadDemoByToken(token);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    const ics = icsForRecord(booking);
    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hseq-nova-demo.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not build the calendar file." }, { status: 500 });
  }
}
