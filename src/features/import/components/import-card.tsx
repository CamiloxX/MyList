"use client";

import { FileUpIcon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { importLibrary } from "../actions";
import {
  IMPORT_LIMITS,
  type ImportPayload,
  type ImportSummary,
  importPayloadSchema,
} from "../schemas";

type Step =
  | { phase: "idle" }
  | { phase: "picked"; filename: string; payload: ImportPayload }
  | { phase: "analyzed"; filename: string; payload: ImportPayload; preview: ImportSummary }
  | { phase: "done"; summary: ImportSummary };

export function ImportCard() {
  const t = useTranslations("settings.import");
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ phase: "idle" });
  const [policy, setPolicy] = useState<"merge" | "skip">("merge");
  const [isPending, startTransition] = useTransition();

  const handleFile = async (file: File) => {
    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      toast.error(t("errors.fileTooBig"));
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error(t("errors.invalidFile"));
      return;
    }
    const payload = importPayloadSchema.safeParse(parsed);
    if (!payload.success) {
      toast.error(t("errors.invalidFile"));
      return;
    }
    setStep({ phase: "picked", filename: file.name, payload: payload.data });
  };

  const analyze = () => {
    if (step.phase !== "picked" && step.phase !== "analyzed") return;
    const { filename, payload } = step;
    startTransition(async () => {
      const result = await importLibrary(payload, { dryRun: true, policy });
      if (!result.ok) {
        toast.error(t(`errors.${result.error}` as "errors.importFailed"));
        return;
      }
      setStep({ phase: "analyzed", filename, payload, preview: result.data });
    });
  };

  const commit = () => {
    if (step.phase !== "analyzed") return;
    const { payload } = step;
    startTransition(async () => {
      const result = await importLibrary(payload, { dryRun: false, policy });
      if (!result.ok) {
        toast.error(t(`errors.${result.error}` as "errors.importFailed"));
        return;
      }
      setStep({ phase: "done", summary: result.data });
      toast.success(
        t("successToast", { items: result.data.newItems, entries: result.data.newEntries }),
      );
    });
  };

  const reset = () => {
    setStep({ phase: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {step.phase === "idle" ? (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => inputRef.current?.click()}
        >
          <FileUpIcon className="size-4" />
          {t("pick")}
        </Button>
      ) : null}

      {step.phase === "picked" || step.phase === "analyzed" ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{step.filename}</span>
            <span className="text-xs text-muted-foreground">
              {t("localSummary", {
                items: step.payload.items.length,
                entries: step.payload.entries.length,
              })}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("policyLabel")}</span>
            <div className="flex gap-2">
              {(["merge", "skip"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPolicy(option)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    policy === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t(`policy.${option}`)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t(`policyHint.${policy}`)}</p>
          </div>

          {step.phase === "analyzed" ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
              <li>{t("preview.newItems", { count: step.preview.newItems })}</li>
              <li>{t("preview.mergedItems", { count: step.preview.mergedItems })}</li>
              <li>{t("preview.skippedItems", { count: step.preview.skippedItems })}</li>
              <li>{t("preview.newEntries", { count: step.preview.newEntries })}</li>
              <li>{t("preview.duplicateEntries", { count: step.preview.duplicateEntries })}</li>
              {step.preview.warnings > 0 ? (
                <li className="text-amber-600 dark:text-amber-400">
                  {t("preview.warnings", { count: step.preview.warnings })}
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="flex items-center gap-2">
            {step.phase === "picked" ? (
              <Button type="button" size="sm" onClick={analyze} disabled={isPending}>
                {isPending ? t("analyzing") : t("analyze")}
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={commit} disabled={isPending}>
                <UploadIcon className="size-4" />
                {isPending ? t("importing") : t("confirm")}
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={isPending}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {step.phase === "done" ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
          <span className="text-sm font-medium">{t("doneTitle")}</span>
          <p className="text-xs text-muted-foreground">
            {t("doneSummary", {
              items: step.summary.newItems,
              merged: step.summary.mergedItems,
              entries: step.summary.newEntries,
              duplicates: step.summary.duplicateEntries,
            })}
          </p>
          <Button type="button" size="sm" variant="outline" className="self-start" onClick={reset}>
            {t("again")}
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
