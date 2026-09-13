import { NextRequest, NextResponse } from "next/server";
import { getClientIp, marketingChatRateLimiter } from "@/lib/rate-limit";
import { answerMarketingChat } from "@/lib/marketing-chat";
import { marketingChatRequestSchema } from "@/lib/validations/marketing-chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = await marketingChatRateLimiter.limit(`marketing-chat:${ip}`);
  if (!limited.success) {
    return NextResponse.json(
      { code: "RATE_LIMIT_EXCEEDED", message: "Too many questions. Wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "INVALID_JSON", message: "Invalid request" }, { status: 400 });
  }

  const parsed = marketingChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Check your question and try again." },
      { status: 400 },
    );
  }
  if (parsed.data._hp && parsed.data._hp.trim() !== "") {
    return NextResponse.json({ code: "INVALID_SUBMISSION", message: "Invalid request" }, { status: 400 });
  }

  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Send a question to continue." },
      { status: 400 },
    );
  }

  try {
    const reply = await answerMarketingChat(parsed.data.messages);
    return NextResponse.json({ code: "OK", reply });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "INTERNAL_ERROR";
    const message =
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Could not answer just now.";
    const status = code === "AI_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ code, message }, { status });
  }
}
