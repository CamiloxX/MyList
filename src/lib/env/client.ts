import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Optional: only required when Web Push is configured. Reading it as
  // optional here lets the rest of the app boot even if push isn't set up
  // yet (the notifications feature checks for presence before subscribing).
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  // Optional: without it Sentry stays inert (no error reporting).
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || undefined,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid client env vars: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

export const clientEnv = parsed.data;
export type ClientEnv = typeof clientEnv;
