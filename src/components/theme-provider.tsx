/**
 * Pass-through wrapper kept for backwards compatibility with existing imports.
 *
 * We deliberately do NOT use `next-themes`: in 0.4.x it injects a `<script>`
 * tag inline in the React tree which React 19 (Next 16) refuses to execute
 * and warns about. Theme detection is done in CSS via
 * `@media (prefers-color-scheme: dark)` in `globals.css` — no JS needed for
 * the "follow system" experience we ship today.
 *
 * Extra props (`attribute`, `defaultTheme`, `enableSystem`,
 * `disableTransitionOnChange`) are accepted but ignored for compatibility
 * with the previous next-themes-based signature.
 */
type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
