"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "../actions";
import { type CommentCreateInput, commentCreateSchema } from "../schemas";

type Props = {
  source: "tmdb" | "anilist";
  sourceId: string;
  kind: "movie" | "tv" | "anime";
};

export function CommentForm({ source, sourceId, kind }: Props) {
  const t = useTranslations("comments");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentCreateInput>({
    resolver: zodResolver(commentCreateSchema),
    defaultValues: { source, sourceId, kind, body: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createComment(values);
      if (result.ok) {
        toast.success(t("published"));
        reset({ source, sourceId, kind, body: "" });
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <Textarea
        rows={3}
        aria-invalid={Boolean(errors.body)}
        placeholder={t("placeholder")}
        {...register("body")}
      />
      <div className="flex items-center justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("publishing") : t("publish")}
        </Button>
      </div>
    </form>
  );
}
