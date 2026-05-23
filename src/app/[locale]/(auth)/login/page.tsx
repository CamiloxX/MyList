import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand/brand-mark";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthMobileBlobs } from "@/features/auth/components/auth-mobile-blobs";
import { LoginForm } from "@/features/auth/components/login-form";
import { Link } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";

export default async function LoginPage() {
  await loadingDemoDelay();
  const t = await getTranslations();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] md:grid md:grid-cols-[1fr_1.1fr]">
      <AuthMobileBlobs />
      <AuthBrandPanel />

      {/* Form panel — mobile single column, desktop right side */}
      <div className="relative flex min-h-screen flex-col px-7 pb-8 pt-14 md:items-center md:justify-center md:px-14 md:pt-10">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
          {/* Mobile-only brand block (desktop branding lives in the left panel) */}
          <div className="mb-9 flex flex-col items-start gap-4 md:hidden">
            <BrandMark size={56} />
            <h1
              className="font-display font-extrabold leading-[1.05] text-[#0F172A]"
              style={{ fontSize: 38, letterSpacing: "-0.04em" }}
            >
              {t("auth.login.welcomeLine1")}
              <br />
              {t("auth.login.welcomeLine2")}
              <span style={{ color: "#7C3AED" }}>.</span>
            </h1>
            <p className="text-sm text-[#6D5FA8]">{t("auth.brand.tagline")}</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden flex-col gap-2 md:flex">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7C3AED]">
              {t("auth.login.eyebrow")}
            </p>
            <h1
              className="font-display font-extrabold leading-[1.05] text-[#0F172A]"
              style={{ fontSize: 34, letterSpacing: "-0.035em" }}
            >
              {t("auth.login.subtitle")}
            </h1>
            <p className="text-[13.5px] text-[#6D5FA8]">
              {t("auth.login.noAccountPrompt")}{" "}
              <Link href="/register" className="font-semibold text-[#7C3AED] hover:underline">
                {t("auth.login.registerLinkLong")}
              </Link>
            </p>
          </div>

          <div className="mt-7">
            <LoginForm />
          </div>

          {/* Mobile-only footer link */}
          <div className="mt-auto pt-7 text-center md:hidden">
            <span className="text-[13px] text-[#6D5FA8]">{t("auth.login.newHerePrompt")} </span>
            <Link
              href="/register"
              className="text-[13px] font-semibold text-[#7C3AED] hover:underline"
            >
              {t("auth.login.createAccount")}
            </Link>
          </div>

          {/* Desktop-only terms */}
          <p className="mt-7 hidden text-center text-[11px] leading-relaxed text-[#6D5FA8] md:block">
            {t("auth.login.termsPrefix")}{" "}
            <Link href="/login" className="text-[#7C3AED] hover:underline">
              {t("auth.login.termsLink")}
            </Link>{" "}
            {t("auth.login.termsAnd")}{" "}
            <Link href="/login" className="text-[#7C3AED] hover:underline">
              {t("auth.login.privacyLink")}
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
