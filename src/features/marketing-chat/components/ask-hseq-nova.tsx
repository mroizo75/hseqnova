"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUp, MessageSquareText, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/seo-config";

type ChatRole = "user" | "assistant";

type ChatLine = {
  role: ChatRole;
  content: string;
};

const HIDDEN_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/select-tenant",
];

const STARTERS = [
  "What is included in Core?",
  "We are a construction company — what do we need?",
  "How much is yearly billing?",
] as const;

function displayReply(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "");
}

export function AskHseqNova() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
    inputRef.current?.focus();
  }, [open, messages, loading]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: ChatLine[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/marketing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-12),
          _hp: honeypot,
        }),
      });
      const data = (await res.json()) as { reply?: string; message?: string };
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply || data.message || "I could not answer just now. Try again, or book a demo.",
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: `I could not reach the guide. Call ${SITE_CONFIG.contactName} on ${SITE_CONFIG.contactPhone}, or book a demo.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close guide"
          className="fixed inset-0 z-[60] bg-[#14261c]/50"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[61] w-[min(100%-1.5rem,22.5rem)] sm:right-5">
        <div className="flex flex-col items-stretch gap-3">
          {open ? (
            <section
              aria-label="Ask HSEQ Nova"
              className="hseq-guide-panel pointer-events-auto flex min-h-[20rem] w-full flex-col overflow-hidden rounded-sm border border-[#14261c]/20 shadow-[0_24px_60px_rgba(12,28,22,0.4)]"
            >
              <header className="flex shrink-0 items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="hseq-guide-title font-display text-lg leading-none">Ask HSEQ Nova</p>
                  <p className="mt-1.5 text-[11px] tracking-wide text-[#f6f0e6]/70">
                    Public product guide · not your company records
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm p-1 text-[#f6f0e6]/80 hover:bg-white/10 hover:text-white"
                  aria-label="Close guide"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div ref={listRef} className="hseq-guide-thread space-y-3 px-4 py-4">
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-[#14261c]/80">
                      Ask about Core, add-ons, prices, or what fits a construction site, warehouse or COSHH job.
                      I only answer about HSEQ Nova.
                    </p>
                    <ul className="space-y-2">
                      {STARTERS.map((prompt) => (
                        <li key={prompt}>
                          <button
                            type="button"
                            onClick={() => void send(prompt)}
                            className="w-full border border-[#14261c]/15 bg-[#fffdf8] px-3 py-2.5 text-left text-sm text-[#14261c] hover:border-[#1f6b45]"
                          >
                            {prompt}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  messages.map((line, index) => (
                    <p
                      key={`${line.role}-${index}`}
                      className={
                        line.role === "user"
                          ? "ml-6 bg-[#14261c] px-3 py-2 text-sm leading-relaxed text-[#f6f0e6]"
                          : "mr-4 border border-[#14261c]/10 bg-[#fffdf8] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-[#14261c]"
                      }
                    >
                      {line.role === "assistant" ? displayReply(line.content) : line.content}
                    </p>
                  ))
                )}
                {loading ? (
                  <p className="text-xs tracking-wide text-[#14261c]/55">Looking at the catalogue…</p>
                ) : null}
              </div>

              <form
                className="hseq-guide-composer shrink-0 border-t border-[#14261c]/12 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
              >
                <label className="sr-only" htmlFor="hseq-guide-input">
                  Your question
                </label>
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  aria-hidden
                />
                <div className="flex items-end gap-2">
                  <textarea
                    id="hseq-guide-input"
                    ref={inputRef}
                    rows={2}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send(input);
                      }
                    }}
                    placeholder="Ask about Core, RAMS, COSHH or price…"
                    disabled={loading}
                    className="min-h-[2.75rem] flex-1 resize-none border border-[#14261c]/18 bg-[#fffdf8] px-3 py-2 text-sm text-[#14261c] outline-none placeholder:text-[#14261c]/40 focus:border-[#1f6b45]"
                  />
                  <button
                    type="submit"
                    disabled={loading || input.trim().length === 0}
                    className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#14261c] text-[#f6f0e6] disabled:opacity-40"
                    aria-label="Send question"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-[#14261c]/60">
                  <Link href="/book-a-demo" className="underline underline-offset-2 hover:text-[#1f6b45]">
                    Book a demo
                  </Link>
                  {" · "}
                  <a href={`tel:${SITE_CONFIG.contactPhoneTel}`} className="underline underline-offset-2 hover:text-[#1f6b45]">
                    {SITE_CONFIG.contactPhone}
                  </a>
                </p>
              </form>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="pointer-events-auto ml-auto flex h-10 w-10 items-center justify-center border border-[#14261c]/15 bg-[#f4ead4] text-[#14261c]/70 shadow-sm hover:border-[#14261c]/30 hover:text-[#14261c]"
            aria-expanded={open}
            aria-label={open ? "Close guide" : "Ask about HSEQ Nova"}
            title={open ? "Close" : "Ask"}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <MessageSquareText className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>
    </>
  );
}
