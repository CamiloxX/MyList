// The auth pages handle their own split-panel layouts so this wrapper just
// renders children full-bleed.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
