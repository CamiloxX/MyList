# 031 — Listas oficiales + ajuste visual de las tarjetas

## Qué se hizo

Tres cosas pedidas sobre la feature de listas en el nuevo diseño:

1. **Tarjetas menos rectangulares.** Las portadas en `/lists` y `/lists/discover`
   pasaron de `h-24` (96 px, muy apaisadas) a `aspect-[3/2]` — un banner más alto
   y equilibrado que respeta el ancho de la columna.

2. **Listas oficiales.** Un admin puede publicar una lista como "oficial": aparece
   para todos en una sección destacada de Descubrir, por encima de las listas de
   la comunidad.

3. **Marca de verificación.** Las listas oficiales muestran un check azul
   (`BadgeCheckIcon` en `sky-500`, el mismo que ya marca a los admins en el chat y
   los comentarios) junto a su nombre en `/lists`, Descubrir, el detalle y `/share`.

## Cómo

### Base de datos (`20260609000000_official_lists.sql`)

- `lists.is_official boolean not null default false`.
- Índice parcial `lists_official_idx` para el feed "oficiales, recientes primero".
- Política RLS `lists_select_official`: **cualquiera** puede leer una lista oficial
  (la política owner-only sigue para el resto).
- Trigger `guard_list_official`: solo un admin (o el service-role, con
  `auth.uid()` nulo) puede activar/desactivar `is_official`. Cierra el hueco de
  que un dueño normal se autopublique vía la API pública con su anon key.

### Servidor

- `setListOfficial(listId, official)` en `features/admin/actions.ts`: gateada con
  `requireAdmin()`, escribe con el cliente **service-role**, y al publicar fuerza
  `visibility = 'public'` para que el `/share` y Descubrir resuelvan.
- Queries (`features/lists/queries.ts`): nuevo `getOfficialLists()`; `is_official`
  expuesto en `getUserLists`/`getListWithItems`/`getSharedList`; `getPublicLists`
  ahora excluye las oficiales (no se duplican). `getSharedList` deja pasar una
  lista oficial aunque sea privada.
- `isCurrentUserAdmin()` en `features/admin/queries.ts` (UX-only) para decidir si
  mostrar el toggle en el detalle.

### UI

- `OfficialBadge` (presentacional) y `OfficialListToggle` (cliente, admin) en
  `features/lists/components/`.
- `AdminOfficialListsPanel` en `/admin`: lista las listas del admin con un switch
  oficial on/off por fila.
- Sección "Oficiales" en `/lists/discover` y badge en `/lists`, detalle y `/share`.

## Notas / decisiones

- El admin publica **sus propias** listas (las crea y las marca). El panel de
  `/admin` gestiona las listas del admin actual; con un solo admin es suficiente.
- `is_official` se escribe únicamente por service-role + `requireAdmin()`, pero el
  trigger de BD es la barrera dura por si alguien intentara el update directo.
