# 012 — Redirecciones Inteligentes de Estado

Hemos implementado un flujo dinámico que mejora la interacción y reduce los clics del usuario al actualizar los estados de su biblioteca:

## Cambios y Racionales

1. **Estado "Viendo" (`watching`)**:
   - **Comportamiento**: Abre inmediatamente una pestaña nueva y redirige al usuario a la plataforma oficial de visualización (enlace de TMDB Watch Providers en Colombia `"CO"`, Crunchyroll/AniList para anime, o búsqueda en Google).
   - **Racional**: Si el usuario marca algo como "Viendo", su intención inmediata es reproducir el contenido. Le ahorramos el trabajo de buscar la plataforma de forma manual.
   - **Implementación**: Usamos una ventana vacía intermedia (`about:blank`) para evitar que el navegador bloquee la apertura como ventana emergente (popup) al originarse tras llamadas asíncronas de base de datos.

2. **Estado "Vista" (`watched`)**:
   - **Comportamiento**: Redirige al usuario al detalle de la obra `/library/[id]?log=true`, forzando a que el cajón emergente de registrar visualización se despliegue de manera automática.
   - **Racional**: Marcar como "Vista" requiere registrar la fecha, calificación y notas de visualización de forma inmediata. Al abrir el cajón automáticamente, simplificamos el registro.
   - **Implementación**: La página de detalle en el servidor recibe e interpreta los `searchParams` y propaga la propiedad `defaultOpen` al componente `WatchEntryTrigger`. Cuando el cajón se cierra, limpiamos el query param `log` de la URL usando `router.replace` de forma transparente.

3. **Botón "Ver ahora" en Detalles**:
   - **Comportamiento**: Añadimos un botón explícito con la etiqueta "Ver ahora" al lado del tráiler en la página de detalles de biblioteca. Al pulsarlo, abre directamente la plataforma de streaming oficial.
   - **Racional**: Permite que el usuario acceda de forma directa al streaming oficial en cualquier momento sin tener que cambiar de estado.
   - **Implementación**: Cargamos la URL del streaming en paralelo en el servidor (Server Component) para que el enlace sea estático en el HTML nativo, eliminando cualquier posible retraso o bloqueo de popup en el navegador.

## Modificaciones Técnicas

- `src/features/library/actions.ts`:
  - `updateLibraryStatus` ahora retorna el objeto actualizado de base de datos.
  - Se agregó la Server Action `getMediaWatchUrl` para buscar y mapear los proveedores de streaming y links de animes.
- `src/features/library/components/status-select.tsx`:
  - Incorporamos navegación inteligente de estado.
- `src/features/library/components/watch-entry-trigger.tsx`:
  - Soportamos `defaultOpen` y añadimos lógica de limpieza de parámetros de URL al cerrarse el cajón.
- `src/app/[locale]/(app)/library/[id]/page.tsx`:
  - Leemos de forma asíncrona `searchParams` y los propagamos a la UI.
  - Cargamos `getMediaWatchUrl` en paralelo en el servidor y renderizamos un enlace estilizado como un botón verde premium ("Ver ahora") con icono de reproducción.
- `src/i18n/messages/es.json` y `en.json`:
  - Añadimos la clave de traducción `"watchNow"` para soporte multilingüe.
