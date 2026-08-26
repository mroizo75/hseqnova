import { NextResponse } from "next/server";

/** Not offered in the UK product. */
function notAvailable() {
  return NextResponse.json({ error: "Not available" }, { status: 404 });
}

export async function GET() {
  return notAvailable();
}

export async function POST() {
  return notAvailable();
}

export async function PUT() {
  return notAvailable();
}

export async function PATCH() {
  return notAvailable();
}

export async function DELETE() {
  return notAvailable();
}
