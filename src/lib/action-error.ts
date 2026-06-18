import "server-only";

/**
 * Logs the raw error server-side and returns a stable, schema-safe message for
 * the client.
 *
 * Server actions must never return a raw Postgres/PostgREST `error.message` to
 * the UI: those strings leak internal schema details (table/column/constraint,
 * trigger and RLS-policy names) to any authenticated prober. Map genuinely
 * user-meaningful cases (throttle, restriction, duplicate, etc.) BEFORE falling
 * through to this helper.
 */
export function safeActionError(scope: string, error: unknown): string {
  console.warn(`[${scope}]`, error);
  return "No se pudo completar la acción. Intenta de nuevo.";
}
