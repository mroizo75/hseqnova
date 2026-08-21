import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, authRateLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Rate limit endpoint for signin
 * Called before actual authentication
 * SIKKERHET: Fail closed for login attempts
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const identifier = `signin:${ip}`;
    
    const { success } = await checkRateLimit(identifier, authRateLimiter, { failClosed: true });

    if (!success) {
      return NextResponse.json(
        { 
          error: "For mange påloggingsforsøk. Prøv igjen senere.",
        },
        { 
          status: 429,
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rate limit check error:", error);
    // SIKKERHET: Fail closed for login attempts
    return NextResponse.json(
      { error: "En feil oppstod. Prøv igjen senere." },
      { status: 500 }
    );
  }
}
