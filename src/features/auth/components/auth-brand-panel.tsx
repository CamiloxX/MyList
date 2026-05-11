import { getTranslations } from "next-intl/server";
import { BrandMark, Wordmark } from "@/components/brand/brand-mark";

/**
 * Desktop branding panel shown on the left of the auth split-screen.
 * Implements the gradient + decorative triangles + headline + stats from
 * the MyList Logo Exploration design.
 */
export async function AuthBrandPanel() {
  const t = await getTranslations("auth.brand");

  return (
    <aside
      className="relative hidden overflow-hidden text-white md:flex md:flex-col md:gap-12 md:px-12 md:py-10"
      style={{
        background: "linear-gradient(155deg, #5B21B6 0%, #7C3AED 55%, #A855F7 100%)",
      }}
    >
      {/* Decorative play triangles for visual depth */}
      <svg
        aria-hidden
        role="presentation"
        focusable="false"
        className="pointer-events-none absolute -right-12 top-12 opacity-15"
        width="320"
        height="320"
        viewBox="0 0 100 100"
      >
        <path d="M30 20 L30 80 L75 50 Z" fill="#fff" />
      </svg>
      <svg
        aria-hidden
        role="presentation"
        focusable="false"
        className="pointer-events-none absolute -bottom-10 left-6 opacity-10"
        width="200"
        height="200"
        viewBox="0 0 100 100"
      >
        <path d="M30 20 L30 80 L75 50 Z" fill="#fff" />
      </svg>

      <div className="relative flex items-center gap-3">
        <BrandMark size={40} />
        <Wordmark size={24} variant="on-brand" />
      </div>

      <div className="relative mt-auto">
        <h1
          className="font-display font-extrabold leading-[1.05] text-white"
          style={{ fontSize: 44, letterSpacing: "-0.035em" }}
        >
          {t("headlinePart1")}
          <br />
          {t("headlinePart2")}
          <br />
          <span style={{ color: "#A855F7" }}>{t("headlinePart3")}</span>
        </h1>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/80">{t("description")}</p>

        <dl className="mt-7 flex gap-6 border-t border-white/20 pt-6">
          {(
            [
              ["12.4k", t("statsSeries")],
              ["860k", t("statsEpisodes")],
              ["3.2k", t("statsUsers")],
            ] as const
          ).map(([value, label]) => (
            <div key={label}>
              <dt
                className="font-display font-extrabold text-white"
                style={{ fontSize: 22, letterSpacing: "-0.02em" }}
              >
                {value}
              </dt>
              <dd className="mt-0.5 text-[11px] text-white/65">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
