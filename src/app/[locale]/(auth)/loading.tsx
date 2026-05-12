import { LoadingScreen } from "@/components/loading-screen";

/**
 * Loading boundary for the auth route group (login / register). Shown while
 * the page's server work resolves — including the artificial LOADING_DEMO_MS
 * delay when present.
 */
export default function AuthLoading() {
  return <LoadingScreen fullScreen />;
}
