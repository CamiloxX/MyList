/**
 * Downscales and re-encodes an image in the browser before upload. This keeps
 * payloads tiny (well under the Server Action body limit) so users can pick any
 * photo — even a huge one straight from a phone — without it failing or needing
 * to know about sizes/formats. Output is WebP.
 */
export async function downscaleImageToWebp(
  file: File | Blob,
  maxDim = 1600,
  quality = 0.82,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) throw new Error("Image encode failed");
    return blob;
  } finally {
    bitmap.close();
  }
}
