# 015 — Nombre de perfil: prefill de Google + cambio una vez al mes

## Qué se hizo

1. **Prefill del nombre en signups con Google.** El trigger `handle_new_user()`
   buscaba solo `raw_user_meta_data->>'display_name'`, claim que Google **no**
   envía (manda `name` / `full_name`). Resultado: los usuarios de Google caían
   al fallback `split_part(email, '@', 1)` y se quedaban con el prefijo del
   correo. Ahora el `coalesce` lee `display_name → full_name → name → prefijo`.

2. **Cambio de nombre desde Ajustes, limitado a una vez cada 30 días.**
   - Nueva columna `profiles.display_name_updated_at timestamptz` (nullable).
     `NULL` significa "nunca cambiado desde el registro" → el **primer** cambio
     es gratis (no consume el cupo, solo arranca el reloj).
   - Server action `updateDisplayName` en `features/profile/actions.ts`:
     valida (Zod), corta no-ops, actualiza `profiles.display_name`, sincroniza
     `auth.users.user_metadata.display_name`, y traduce el error del trigger a
     una clave i18n.
   - UI: `DisplayNameCard` en la página de Ajustes. Muestra el input editable
     cuando se puede cambiar, o deshabilitado con la fecha de desbloqueo.

## Por qué

El límite se impone en un **trigger de base de datos**
(`profiles_display_name_change_limit`, `BEFORE UPDATE`), no solo en la action.
La política RLS `profiles_update_own` permite que el usuario actualice su propia
fila directamente desde el browser client, así que validar únicamente en la
server action sería evadible desde la consola del navegador. El trigger:

- solo actúa cuando `display_name` cambia de verdad (avatar/locale no cuentan),
- lanza `display_name_change_too_soon` (errcode `check_violation`) si el último
  cambio fue hace menos de 30 días,
- estampa `display_name_updated_at = now()` en cada cambio válido.

La fuente de verdad del nombre visible pasa a ser `profiles.display_name`; la
action mantiene `auth.users.user_metadata` en sincronía para no romper lugares
que leen de ahí (saludo de la biblioteca, claims del JWT).

## Decisiones de producto

- **Display name libre, no único** (se mantiene el modelo actual; aparece en
  comentarios y puede repetirse). No se introdujo un @handle único.
- **Pre-rellenar con el nombre de Google** en vez de forzar un onboarding
  bloqueante.
- **Primer cambio gratis**; a partir del segundo aplica el límite de 30 días.

## Archivos

- `supabase/migrations/20260528010000_display_name_changes.sql`
- `src/features/profile/{actions,schemas}.ts`
- `src/features/profile/components/display-name-card.tsx`
- `src/app/[locale]/(app)/settings/page.tsx`
- `src/types/database.ts` (columna añadida al tipo de `profiles`)
- `src/i18n/messages/{es,en}.json` (bloque `settings.profileName`)
- `src/lib/changelog.ts` (entrada visible para usuarios)
