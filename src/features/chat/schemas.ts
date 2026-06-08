import { z } from "zod";

// Mirrors the DB check constraint chat_messages.body (1..1000 chars).
export const chatSendSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});
export type ChatSendInput = z.infer<typeof chatSendSchema>;
