"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { signUp } from "../actions";
import { type RegisterInput, registerSchema } from "../schemas";
import { GoogleButton } from "./google-button";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signUp(values);

      if (!result.ok) {
        toast.error(t(`auth.errors.${result.errorKey}` as "auth.errors.reviewFields"));
        if (result.fieldErrors) {
          for (const [field, key] of Object.entries(result.fieldErrors)) {
            if (key) {
              setError(field as keyof RegisterInput, {
                message: t(`auth.errors.${key}` as "auth.errors.invalidEmail"),
              });
            }
          }
        }
        return;
      }

      if (result.status === "signed_in") {
        toast.success(t("auth.register.successToast"));
        router.replace(result.redirectTo as "/library");
        router.refresh();
        return;
      }

      setConfirmationSent(true);
      toast.success(t("auth.register.confirmationSentToast"));
    });
  });

  if (confirmationSent) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h2
          className="font-display font-extrabold text-[#0F172A]"
          style={{ fontSize: 24, letterSpacing: "-0.02em" }}
        >
          {t("auth.register.confirmationSentTitle")}
        </h2>
        <p className="text-sm text-[#6D5FA8]">{t("auth.register.confirmationSentBody")}</p>
        <Link href="/login" className="mt-2 text-sm font-semibold text-[#7C3AED] hover:underline">
          {t("auth.register.backToLogin")}
        </Link>
      </div>
    );
  }

  const fieldInputClass =
    "h-12 w-full rounded-xl border border-[rgba(91,33,182,0.16)] bg-white px-4 text-[15px] text-[#0F172A] placeholder:text-[#6D5FA8]/70 outline-none transition-all focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/20 aria-[invalid=true]:border-destructive";
  const fieldLabelClass = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D5FA8]";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className={fieldLabelClass}>
          {t("auth.fields.displayName")}
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.displayName)}
          {...register("displayName")}
          className={fieldInputClass}
        />
        {errors.displayName ? (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={fieldLabelClass}>
          {t("auth.fields.email")}
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
          className={fieldInputClass}
        />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={fieldLabelClass}>
          {t("auth.fields.password")}
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
            className={`${fieldInputClass} pr-12`}
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
        ) : (
          <p className="text-xs text-[#6D5FA8]">{t("auth.register.passwordHint")}</p>
        )}
      </div>

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
            {t("auth.register.submitting")}
          </>
        ) : (
          <>
            {t("auth.register.submit")}
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

      <GoogleButton label={t("auth.google.register")} />
    </form>
  );
}
