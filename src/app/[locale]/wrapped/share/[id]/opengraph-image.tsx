import { ImageResponse } from "next/og";
import { getSharedWrapped } from "@/features/wrapped/queries";

// First use of next/og in the repo: Next links this 1200x630 PNG as og:image
// for the shared Wrapped page by file convention, so pasting the link in
// WhatsApp/X unfurls into a rich card. Ships with Next — not a new dependency.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COPY = {
  es: { titles: "títulos", hours: "horas", genre: "género del año", by: "El año de" },
  en: { titles: "titles", hours: "hours", genre: "genre of the year", by: "A year by" },
} as const;

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const lang = locale === "en" ? "en" : "es";
  const shared = await getSharedWrapped(id, lang);
  const t = COPY[lang];

  if (!shared) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontSize: 72,
          fontWeight: 800,
        }}
      >
        MyList
      </div>,
      size,
    );
  }

  const { wrapped, displayName } = shared;
  const poster = wrapped.topRated[0]?.poster_url ?? null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1e1033 55%, #3b1470 100%)",
        color: "#fafafa",
        padding: 64,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            <span>my</span>
            <span style={{ color: "#a78bfa" }}>list</span>
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, marginTop: 8 }}>
            Wrapped {wrapped.year}
          </div>
          {displayName ? (
            <div style={{ display: "flex", fontSize: 30, color: "#c4b5fd", marginTop: 4 }}>
              {t.by} {displayName}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 64, fontWeight: 800 }}>{wrapped.totalTitles}</span>
            <span style={{ fontSize: 26, color: "#c4b5fd" }}>{t.titles}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 64, fontWeight: 800 }}>{wrapped.totalHours}</span>
            <span style={{ fontSize: 26, color: "#c4b5fd" }}>{t.hours}</span>
          </div>
          {wrapped.topGenre ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 64, fontWeight: 800 }}>{wrapped.topGenre}</span>
              <span style={{ fontSize: 26, color: "#c4b5fd" }}>{t.genre}</span>
            </div>
          ) : null}
        </div>
      </div>

      {poster ? (
        // biome-ignore lint/performance/noImgElement: ImageResponse (satori) only understands plain <img>
        <img
          src={poster}
          alt=""
          width={300}
          height={450}
          style={{ borderRadius: 16, objectFit: "cover", marginLeft: 48 }}
        />
      ) : null}
    </div>,
    size,
  );
}
