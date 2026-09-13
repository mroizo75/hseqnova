import { NextRequest, NextResponse } from "next/server";
import { strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { bookDemoSchema } from "@/lib/validations/demo-booking";
import { createDemoBooking } from "@/server/queries/demo-booking.queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await strictRateLimiter.limit(`demo-book:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bookDemoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }
  if (parsed.data._hp && parsed.data._hp.trim() !== "") {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  try {
    const booking = await createDemoBooking({
      startAt: parsed.data.startAt,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      company: parsed.data.company,
      jobTitle: parsed.data.jobTitle || undefined,
      notes: parsed.data.notes || undefined,
    });
    return NextResponse.json(booking);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const message =
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Could not book that time.";
    if (code === "SLOT_TAKEN" || code === "INVALID_SLOT") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not complete the booking. Try again, or call us." }, { status: 500 });
  }
}
