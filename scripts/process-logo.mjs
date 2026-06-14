// One-off: convert the white-background logo JPEG into a trimmed, transparent PNG.
// White is keyed out via the per-pixel MIN channel (near-white => high min => transparent),
// which keeps saturated AND light-blue artwork fully opaque while feathering only the edge band.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SRC = "C:/Users/USER/Downloads/aevrium logo.jpeg";
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/assets/img/logo-full.png"
);

// Edge feather band on the min-channel: >= HI fully transparent, <= LO fully opaque.
const HI = 248;
const LO = 224;

const img = sharp(SRC).ensureAlpha();
const { data, info } = await img
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
for (let i = 0; i < data.length; i += channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const mn = Math.min(r, g, b);
  let a;
  if (mn >= HI) a = 0;
  else if (mn <= LO) a = 255;
  else a = Math.round(255 * (HI - mn) / (HI - LO));
  data[i + 3] = a;
}

await sharp(data, { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .trim({ threshold: 1 }) // strip fully-transparent margins
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} ${meta.width}x${meta.height}`);
