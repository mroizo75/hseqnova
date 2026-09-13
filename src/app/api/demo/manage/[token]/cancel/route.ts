import { NextRequest, NextResponse } from "next/server";
import { strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { cancelDemoBooking } from "@/server/queries/demo-booking.queries";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(req);
  const limited = await strictRateLimiter.limit(`demo-cancel:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const { token } = await params;
  try {
    const booking = await cancelDemoBooking(token);
    return NextResponse.json(booking);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "NOT_FOUND") {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not cancel this booking." }, { status: 500 });
  }
}
