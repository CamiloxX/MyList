import { LoadingScreen } from "@/components/loading-screen";

/**
 * Discover-specific loading state. Same component as the global one — present
 * here so that navigation TO /discover (which can take a while when OMDb +
 * watch-providers enrichment fires for the first time) shows the brand
 * loader rather than the inherited skeleton from the parent layout.
 */
export default function DiscoverLoading() {
  return <LoadingScreen />;
}
