/**
 * Official Google "G" multi-color glyph, sized for an inline button.
 */
export function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      role="img"
      aria-label="Google"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Google</title>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18a8.59 8.59 0 005.96-2.18l-2.92-2.26a5.4 5.4 0 01-3.04.86 5.36 5.36 0 01-5.02-3.69H1.05v2.32A9 9 0 009 18z"
      />
      <path fill="#FBBC05" d="M3.98 10.73a5.4 5.4 0 010-3.45V4.96H1.05a9 9 0 000 8.08z" />
      <path
        fill="#EA4335"
        d="M9 3.58a4.86 4.86 0 013.44 1.35l2.59-2.59A8.65 8.65 0 009 0a9 9 0 00-7.95 4.96l2.93 2.32A5.36 5.36 0 019 3.58z"
      />
    </svg>
  );
}
