"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { createThread } from "../actions";
import { type ThreadCreateInput, threadCreateSchema } from "../schemas";

type Props = {
  categoryId: string;
  categorySlug: string;
};

export function ThreadCreateForm({ categoryId, categorySlug }: Props) {
  const t = useTranslations("forum");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ThreadCreateInput>({
    resolver: zodResolver(threadCreateSchema),
    defaultValues: { categoryId, title: "", body: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createThread(values);
      if (result.ok) {
        toast.success(t("threadCreated"));
        router.push(`/forum/thread/${result.data.threadId}`);
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" {...register("categoryId")} value={categoryId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="thread-title">{t("titleLabel")}</Label>
        <Input
          id="thread-title"
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
          placeholder={t("titlePlaceholder")}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-xs text-destructive">{t("errors.titleRequired")}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="thread-body">{t("bodyLabel")}</Label>
        <Textarea
          id="thread-body"
          rows={8}
          aria-invalid={Boolean(errors.body)}
          placeholder={t("bodyPlaceholder")}
          {...register("body")}
        />
        <p className="text-xs text-muted-foreground">{t("markdownHint")}</p>
        {errors.body ? (
          <p className="text-xs text-destructive">{t("errors.bodyRequired")}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => router.push(`/forum/${categorySlug}`)}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("publishing") : t("publish")}
        </Button>
      </div>
    </form>
  );
}
