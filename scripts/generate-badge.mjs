// Generates public/badge.png — the monochrome notification badge Android shows
// in the status bar. Android ignores colour and renders only the alpha channel
// as a white silhouette, so we draw a white "list" glyph (three rounded bars)
// on a fully transparent background. No image dependency: we hand-encode an
// RGBA PNG with zlib. Re-run with `node scripts/generate-badge.mjs` if the mark
// ever changes.

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SIZE = 96; // 96x96 is the canonical Android badge size
const W = SIZE;
const H = SIZE;

// RGBA buffer, all transparent to start.
const px = Buffer.alloc(W * H * 4, 0);

function setPixel(x, y, a) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = 255; // R (white — colour is irrelevant on Android, kept white for other platforms)
  px[i + 1] = 255;
  px[i + 2] = 255;
  px[i + 3] = a; // alpha is what actually matters
}

// Draw a filled, horizontally-rounded bar from (x0..x1) at vertical band [y0..y1).
function roundedBar(x0, x1, y0, y1) {
  const r = (y1 - y0) / 2;
  const cyTop = y0 + r;
  const cyBot = y1 - r;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let inside = true;
      // round the left cap
      if (x < x0 + r) {
        const cx = x0 + r;
        const cy = y < cyTop ? cyTop : y > cyBot ? cyBot : y;
        inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      }
      // round the right cap
      if (inside && x > x1 - r) {
        const cx = x1 - r;
        const cy = y < cyTop ? cyTop : y > cyBot ? cyBot : y;
        inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      }
      if (inside) setPixel(x, y, 255);
    }
  }
}

// Three list rows. A small square "bullet" + a longer line, stacked — reads as
// a checklist even at ~24dp in the status bar.
const rows = [22, 44, 66]; // vertical centres
const barH = 12;
const bulletX0 = 16;
const bulletX1 = 30;
const lineX0 = 38;
const lineX1 = 80;
for (const cy of rows) {
  const y0 = cy - barH / 2;
  const y1 = cy + barH / 2;
  roundedBar(bulletX0, bulletX1, y0, y1); // bullet
  roundedBar(lineX0, lineX1, y0, y1); // line
}

// --- PNG encoding ---
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // colour type RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

// Raw image data: each scanline prefixed with filter byte 0.
const raw = Buffer.alloc(H * (W * 4 + 1));
for (let y = 0; y < H; y++) {
  const src = y * W * 4;
  const dst = y * (W * 4 + 1);
  raw[dst] = 0;
  px.copy(raw, dst + 1, src, src + W * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "badge.png");
writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes)`);
