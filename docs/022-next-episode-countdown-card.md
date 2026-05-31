# 022 — Próximo episodio con cuenta regresiva (pill sobre el póster)

## Qué se hizo

La fecha del próximo episodio en el detalle de la biblioteca pasó de una línea
de texto plana (`Próximo episodio: T2E5 · mié, 5 jun`) a una **pill flotante
sobre el póster con cuenta regresiva viva**.

- **`NextEpisodeCard`** (`features/library/components/next-episode-card.tsx`),
  client component:
  - Muestra una cuenta regresiva relativa y localizada ("Mañana", "Dentro de 3
    días", "Dentro de 5 horas") con `useFormatter().relativeTime` de next-intl
    — sin claves nuevas, se traduce solo en es/en. Elige unidad horas (<1 día) o
    días.
  - Se calcula en cliente con `Date.now()` dentro de un `useEffect` (re-tick cada
    minuto), así se mantiene fresca y **evita mismatch de hidratación**: en SSR
    se ve la fecha absoluta y al montar aparece el contador.
  - Es una **pill flotante** (`absolute inset-x-1.5 bottom-1.5`) anclada al pie
    del póster, con fondo `bg-black/70` + `backdrop-blur` para legibilidad sobre
    cualquier imagen. Dos líneas: countdown (blanco, bold) + detalle tenue
    (código T2E5 / Ep 5 · fecha · hora), con `truncate`.
  - **Acento de color por cercanía** en el icono `CalendarClock`: verde
    (esmeralda) si falta ≤ ~1,5 días (inminente), azul (cielo) si falta más.

- En `library/[id]/page.tsx`:
  - El formateo server-side produce `nextEpisodeDate` (día) y, solo para anime,
    `nextEpisodeTime` (hora) — ambos en `America/Bogota`.
  - Se añadió `hasExactTime` a `NextEpisodeInfo`: AniList da instante exacto
    (mostramos hora), TMDB solo fecha (no).
  - La pill se renderiza dentro del contenedor `relative` del póster (que ya
    tiene `overflow-hidden`, así queda recortada sobre la imagen).

## Por qué así

- La fecha absoluta se formatea en el servidor (zona Colombia, como el resto de
  la app) y la cuenta regresiva en el cliente: lo único que cambia con el reloj
  vive en el cliente, lo estable se renderiza en el servidor.
- `relativeTime` de next-intl evita inventar strings de "faltan N días" por
  idioma (regla de i18n) y queda localizado gratis.
- El acento verde/azul reusa la misma paleta que el badge de estado de emisión
  (airing/upcoming) para mantener coherencia visual.
