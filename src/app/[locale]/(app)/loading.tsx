import { LoadingScreen } from "@/components/loading-screen";

/**
 * Default loading boundary for every protected route. Next renders this
 * inside the AppLayout while the page's server work resolves, so the user
 * always sees a branded spinner instead of a frozen header.
 */
export default function AppLoading() {
  return <LoadingScreen />;
}
