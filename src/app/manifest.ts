import type { MetadataRoute } from "next";

/**
 * PWA manifest. The default locale strings live here because the manifest is
 * a single global resource — per-locale variants would need separate routes.
 * Spanish is the app's default locale, so we use it.
 *
 * The icon is declared with `sizes: "any"` so the same 500x500 PNG covers
 * every surface (home screen, splash, share sheet). Browsers downscale on
 * the fly. If we ever ship maskable icons or finer-grained sizes, add more
 * entries here.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyList",
    short_name: "MyList",
    description: "Tu biblioteca personal de películas, series y anime.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "es",
    icons: [
      {
        src: "/iconomylist.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
