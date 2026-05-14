"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "../actions";
import { type PostCreateInput, postCreateSchema } from "../schemas";

export function PostCreateForm({ threadId }: { threadId: string }) {
  const t = useTranslations("forum");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { threadId, body: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPost(values);
      if (result.ok) {
        toast.success(t("postPublished"));
        reset({ threadId, body: "" });
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <input type="hidden" {...register("threadId")} value={threadId} />
      <Textarea
        rows={4}
        aria-invalid={Boolean(errors.body)}
        placeholder={t("replyPlaceholder")}
        {...register("body")}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t("markdownHint")}</p>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("publishing") : t("reply")}
        </Button>
      </div>
    </form>
  );
}
