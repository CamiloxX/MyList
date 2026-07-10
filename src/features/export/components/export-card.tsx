"use client";

import { DownloadIcon, FileJsonIcon, FileTextIcon, TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportLibrary } from "../actions";
import type { ExportFormat } from "../format";

const FORMAT_ICON: Record<ExportFormat, typeof FileJsonIcon> = {
  json: FileJsonIcon,
  csv: TableIcon,
  txt: FileTextIcon,
};

export function ExportCard() {
  const t = useTranslations("settings.export");
  const [pending, setPending] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setPending(format);
    try {
      const result = await exportLibrary(format);
      if (!result.ok) {
        toast.error(t(`errors.${result.error}` as "errors.queryFailed"));
        return;
      }
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(t("successToast", { filename: result.filename }));
    } catch (err) {
      console.warn("[exportLibrary] client error:", err);
      toast.error(t("errors.queryFailed"));
    } finally {
      setPending(null);
    }
  };

  const formats: { format: ExportFormat; recommended?: boolean }[] = [
    { format: "json", recommended: true },
    { format: "csv" },
    { format: "txt" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {formats.map(({ format, recommended }) => {
          const Icon = FORMAT_ICON[format];
          const isPending = pending === format;
          return (
            <li
              key={format}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t(`formats.${format}.title`)}</span>
                    {recommended ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {t("recommended")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(`formats.${format}.description`)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleExport(format)}
                disabled={pending !== null}
              >
                <DownloadIcon className="size-4" />
                {isPending ? t("downloading") : t("download")}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
