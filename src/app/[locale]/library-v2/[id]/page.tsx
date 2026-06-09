import { DesktopSeriesDetail } from "@/features/library-v2/components/desktop-series-detail";

export const dynamic = "force-dynamic";

type DetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ log?: string }>;
};

// Sandbox entry point; the real app renders the same <DesktopSeriesDetail />
// from /library/[id] on desktop devices.
export default async function LibraryV2DetailPage({ params, searchParams }: DetailPageProps) {
  const { id } = await params;
  const { log } = (await searchParams) ?? {};
  return <DesktopSeriesDetail id={id} defaultOpenLog={log === "true"} />;
}
