# 005 — Avatar de perfil + sidebar de autor en foro y comentarios

## Qué se hizo

1. **Subida de avatar** desde `/settings`:
   - Bucket público `avatars` en Supabase Storage (migración 005).
   - Path: `avatars/<user_id>/avatar.<ext>`. Las policies permiten read
     público y escritura solo del dueño en su subcarpeta.
   - UI en settings con cropper circular (`react-easy-crop`): el usuario
     ajusta zoom/posición, el blob recortado se sube como WebP 512×512.
   - URL pública con cache-buster (`?v=<ts>`) guardada en `profiles.avatar_url`.
2. **Sidebar de autor** (`AuthorAside`) en `PostCard` del foro y `CommentCard`
   de los comentarios por título:
   - Desktop (`sm:+`): columna izquierda de 128 px con avatar 64 px, nombre,
     chip "OP" (si aplica) y hasta 4 íconos de logros desbloqueados.
   - Mobile: versión compacta inline (avatar 32 px + nombre).

## Por qué

Después de habilitar el foro y comentarios (migración 004), darle cara
a los autores aumenta la sensación de comunidad. Mostrar los logros junto
al nombre además premia al usuario por su actividad en la app.

## Decisiones de diseño

- **Bucket público, no privado**: los avatares son intrínsecamente
  públicos (los ve cualquiera que vea un post). Evita firmar URLs en cada render.
- **Cropper antes de subir**: aprobado por el usuario aunque suma `react-easy-crop`
  (~25 KB). Resultado: avatar siempre cuadrado y bien encuadrado.
- **WebP 512×512**: 9 KB típicos por imagen, soporta todos los navegadores
  modernos. Si en el futuro hay que servir Safari < 14, usar PNG fallback.
- **Badges en sidebar**: top 4 por fecha de obtención (más recientes primero).
  Reutiliza `BADGE_BY_ID` y `BadgeIcon`.
- **`unoptimized` en `<Image>`**: el avatar es chiquito y el cache-buster
  ya rompe el cache del browser cuando cambia; no vale la pena pasar por el
  optimizer de Next.

## Schema (migración 005)

```sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "avatars_read_public"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- update + delete: misma condición.
```

## Cambios en queries

`fetchAuthors()` (foro) y la rama equivalente de `listCommentsByTitle()`
ahora traen `avatar_url` y la lista de `badge_ids` por autor. Se exporta
`fetchBadgesByUserIds(userIds)` desde `src/features/forum/queries.ts`,
reutilizado por title-comments.

## Componentes nuevos

- `src/components/avatar.tsx` — render genérico con fallback a iniciales.
- `src/components/author-aside.tsx` — sidebar / compact del autor.
- `src/features/profile/` — `actions.ts`, `schemas.ts`,
  `components/avatar-upload-card.tsx`, `components/avatar-crop-dialog.tsx`.

## Cómo probar

1. `/settings` → "Cambiar foto" → seleccionar JPG/PNG/WebP < 2 MB →
   recortar → guardar.
2. Abrir cualquier hilo del foro donde tengas un post — debe aparecer
   tu foto a la izquierda, junto con los logros que tengas.
3. Quitar la foto y verificar fallback a iniciales.
4. RLS storage: como otra cuenta, intentar `insert` en
   `avatars/<otro_user_id>/...` debe ser rechazado por la policy.

## Pendiente

- Subir un avatar a varias resoluciones (tipo `s64`, `s256`) para optimizar
  ancho de banda en el feed.
- Mostrar nombre como link al perfil público del usuario (no existe aún).
- Migrar el `unoptimized` a `next/image` optimizado cuando se diseñen las
  variantes.
