import { DesktopTitlePreview } from "@/features/library-v2/components/desktop-title-preview";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{ locale: string; source: string; kind: string; sourceId: string }>;
};

export default async function TitlePreviewPage({ params }: PreviewPageProps) {
  const { locale, source, kind, sourceId } = await params;
  return <DesktopTitlePreview locale={locale} source={source} kind={kind} sourceId={sourceId} />;
}
