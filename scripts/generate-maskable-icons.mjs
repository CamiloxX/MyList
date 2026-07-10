// One-off generator for PWA maskable icons. Android masks icons to circles or
// squircles, so the logo must sit inside a ~80% safe zone over an opaque
// background (#0a0a0a, same as theme_color). Re-run if the logo changes:
//   node scripts/generate-maskable-icons.mjs
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

// sharp is not a direct dependency — it ships with Next inside the pnpm
// store, so resolve it from there instead of adding a dep for a one-off.
const require = createRequire(
  path.join(ROOT, "node_modules", ".pnpm", "sharp@0.34.5", "node_modules", "sharp", "package.json"),
);
const sharp = require("sharp");
const SOURCE = path.join(ROOT, "public", "iconomylist.png");
const BACKGROUND = "#0a0a0a";
// Logo occupies 80% of the canvas; the outer 20% is the mask-safe margin.
const SAFE_ZONE = 0.8;

const source = await readFile(SOURCE);

for (const size of [192, 512]) {
  const logoSize = Math.round(size * SAFE_ZONE);
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: "contain", background: BACKGROUND })
    .toBuffer();

  const offset = Math.round((size - logoSize) / 2);
  const out = path.join(ROOT, "public", `icon-maskable-${size}.png`);

  await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(out);

  console.log(`wrote ${out}`);
}
