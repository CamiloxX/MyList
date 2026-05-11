/**
 * Decorative radial-gradient blobs shown behind the mobile auth flows.
 * Pure visual; absolutely positioned and `pointer-events-none`.
 */
export function AuthMobileBlobs() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full md:hidden"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-24 size-80 rounded-full md:hidden"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 70%)",
        }}
      />
    </>
  );
}
