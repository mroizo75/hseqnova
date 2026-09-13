import { NextRequest, NextResponse } from "next/server";
import { strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { rescheduleDemoSchema } from "@/lib/validations/demo-booking";
import { rescheduleDemoBooking } from "@/server/queries/demo-booking.queries";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(req);
  const limited = await strictRateLimiter.limit(`demo-reschedule:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }
  const { token } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = rescheduleDemoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pick a valid time." }, { status: 400 });
  }
  try {
    const booking = await rescheduleDemoBooking(token, parsed.data.startAt);
    return NextResponse.json(booking);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const message =
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Could not move this booking.";
    if (code === "SLOT_TAKEN" || code === "INVALID_SLOT") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (code === "NOT_FOUND") {
      return NextResponse.json({ error: "This booking is no longer active." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not move this booking." }, { status: 500 });
  }
}
