# 032 — Rail de detalle: ancho contenido + iconos en las tarjetas

## Qué se hizo

En la ficha de detalle de escritorio (`DesktopSeriesDetail`, usada en
`/library/[id]` y `/library-v2/[id]`) se arregló cómo se comporta la columna
derecha (Logros / Detalles / Disponible en) en pantallas grandes y se les dio
identidad visual con iconos.

### 1. Estructura responsive (el bug del monitor de 27")

El `<main>` de escritorio no tiene ancho máximo, así que la ficha se estiraba
de borde a borde. La sinopsis quedaba topada a la izquierda (`max-w-2xl`) y la
columna derecha (330px) se iba al extremo, "flotando" muy arriba con un hueco
enorme en medio: se veía desconectada y mal adaptada.

Solución: envolver el hero, el cuerpo de dos columnas y los comentarios en un
contenedor centrado `mx-auto w-full max-w-7xl`. Debajo de 1280px no cambia nada
(el contenido ya cabe); por encima, el bloque se centra y el rail queda pegado
al contenido en lugar de irse al borde. Se aplicó también al hero para que el
póster y el título queden alineados con el cuerpo en cualquier tamaño.

### 2. Iconos / SVG en las tarjetas del rail

Cada tarjeta del rail ahora abre con un "chip" de icono redondeado:

- **Logros** (`TitleBadgesCard`): trofeo (`TrophyIcon`) en un chip con degradado
  ámbar→amarillo y un brillo cálido en la esquina (`blur-2xl`) para que destaque
  del resto y anime a conseguir los logros. Se añadió un subtítulo
  "{earned} de {total} desbloqueados" (clave i18n `libraryV2.detail.achievementsCount`)
  como gancho motivacional. Esta tarjeta también se usa en la ficha móvil, así
  que la mejora se ve en todos los tamaños.
- **Detalles**: `InfoIcon` en chip `bg-primary/10`.
- **Disponible en**: `MonitorPlayIcon` en chip `bg-primary/10`.
- **Tu progreso** (anime): `TrendingUpIcon` en chip `bg-primary/10`, por
  coherencia con las demás.

## Por qué

El usuario reportó que en su monitor Samsung de 27" la sección de
Logros/Detalles/Disponible en "salía muy arriba" y no se adaptaba. La causa era
el estiramiento sin tope de ancho; centrar y limitar a `max-w-7xl` lo resuelve
sin tocar el comportamiento en pantallas medianas/pequeñas. Los iconos dan
jerarquía visual y hacen el cuadro de logros más llamativo.

## Archivos tocados

- `src/features/library-v2/components/desktop-series-detail.tsx`
- `src/features/library-v2/components/title-badges-card.tsx`
- `src/i18n/messages/es.json`, `src/i18n/messages/en.json`
