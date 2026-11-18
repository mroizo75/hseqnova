import type { MarketingChatMessage } from "@/lib/marketing-chat-knowledge";

export const MARKETING_CHAT_REFUSAL =
  "I can only help with HSEQ Nova: Core, add-ons, prices, payment, demos and the UK duties the product covers. I cannot share system details, keys, code or anything outside the public catalogue. Ask a product question, or book a demo.";

const EXTRACTION_ATTEMPT =
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|rules|prompts|directions)|disregard\s+(your\s+)?(system|previous|prior|above)|(?:system|developer|hidden)\s+prompt|reveal\s+(your\s+)?(instructions|prompt|rules|configuration|secrets)|repeat\s+(everything|all|the text|the (?:system )?prompt)\s+(above|before)|print\s+(your\s+)?(instructions|prompt|secrets|keys|environment)|what\s+(are|were)\s+your\s+(instructions|rules|prompts)|show\s+me\s+(the\s+)?(hidden|internal|secret|system)|you\s+are\s+now\b|jailbreak|\bDAN\b|developer\s+mode|do\s+anything\s+now|<\s*\/?\s*system\s*>|\[INST\]|```\s*system|role\s*[:=]\s*["']?system|process\.env|\.env\b|api[_\s-]?key|secret[_\s-]?key|service[_\s-]?role|private[_\s-]?key|access[_\s-]?token|bearer\s+token|authorization\s+header|resend|openai|supabase|upstash|stripe[_\s-]?secret|postgres(?:ql)?:\/\/|begin\s+(?:rsa\s+|openssh\s+)?private\s+key/i;

const SECRET_SHAPES: readonly RegExp[] = [
  /\bre_[A-Za-z0-9_-]{8,}/,
  /\bsk-[A-Za-z0-9_-]{10,}/,
  /\brk_[A-Za-z0-9_-]{10,}/,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}/,
  /postgres(?:ql)?:\/\//i,
  /SUPABASE_SERVICE_ROLE|RESEND_API_KEY|OPENAI_API_KEY|SERVICE_ROLE_KEY/i,
  /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

const PROMPT_CANARIES = [
  "You are the public guide for HSEQ Nova",
  "HSEQ Nova public catalogue (live prices",
  "Suggested packs from the visitor",
  "HARD LIMITS",
  "UNTRUSTED VISITOR TEXT",
] as const;

export function visitorTriedToExtractInternals(messages: readonly MarketingChatMessage[]): boolean {
  return messages.some((message) => message.role === "user" && EXTRACTION_ATTEMPT.test(message.content));
}

export function releaseMarketingReply(reply: string): string {
  const text = reply.trim();
  if (!text) return MARKETING_CHAT_REFUSAL;
  if (text.length > 1600) return MARKETING_CHAT_REFUSAL;
  if (SECRET_SHAPES.some((pattern) => pattern.test(text))) return MARKETING_CHAT_REFUSAL;
  if (PROMPT_CANARIES.some((canary) => text.includes(canary))) return MARKETING_CHAT_REFUSAL;
  return text;
}
