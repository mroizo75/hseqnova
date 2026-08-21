import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Fiken is not used. Configure the Stripe webhook at /api/webhooks/stripe." },
    { status: 410 },
  );
}
