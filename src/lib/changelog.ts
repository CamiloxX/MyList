import type { Locale } from "@/i18n/routing";

export type ChangelogTag = "new" | "improvement" | "fix";

export type ChangelogEntry = {
  /** ISO date (YYYY-MM-DD). Used for grouping and ordering. */
  date: string;
  tag: ChangelogTag;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

/**
 * Single source of truth for user-facing release notes. Add new entries to
 * the TOP of the array — the page renders them in array order (newest first).
 * Write descriptions in plain language, not commit-speak.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-05-26",
    tag: "new",
    title: {
      es: "Buscar y ordenar dentro de tu biblioteca",
      en: "Search and sort inside your library",
    },
    description: {
      es: "Ahora puedes buscar por título dentro de tu biblioteca y ordenarla por fecha de agregado, título (A-Z / Z-A) o año del título (más nuevo / más antiguo).",
      en: "You can now search by title inside your library and sort it by added date, title (A-Z / Z-A) or release year (newest / oldest).",
    },
  },
  {
    date: "2026-05-26",
    tag: "improvement",
    title: {
      es: "Búsqueda en español e inglés",
      en: "Search in Spanish and English",
    },
    description: {
      es: "Ahora puedes buscar películas y series escribiendo el título en español o en inglés y va a aparecer en cualquiera de los dos.",
      en: "You can now search movies and series with the Spanish or the English title — both will match.",
    },
  },
  {
    date: "2026-05-26",
    tag: "fix",
    title: {
      es: "Marcar como “Viendo” ya no abre la plataforma",
      en: "Setting status to “Watching” no longer opens the platform",
    },
    description: {
      es: "Cambiar el estado a Viendo solo actualiza el estado. Si quieres ir a Netflix, Disney+ u otra, usa el botón “Ver ahora” en la página del título.",
      en: "Changing status to Watching just updates the status. To jump to Netflix, Disney+ or another platform use the “Watch now” button on the title page.",
    },
  },
  {
    date: "2026-05-23",
    tag: "new",
    title: {
      es: "7 nuevos logros (oro y plata)",
      en: "7 new achievements (gold and silver)",
    },
    description: {
      es: "Se sumaron logros de oro y plata por horas vistas, racha de días, variedad de géneros y más. Mírelos en la sección de Logros.",
      en: "Added gold and silver achievements for hours watched, day streaks, genre variety and more. Check the Achievements page.",
    },
  },
  {
    date: "2026-05-23",
    tag: "new",
    title: {
      es: "Botón “Ver ahora” en cada título",
      en: "“Watch now” button on every title",
    },
    description: {
      es: "Desde la página de detalle de cualquier película, serie o anime puedes saltar directo a la plataforma oficial (Netflix, Disney+, HBO Max, Prime Video, Crunchyroll, MyAnimeList…).",
      en: "From any movie, series or anime detail page you can jump straight to the official platform (Netflix, Disney+, HBO Max, Prime Video, Crunchyroll, MyAnimeList…).",
    },
  },
  {
    date: "2026-05-23",
    tag: "improvement",
    title: {
      es: "Logos originales de las plataformas",
      en: "Original platform logos",
    },
    description: {
      es: "Las plataformas ahora se muestran con sus íconos reales (HBO Max, Disney+, Crunchyroll, Prime Video…) en vez de chips de texto.",
      en: "Platforms now render with their real icons (HBO Max, Disney+, Crunchyroll, Prime Video…) instead of plain text chips.",
    },
  },
  {
    date: "2026-05-20",
    tag: "new",
    title: {
      es: "Buscador en la barra inferior (móvil)",
      en: "Search in the mobile bottom nav",
    },
    description: {
      es: "Se añadió un acceso directo al buscador desde la barra inferior en móvil para llegar más rápido.",
      en: "Added a quick search shortcut to the mobile bottom nav so it's one tap away.",
    },
  },
  {
    date: "2026-05-20",
    tag: "fix",
    title: {
      es: "Autores reales en los comentarios",
      en: "Real authors in comments",
    },
    description: {
      es: "Los comentarios ya no se ven como “anónimo”: muestran el nombre y avatar real de quien escribió.",
      en: "Comments no longer show as “anonymous” — they display the real author name and avatar.",
    },
  },
  {
    date: "2026-05-19",
    tag: "new",
    title: {
      es: "Nuevo logo (zorrito) y favicon",
      en: "New logo (fox) and favicon",
    },
    description: {
      es: "Se actualizó la imagen de marca con un nuevo logo en forma de zorro, junto con el favicon y el ícono para iOS.",
      en: "Refreshed the brand mark with a new fox-shaped logo, plus matching favicon and iOS icon.",
    },
  },
  {
    date: "2026-05-19",
    tag: "new",
    title: {
      es: "Exportar tu biblioteca",
      en: "Export your library",
    },
    description: {
      es: "Desde Ajustes puedes descargar todo lo que tienes registrado en JSON, CSV o TXT para guardarlo o moverlo a otra app.",
      en: "From Settings you can download everything you've logged in JSON, CSV or TXT to back it up or move to another app.",
    },
  },
];
