import { type NextRequest } from "next/server";
import { tavleEmitter } from "@/lib/tavle-events";
import { getAdminDb } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hms-tavle/public/[token]/events
 *
 * SSE stream for live digital safety board updates.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: tavle } = await getAdminDb()
    .from("HmsTavle")
    .select("id, isPublic")
    .eq("publicToken", token)
    .maybeSingle();

  if (!tavle) {
    return new Response("Board not found", { status: 404 });
  }

  const eventName = `tavle:${token}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping så klienten vet tilkoblingen er oppe
      controller.enqueue(encoder.encode(": connected\n\n"));

      const send = (event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          // Klient koblet fra
        }
      };

      const onUpdate = () => send("update", JSON.stringify({ ts: Date.now() }));

      tavleEmitter.on(eventName, onUpdate);

      // Heartbeat hvert 25. sekund (holder proxy-tilkoblingen oppe)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        tavleEmitter.off(eventName, onUpdate);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* allerede lukket */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
