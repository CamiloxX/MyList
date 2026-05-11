import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes auth cookies via Next's `cookies()` helper.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if there is middleware refreshing user sessions.
          }
        },
      },
    },
  );
}

/**
 * Privileged Supabase client using the service-role key.
 * Bypasses RLS — use ONLY in trusted server contexts (admin tasks, migrations).
 * Never expose to user-controlled requests without explicit authorization checks.
 *
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createServiceRoleClient() {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — required for service-role operations.");
  }
  return createServerClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // no-op — service-role client does not manage user cookies
      },
    },
  });
}
