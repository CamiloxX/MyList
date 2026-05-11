"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "../actions";
import { type LoginInput, loginSchema } from "../schemas";
import { GoogleButton } from "./google-button";

/**
 * Login form styled to match the MyList Concept A auth screens:
 * purple primary, rounded inputs with focus ring glow, eye toggle for the
 * password field, "Ingresar →" submit, divider + Google sign-in.
 */
export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signIn(values);
      if (result.ok) {
        router.replace(result.redirectTo as "/library");
        router.refresh();
        return;
      }
      toast.error(t(`auth.errors.${result.errorKey}` as "auth.errors.reviewFields"));
      if (result.fieldErrors) {
        for (const [field, key] of Object.entries(result.fieldErrors)) {
          if (key) {
            setError(field as keyof LoginInput, {
              message: t(`auth.errors.${key}` as "auth.errors.invalidEmail"),
            });
          }
        }
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D5FA8]"
        >
          {t("auth.fields.email")}
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
          className="h-12 rounded-xl border border-[rgba(91,33,182,0.16)] bg-white px-4 text-[15px] text-[#0F172A] placeholder:text-[#6D5FA8]/70 outline-none transition-all focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/20 aria-[invalid=true]:border-destructive"
        />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D5FA8]"
          >
            {t("auth.fields.password")}
          </label>
          <Link href="/login" className="text-[11px] font-semibold text-[#7C3AED] hover:underline">
            {t("auth.login.forgotPassword")}
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
            className="h-12 w-full rounded-xl border border-[rgba(91,33,182,0.16)] bg-white pl-4 pr-12 text-[15px] text-[#0F172A] placeholder:text-[#6D5FA8]/70 outline-none transition-all focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/20 aria-[invalid=true]:border-destructive"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={t("auth.fields.password")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D5FA8] transition-colors hover:text-[#0F172A]"
          >
            {showPassword ? (
              <EyeOffIcon className="size-[18px]" />
            ) : (
              <EyeIcon className="size-[18px]" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <label className="hidden cursor-pointer select-none items-center gap-2.5 text-[13px] text-[#0F172A] md:flex">
        <button
          type="button"
          role="switch"
          aria-checked={rememberMe}
          onClick={() => setRememberMe((current) => !current)}
          className="flex size-[18px] items-center justify-center rounded-md border-[1.5px] transition-colors"
          style={{
            borderColor: rememberMe ? "#7C3AED" : "rgba(91,33,182,0.16)",
            background: rememberMe ? "#7C3AED" : "#fff",
          }}
        >
          {rememberMe ? (
            <svg
              aria-hidden
              role="presentation"
              focusable="false"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : null}
        </button>
        {t("auth.login.rememberMe")}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] transition-all hover:bg-[#6D29D6] disabled:cursor-wait disabled:opacity-85"
      >
        {isPending ? (
          <>
            <span
              aria-hidden
              className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            {t("auth.login.submittingArrow")}
          </>
        ) : (
          <>
            {t("auth.login.submitArrow")}
            <span aria-hidden>→</span>
          </>
        )}
      </button>

      <div className="my-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-[rgba(91,33,182,0.16)]" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6D5FA8]">
          {t("auth.login.continueWith")}
        </span>
        <span className="h-px flex-1 bg-[rgba(91,33,182,0.16)]" />
      </div>

      <GoogleButton />
    </form>
  );
}
