import {
  buildMarketingKnowledge,
  recommendPacksForCompany,
  type MarketingChatMessage,
} from "@/lib/marketing-chat-knowledge";
import { SITE_CONFIG } from "@/lib/seo-config";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_RULES = `You are the public guide for HSEQ Nova, UK health and safety software.
Answer only about HSEQ Nova: what it does, what Core includes, which add-ons fit a company, prices, payment, demos and UK duties the product covers.
Always use British English. Be concise (about 80–140 words unless they ask for more).
Write plain sentences only — no markdown, asterisks or bullet symbols.
Use only the catalogue in the knowledge block. Never invent prices, modules or customer data.
Never ask for passwords, accident records or personal employee data.
If they describe their company, recommend Core plus only the add-ons that fit. Say they can start at /register or book a demo at /book-a-demo.
If they want a human, give ${SITE_CONFIG.contactName} on ${SITE_CONFIG.contactPhone} or ${SITE_CONFIG.contactEmail}.
You are not a competent person and this is not legal advice.
If the question is off-topic, say you only help with HSEQ Nova and invite a product question.`;

export async function answerMarketingChat(messages: MarketingChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw {
      code: "AI_NOT_CONFIGURED",
      message: `The guide is not available just now. Call ${SITE_CONFIG.contactName} on ${SITE_CONFIG.contactPhone} or book a demo.`,
    };
  }

  const lastUser = [...messages].reverse().find((item) => item.role === "user");
  const suggestions = lastUser ? recommendPacksForCompany(lastUser.content) : [];
  const suggestionBlock =
    suggestions.length > 0
      ? `Suggested packs from the visitor's wording (still confirm they need them):\n${suggestions
          .map((item) => `- ${item.name}: ${item.reason}`)
          .join("\n")}`
      : "No extra packs inferred. If they have not described the work, recommend Core and ask one short question about construction, chemicals or sites.";

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        { role: "system", content: SYSTEM_RULES },
        { role: "system", content: buildMarketingKnowledge() },
        { role: "system", content: suggestionBlock },
        ...messages.map((item) => ({ role: item.role, content: item.content })),
      ],
    }),
  });

  if (!response.ok) {
    throw {
      code: "EXTERNAL_API_ERROR",
      message: "The guide could not answer just now. Try again, or book a demo.",
    };
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!reply) {
    throw {
      code: "EMPTY_REPLY",
      message: "The guide could not answer just now. Try again, or book a demo.",
    };
  }
  return reply;
}
