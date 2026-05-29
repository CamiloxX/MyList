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
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Comparte tus listas con un enlace",
      en: "Share your lists with a link",
    },
    description: {
      es: "Desde una lista, pulsa «Compartir» para generar un enlace: cualquiera que lo tenga puede verla (solo lectura), sin necesidad de cuenta. Puedes dejar de compartirla cuando quieras y vuelve a ser privada. Las listas siguen privadas hasta que tú las compartes.",
      en: "From a list, tap “Share” to generate a link: anyone with it can view the list (read-only), no account needed. You can stop sharing anytime and it goes private again. Lists stay private until you share them.",
    },
  },
  {
    date: "2026-05-28",
    tag: "improvement",
    title: {
      es: "Portada para tus listas",
      en: "Cover image for your lists",
    },
    description: {
      es: "Ahora cada lista puede tener su propia portada: súbela desde la lista. Si no subes ninguna, se muestra una portada de color generada automáticamente.",
      en: "Each list can now have its own cover image: upload one from the list. If you don't, a generated colored cover is shown by default.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Listas personalizadas",
      en: "Custom lists",
    },
    description: {
      es: "Crea tus propias listas (Para ver, Favoritas, lo que quieras), agrégales títulos desde su ficha con «Agregar a lista», y míralas o edítalas desde la sección Listas.",
      en: "Create your own lists (To watch, Favorites, whatever you like), add titles from their page with “Add to list”, and view or edit them from the Lists section.",
    },
  },
  {
    date: "2026-05-28",
    tag: "improvement",
    title: {
      es: "Tu racha cuenta con solo abrir la app",
      en: "Your streak counts just by opening the app",
    },
    description: {
      es: "Antes la racha solo subía al registrar una visualización. Ahora un día cuenta si abres la app o registras algo, así es más fácil mantenerla viva.",
      en: "Your streak used to grow only when you logged a view. Now a day counts if you open the app or log something, so it's easier to keep alive.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Sugerencias mientras buscas (escritorio)",
      en: "Search suggestions as you type (desktop)",
    },
    description: {
      es: "La barra de búsqueda del escritorio ahora muestra un desplegable con coincidencias (póster, título y año) mientras escribes. Elige una con el mouse o con las flechas + Enter.",
      en: "The desktop search bar now shows a dropdown of matches (poster, title and year) as you type. Pick one with the mouse or with arrow keys + Enter.",
    },
  },
  {
    date: "2026-05-28",
    tag: "improvement",
    title: {
      es: "Transición fluida del póster al abrir un título",
      en: "Smooth poster transition when opening a title",
    },
    description: {
      es: "Al tocar un título en tu biblioteca, el póster ahora se anima suavemente hasta su ficha (en navegadores compatibles), para una sensación más pulida.",
      en: "Tapping a title in your library now smoothly animates its poster into the detail page (on supported browsers) for a more polished feel.",
    },
  },
  {
    date: "2026-05-28",
    tag: "improvement",
    title: {
      es: "App más rápida y con soporte offline",
      en: "Faster app with offline support",
    },
    description: {
      es: "Si instalas MyList como app, ahora guarda en caché lo esencial: carga más rápido en visitas siguientes y muestra una pantalla básica aunque te quedes sin conexión.",
      en: "If you install MyList as an app, it now caches the essentials: faster loads on repeat visits and a basic screen even when you go offline.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Paleta de comandos (⌘K)",
      en: "Command palette (⌘K)",
    },
    description: {
      es: "Pulsa ⌘K (o Ctrl+K) en cualquier pantalla para saltar al instante a cualquier sección o lanzar una búsqueda, todo desde el teclado.",
      en: "Press ⌘K (or Ctrl+K) on any screen to instantly jump to any section or start a search, all from the keyboard.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Estadísticas avanzadas: actividad, rachas y géneros",
      en: "Advanced stats: activity, streaks and genres",
    },
    description: {
      es: "La sección de estadísticas ahora trae un mapa de actividad del último año (estilo GitHub), tu racha actual y la mejor racha de días seguidos viendo algo, tus géneros más vistos y la distribución por década de lo que ves.",
      en: "The stats section now includes a last-12-months activity heatmap (GitHub-style), your current and longest day streaks, your most-watched genres, and a by-decade breakdown of what you watch.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Estado de emisión y avisos de episodios por título",
      en: "Airing status and per-title episode alerts",
    },
    description: {
      es: "La ficha de series y anime ahora muestra si está «En emisión», «Finalizada» o «Próximamente», y cuándo sale el próximo episodio (fecha exacta para series vía TMDB y para anime vía AniList). Al agregar algo en emisión activamos automáticamente los avisos de nuevos episodios, y puedes encenderlos o apagarlos por título.",
      en: "Series and anime pages now show whether a title is «Airing», «Ended» or «Upcoming», plus when the next episode airs (exact date for series via TMDB and for anime via AniList). When you add something that's currently airing we auto-enable new-episode alerts, and you can turn them on or off per title.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Plataformas disponibles en el detalle",
      en: "Available platforms on the detail page",
    },
    description: {
      es: "La ficha de cada peli, serie o anime ahora muestra en qué plataformas está disponible (Netflix, Disney+, Prime, Crunchyroll…), además del botón para ir a verla.",
      en: "Each movie, series or anime page now shows which platforms it's available on (Netflix, Disney+, Prime, Crunchyroll…), alongside the button to go watch it.",
    },
  },
  {
    date: "2026-05-28",
    tag: "improvement",
    title: {
      es: "Acciones de comentarios en un menú de ⋮",
      en: "Comment actions in a ⋮ menu",
    },
    description: {
      es: "Editar y eliminar un comentario ahora viven en un menú de tres puntos más limpio, en vez de botones sueltos. La confirmación de borrado quedó dentro del mismo menú.",
      en: "Editing and deleting a comment now live in a tidier three-dot menu instead of loose buttons, with the delete confirmation tucked into the same menu.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Elige y cambia tu nombre de perfil",
      en: "Pick and change your profile name",
    },
    description: {
      es: "Si entraste con Google ya no te quedas con el nombre sacado de tu correo: tomamos tu nombre real de Google. Y desde Ajustes puedes cambiar tu nombre de perfil cuando quieras, con un límite de una vez al mes.",
      en: "If you signed in with Google you no longer get stuck with the name pulled from your email: we use your real Google name. And from Settings you can change your profile name whenever you like, limited to once a month.",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Avisos de episodios nuevos y resumen semanal",
      en: "New-episode alerts and weekly recap",
    },
    description: {
      es: "Si tienes las notificaciones activadas: cada día te avisamos cuando una serie o anime que estás viendo estrena episodio, y los domingos te llega un resumen de tu semana (lo que viste, lo que añadiste y los logros que desbloqueaste).",
      en: "With notifications on: we ping you each day when a series or anime you're watching drops a new episode, and on Sundays you get a recap of your week (what you watched, what you added, and the badges you unlocked).",
    },
  },
  {
    date: "2026-05-28",
    tag: "new",
    title: {
      es: "Notificaciones programadas (admin)",
      en: "Scheduled notifications (admin)",
    },
    description: {
      es: "Como admin ahora puedes dejar una notificación lista para que salga en una fecha y hora concretas, a todos los usuarios o solo a tus dispositivos para probar. Se gestionan desde Ajustes.",
      en: "As an admin you can now queue a notification to go out at a specific date and time, to everyone or just your own devices for testing. Manage them from Settings.",
    },
  },
  {
    date: "2026-05-28",
    tag: "fix",
    title: {
      es: "Ícono de notificación más nítido en Android",
      en: "Cleaner notification icon on Android",
    },
    description: {
      es: "El ícono que aparece en la barra de estado del teléfono al recibir una notificación ahora se ve como una silueta limpia en vez de un cuadrado blanco.",
      en: "The icon shown in your phone's status bar when a notification arrives now appears as a clean silhouette instead of a white square.",
    },
  },
  {
    date: "2026-05-27",
    tag: "improvement",
    title: {
      es: "Menú móvil más limpio",
      en: "Tidier mobile menu",
    },
    description: {
      es: "El menú inferior del celular ahora muestra solo las 4 opciones principales (Biblioteca, Buscar, Descubrir, Mes) y un botón “Más” que abre Logros, Ajustes y Novedades. Menos apretado, más fácil de tocar.",
      en: "The mobile bottom nav now shows just the 4 main tabs (Library, Search, Discover, Month) and a “More” button that opens Badges, Settings and What's new. Less cramped, easier to tap.",
    },
  },
  {
    date: "2026-05-27",
    tag: "new",
    title: {
      es: "Anuncios push para todos (admin)",
      en: "Broadcast push announcements (admin)",
    },
    description: {
      es: "Como admin ahora puedes mandar una notificación push a todos los usuarios desde Ajustes. Útil para avisar de novedades importantes o mantenimientos.",
      en: "As an admin you can now send a push notification to every user from Settings. Handy for announcing big changes or maintenance windows.",
    },
  },
  {
    date: "2026-05-27",
    tag: "new",
    title: {
      es: "Notificaciones push de logros",
      en: "Push notifications for badges",
    },
    description: {
      es: "Activa las notificaciones en Ajustes y recibirás un aviso en tu teléfono o computadora cada vez que desbloquees un logro nuevo, aunque no tengas la app abierta. En iPhone necesitas instalar MyList como app desde Safari (Compartir → Añadir a pantalla de inicio) para que funcionen.",
      en: "Enable notifications in Settings and you'll get a heads-up on your phone or computer whenever you unlock a new badge, even without the app open. On iPhone you need to install MyList as an app from Safari (Share → Add to Home Screen) for them to work.",
    },
  },
  {
    date: "2026-05-27",
    tag: "new",
    title: {
      es: "Toggle de tema claro/oscuro",
      en: "Light/dark theme toggle",
    },
    description: {
      es: "Botón nuevo en el header que te deja elegir entre tema claro, oscuro o seguir el del sistema. Tu elección se recuerda en este navegador.",
      en: "New header button that lets you pick light, dark or follow-system theme. Your choice is remembered on this browser.",
    },
  },
  {
    date: "2026-05-26",
    tag: "new",
    title: {
      es: "Botón “Instalar app” en el header móvil",
      en: "“Install app” button in the mobile header",
    },
    description: {
      es: "Si entras desde el celular y aún no tienes la app instalada, verás un icono de descarga en el header. En Android lanza el instalador nativo; en iPhone te explica los pasos para añadirla a la pantalla de inicio.",
      en: "If you visit from a phone and don't have the app installed yet, you'll see a download icon in the header. On Android it launches the native installer; on iPhone it shows the steps to add it to your home screen.",
    },
  },
  {
    date: "2026-05-26",
    tag: "new",
    title: {
      es: "MyList se puede instalar como app",
      en: "MyList is now installable as an app",
    },
    description: {
      es: "Desde el navegador del celular o del escritorio puedes instalar MyList como una app: arranca a pantalla completa, sin barra del navegador, y queda en tu pantalla de inicio. En Chrome/Edge: menú → “Instalar app”. En iPhone Safari: compartir → “Añadir a pantalla de inicio”.",
      en: "From your mobile or desktop browser you can install MyList as an app: it opens full-screen, no browser bar, and stays on your home screen. In Chrome/Edge: menu → “Install app”. On iPhone Safari: share → “Add to Home Screen”.",
    },
  },
  {
    date: "2026-05-26",
    tag: "new",
    title: {
      es: "“¿Qué veo hoy?” — sugerencia al azar",
      en: "“What should I watch?” — random pick",
    },
    description: {
      es: "Botón nuevo en la biblioteca que elige al azar algo de tu lista de pendientes. Pulsa “Otra” si la sugerencia no te convence.",
      en: "New button on the library that randomly picks something from your pending list. Hit “Another” if the suggestion isn't what you want.",
    },
  },
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
