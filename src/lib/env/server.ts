import "server-only";
import { z } from "zod";
import { clientEnv } from "./client";

const schema = z.object({
  // Optional for now: only required for trusted-server admin tasks that bypass RLS.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  TMDB_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(`Invalid server env vars: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

export const serverEnv = {
  ...clientEnv,
  ...parsed.data,
};
export type ServerEnv = typeof serverEnv;
