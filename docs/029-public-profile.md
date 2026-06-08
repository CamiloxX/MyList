# 029 — Perfil público (`/u/<username>`)

Página compartible con el perfil de un usuario: avatar, nombre, logros
destacados, estadísticas básicas, mejor valorados, géneros favoritos y actividad
reciente. **Privado por defecto** (opt-in). Pensado para enlazar/compartir.

## Decisiones del usuario
- URL por **nombre de usuario elegible** (`/u/pugcini`), no por uuid.
- Mostrar **todas** las secciones (stats, top valorados, géneros, actividad).

## Datos y seguridad
- **Migración** `20260608020000_public_profiles.sql`: `profiles.username citext`
  (índice único parcial — los NULL no colisionan, `citext` = case-insensitive),
  `profiles.is_public boolean default false`, y un CHECK de formato
  `^[a-z0-9_]{3,20}$`. Sin RLS nueva.
- **Sin policy anon**. El camino público lee con `createServiceRoleClient()` y el
  gate `is_public` vive en código (igual que las listas compartidas). Como
  service-role **salta RLS**, el módulo `src/features/profile/queries.ts` es el
  único trust boundary: el chequeo `is_public` corre **antes** de cualquier
  query, cada consulta filtra por `user_id` explícito, y el objeto devuelto
  nunca incluye el uuid del perfil. `getPublicProfileByUsername` devuelve `null`
  para handle inválido/desconocido/privado → la página hace `notFound()` (404
  idéntico para "no existe" y "es privado", sin fuga de info).

## Refactor de stats (clave)
Las queries de `src/features/stats/queries.ts` eran auth-scoped (confiaban en
`auth.uid()` implícito de RLS; **no** filtraban por `user_id`). Se extrajo un
core `*ForUser(client, userId)` para `getUserOverview`, `getActivityStats`,
`getLibraryBreakdown` y `getTopRatedMedia`, cada uno con `.eq("user_id", userId)`
explícito (redundante con el cliente authed, **load-bearing** con service-role).
Las funciones exportadas originales pasan a ser wrappers que resuelven
`createClient()` + el user de sesión y delegan — los call sites de `stats/page`
no cambian. `fetchBadgesByUserIds` ganó una variante `…With(client, ids)` para
resolver logros con el cliente service-role (el cookie client no vería nada
estando deslogueado).

## UI
- **Ajustes** (`PublicProfileCard`, `src/features/profile/components/`): input de
  `@handle` (normaliza a minúsculas en vivo) + acción `updateUsername` (colisión
  unique `23505` → "ya en uso"); toggle `is_public` (acción `setProfilePublic`,
  exige handle antes de publicar → `needHandleFirst`); fila "ver / copiar enlace"
  cuando está público. Las nuevas actions viven en `profile/actions.ts` (solo
  funciones async; constantes/Zod en `profile/schemas.ts`).
- **Ruta** `src/app/[locale]/u/[username]/page.tsx`, fuera de `(app)`/`(auth)`
  (no auth-gated, igual que `share/`), `force-dynamic`, con `generateMetadata`
  (OG `type: profile` + avatar + línea de stats). Secciones reusan `AuthorAside`
  para el header; tiles/barras/listas inline con el lenguaje visual de stats. El
  top valorado se renderiza **sin enlaces** (la ruta `/library/<id>` no es
  pública).
- i18n: namespace `profile.handle.*` (card de ajustes) y `profile.public.*`
  (página), + `settings.publicProfile.*`. Claves en es + en.

## Verificación
`pnpm typecheck` · `pnpm build` · `pnpm test` · lint. Manual: reclamar handle
(inválido/duplicado), activar público sin handle → `needHandleFirst`, abrir
`/u/<handle>` deslogueado, desactivar → 404.

## Pendiente relacionado
La página reusa `profiles.featured_badge_ids`. Un futuro season-tracking de
anime es independiente (ver `docs/030`).
