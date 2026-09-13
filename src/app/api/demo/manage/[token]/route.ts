import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, getClientIp } from "@/lib/rate-limit";
import { loadDemoByToken, publicView } from "@/server/queries/demo-booking.queries";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(req);
  const limited = await apiRateLimiter.limit(`demo-manage:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const { token } = await params;
  try {
    const booking = await loadDemoByToken(token);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json(publicView(booking));
  } catch {
    return NextResponse.json({ error: "Could not load this booking." }, { status: 500 });
  }
}
