import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ViewTransitions } from "next-view-transitions";
import { BackgroundParticles } from "@/components/background-particles";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/features/shell/components/command-palette";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display font used for the brand mark and auth-page headlines (Concept A
// of the Logo Exploration design). Loaded weights match the bold/extrabold
// usages in the design.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: t("title"),
    description: t("tagline"),
    manifest: "/manifest.webmanifest",
    applicationName: t("title"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: t("title"),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <head>
        {/* Apply stored theme class before first paint to avoid FOUC.
            Reads localStorage('mylist-theme'); absence falls through to the
            CSS @media (prefers-color-scheme) default. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted inline init script with no user input
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mylist-theme');if(t==='dark'||t==='light'){document.documentElement.classList.add(t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ViewTransitions>
          <NextIntlClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <BackgroundParticles />
              {children}
              <CommandPalette />
              <Toaster />
              <ServiceWorkerRegister />
            </ThemeProvider>
          </NextIntlClientProvider>
        </ViewTransitions>
      </body>
    </html>
  );
}
