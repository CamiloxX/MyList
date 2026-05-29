# 016 — Estado de emisión + avisos de episodios por título

## Qué se hizo

1. **Estado de emisión visible.** La ficha de detalle de series/anime muestra un
   badge: **En emisión** (verde), **Finalizada** o **Próximamente**.
   - TMDB: `getTmdbTvAiringStatus()` clasifica usando `next_episode_to_air`
     (señal fuerte de "viene más") y, si no, el `status` ("Returning Series",
     "Ended", "Canceled", "In Production", "Planned").
   - Jikan: `getJikanAiringStatus()` mapea `airing` / `status`.
   - Tipo compartido `AiringStatus` en `src/lib/airing-status.ts`.

2. **Avisos de nuevos episodios opt-in por título.**
   - Migración `20260528020000_notify_episodes.sql`: columna
     `media_items.notify_episodes boolean` (default false). *Backfill* a `true`
     para series/anime que ya estaban en `watching`, para no perder los avisos
     que ya recibían.
   - **Al agregar** una serie/anime en emisión → `notify_episodes = true`
     automáticamente (`isCurrentlyAiring()` en `addToLibrary`).
   - **Toggle por título** en la ficha (`NotifyEpisodesToggle`) vía la action
     `setNotifyEpisodes(id, enabled)`.
   - Al marcar un título como **visto** o **abandonado**, se apaga
     `notify_episodes` para no seguir molestando.

3. **El cron de nuevos episodios** (`dispatchNewEpisodes`) ahora selecciona por
   `notify_episodes = true` en vez de `status = 'watching'`.

## Por qué

Antes el cron avisaba de todo lo que estuviera en `watching`, sin control por
título y sin que el usuario viera si algo seguía emitiéndose. Mover el disparador
a un flag explícito permite: (a) activar el aviso en el momento de agregar algo
en emisión, (b) encender/apagar por título, y (c) cortar avisos al terminar o
abandonar — todo independiente del estado de visualización.

## Archivos

- `supabase/migrations/20260528020000_notify_episodes.sql`
- `src/lib/airing-status.ts` (tipo)
- `src/lib/tmdb/tv.ts`, `src/lib/jikan/airing.ts` (clasificación de emisión)
- `src/features/library/actions.ts` (detección al agregar, `setNotifyEpisodes`,
  apagado al marcar visto/abandonado)
- `src/features/library/components/notify-episodes-toggle.tsx`
- `src/app/[locale]/(app)/library/[id]/page.tsx` (badge + toggle)
- `src/features/notifications/new-episodes.ts` (cron filtra por el flag)
- `src/types/database.ts`, `src/i18n/messages/{es,en}.json`, `src/lib/changelog.ts`
