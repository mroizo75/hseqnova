import { z } from "zod";

export const marketingChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const marketingChatRequestSchema = z.object({
  messages: z.array(marketingChatMessageSchema).min(1).max(12),
  _hp: z.string().max(200).optional(),
});

export type MarketingChatRequest = z.infer<typeof marketingChatRequestSchema>;
