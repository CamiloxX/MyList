import { DesktopLibrary } from "@/features/library-v2/components/desktop-library";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; genre?: string }>;
};

// Sandbox entry point for the desktop library; the real app renders the same
// <DesktopLibrary /> from /library on desktop devices.
export default async function LibraryV2Page({ searchParams }: PageProps) {
  return <DesktopLibrary searchParams={await searchParams} />;
}
