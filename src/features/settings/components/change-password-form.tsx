"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, KeyRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/features/auth/actions";
import { type ChangePasswordInput, changePasswordSchema } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";

type FieldName = keyof ChangePasswordInput;

export function ChangePasswordForm() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState<Record<FieldName, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await changePassword(values);
      if (result.ok) {
        toast.success(t("settings.security.successToast"));
        reset();
        return;
      }
      toast.error(t(`auth.errors.${result.errorKey}` as "auth.errors.reviewFields"));
      if (result.fieldErrors) {
        for (const [field, key] of Object.entries(result.fieldErrors)) {
          if (key) {
            setError(field as FieldName, {
              message: t(`auth.errors.${key}` as "auth.errors.invalidEmail"),
            });
          }
        }
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PasswordField
        id="currentPassword"
        label={t("settings.security.currentPassword")}
        autoComplete="current-password"
        register={register("currentPassword")}
        error={errors.currentPassword?.message}
        visible={visible.currentPassword}
        onToggle={() => setVisible((prev) => ({ ...prev, currentPassword: !prev.currentPassword }))}
        toggleAria={t("settings.security.toggleVisibility")}
      />
      <PasswordField
        id="newPassword"
        label={t("settings.security.newPassword")}
        autoComplete="new-password"
        register={register("newPassword")}
        error={errors.newPassword?.message}
        hint={t("settings.security.newPasswordHint")}
        visible={visible.newPassword}
        onToggle={() => setVisible((prev) => ({ ...prev, newPassword: !prev.newPassword }))}
        toggleAria={t("settings.security.toggleVisibility")}
      />
      <PasswordField
        id="confirmPassword"
        label={t("settings.security.confirmPassword")}
        autoComplete="new-password"
        register={register("confirmPassword")}
        error={errors.confirmPassword?.message}
        visible={visible.confirmPassword}
        onToggle={() => setVisible((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
        toggleAria={t("settings.security.toggleVisibility")}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-1.5">
          <KeyRoundIcon className="size-4" aria-hidden />
          {isPending ? t("settings.security.submitting") : t("settings.security.submit")}
        </Button>
      </div>
    </form>
  );
}

function PasswordField({
  id,
  label,
  hint,
  register,
  error,
  visible,
  onToggle,
  toggleAria,
  autoComplete,
}: {
  id: string;
  label: string;
  hint?: string;
  register: ReturnType<ReturnType<typeof useForm<ChangePasswordInput>>["register"]>;
  error?: string;
  visible: boolean;
  onToggle: () => void;
  toggleAria: string;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          {...register}
          className={cn("pr-10")}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleAria}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {visible ? (
            <EyeOffIcon className="size-4" aria-hidden />
          ) : (
            <EyeIcon className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
