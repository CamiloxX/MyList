/**
 * The PushManager.subscribe API needs the VAPID public key as a BufferSource,
 * but env vars are base64url-encoded strings. This converts the latter to
 * the former. Lifted from the MDN reference and trimmed.
 *
 * Returns Uint8Array<ArrayBuffer> (backed by a fresh ArrayBuffer, not
 * SharedArrayBuffer) so the DOM PushManager typings accept it directly.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}
