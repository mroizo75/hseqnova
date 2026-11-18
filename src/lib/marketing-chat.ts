import { ADDON_PACKS, HSEQ_CORE, yearlyPriceGbp } from "@/lib/billing-catalog";
import { HOME_FAQS, formatGbp } from "@/lib/homepage-content";
import {
  recommendPacksForCompany,
  type MarketingChatMessage,
} from "@/lib/marketing-chat-knowledge";
import { MARKETING_CHAT_REFUSAL, releaseMarketingReply, visitorTriedToExtractInternals } from "@/lib/marketing-chat-guard";
import { SITE_CONFIG } from "@/lib/seo-config";

const WELCOME =
  "Ask about Core, add-ons, prices, payment, or what fits a construction site, warehouse or COSHH job. Start at /register or book a demo at /book-a-demo.";

function faq(question: string): string {
  const match = HOME_FAQS.find((item) => item.question === question);
  if (!match) {
    throw { code: "MISSING_PUBLIC_COPY", message: "The guide could not answer just now." };
  }
  return match.answer;
}

function contactLine(): string {
  return `Book a 30-minute demo at /book-a-demo, or speak to ${SITE_CONFIG.contactName} on ${SITE_CONFIG.contactPhone} or ${SITE_CONFIG.contactEmail}.`;
}

function composePublicReply(question: string): string {
  const text = question.trim();
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b[.!?\s]*$/i.test(text)) {
    return WELCOME;
  }

  const packs = recommendPacksForCompany(text);
  const wantsPrice = /\b(price|pricing|cost|how much|yearly|annual|per month|billing)\b/i.test(text);
  const wantsPay = /\b(pay|payment|card|bacs|invoice|vat|direct debit)\b/i.test(text);
  const wantsCore = /\b(core|included|include|what is|policy|accident|riddor|inspection|fire drill)\b/i.test(text);
  const wantsUsers = /\b(user|users|seat|unlimited|who can)\b/i.test(text);
  const wantsHuman = /\b(human|call|phone|demo|contact|speak|email)\b/i.test(text);
  const wantsTraining = /\b(training|course|ipaf|pasma|cisrs|competence)\b/i.test(text);
  const wantsAccount = /\b(log ?in|sign in|my account|forgot)\b/i.test(text);
  const wantsConsultancy = /\b(consultan|competent person|legal advice)\b/i.test(text);
  const office = /\b(office|warehouse|shop|cafe|café|retail)\b/i.test(text);

  const parts: string[] = [];

  if (wantsAccount) {
    parts.push("Sign in at /login. This guide cannot see your company records, users, incidents or invoices.");
  }

  if (packs.length > 0) {
    const names = packs.map((item) => item.name).join(", ");
    parts.push(`For that work, take Core plus ${names}. ${packs[0]?.reason ?? ""}`.trim());
    for (const recommendation of packs) {
      const pack = ADDON_PACKS.find((item) => item.id === recommendation.packId);
      if (!pack) continue;
      parts.push(
        `${pack.name} is ${formatGbp(pack.monthlyPriceGbp)} per month or ${formatGbp(yearlyPriceGbp(pack.monthlyPriceGbp))} per year. ${pack.description}`,
      );
    }
    parts.push(
      `Core is ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month or ${formatGbp(yearlyPriceGbp(HSEQ_CORE.monthlyPriceGbp))} per year, per company, with unlimited users.`,
    );
  } else if (office) {
    parts.push("An office, warehouse, shop or cafe normally needs Core only. Add RAMS, COSHH, CDM or the safety board only when the work needs them.");
    parts.push(faq("How much does HSEQ Nova cost?"));
  }

  if (wantsCore && packs.length === 0) {
    parts.push(faq("What is included in HSEQ Nova Core?"));
  }
  if (/\b(what is hseq|what is hseq nova)\b/i.test(text)) {
    parts.push(faq("What is HSEQ Nova?"));
  }
  if (/\b(accident|riddor|near miss)\b/i.test(text)) {
    parts.push(faq("Does HSEQ Nova include a digital accident book and RIDDOR?"));
  }
  if (wantsPrice && packs.length === 0 && !office) {
    parts.push(faq("How much does HSEQ Nova cost?"));
  }
  if (wantsPay) {
    parts.push(faq("How do I pay?"));
  }
  if (wantsUsers) {
    parts.push(faq("Who can use HSEQ Nova in the company?"));
  }
  if (wantsConsultancy) {
    parts.push(faq("Is HSEQ Nova a consultancy or a competent person?"));
  }
  if (wantsTraining) {
    parts.push(
      "Delivered training covers work at height, mobile elevating work platforms, pallet trucks, prefabricated scaffold up to 9 metres, work equipment, and health and safety for managers. IPAF, PASMA, CISRS, crane, licensed asbestos and Driver CPC cards are not offered. Enquire via the contact on the training page.",
    );
  }
  if (wantsHuman || parts.length > 0) {
    parts.push(contactLine());
  }

  if (parts.length === 0) return MARKETING_CHAT_REFUSAL;

  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.includes(part)) unique.push(part);
  }
  return unique.join(" ");
}

export async function answerMarketingChat(messages: MarketingChatMessage[]): Promise<string> {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser || visitorTriedToExtractInternals([lastUser])) {
    return MARKETING_CHAT_REFUSAL;
  }
  return releaseMarketingReply(composePublicReply(lastUser.content));
}
