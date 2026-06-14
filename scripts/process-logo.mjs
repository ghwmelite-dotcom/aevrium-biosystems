// One-off: convert the white-background logo JPEG into a trimmed, transparent PNG.
//
// The source has a soft gray drop-shadow under the ribbons. A plain white-key
// can't distinguish that neutral-but-bright shadow from the blue art, so we
// FLOOD-FILL background from the image borders: any bright, low-chroma pixel
// reachable from an edge (white bg + the attached gray shadow) becomes
// transparent, while bright pixels NOT connected to the border (the white
// shine inside the ribbons) are preserved. Alpha is then feathered for clean
// edges.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SRC = "C:/Users/USER/Downloads/aevrium logo.jpeg";
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/assets/img/logo-full.png"
);

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const N = width * height;

// Background test: bright AND near-neutral (low chroma), or essentially white.
const isBgLike = (i) => {
  const o = i * channels;
  const r = data[o], g = data[o + 1], b = data[o + 2];
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const chroma = mx - mn;
  return mn >= 232 || (mx >= 158 && chroma <= 52);
};

// Flood fill (iterative, 4-connected) from every border pixel that is bg-like.
const bg = new Uint8Array(N);
const stack = [];
const push = (x, y) => {
  const i = y * width + x;
  if (!bg[i] && isBgLike(i)) { bg[i] = 1; stack.push(i); }
};
for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
while (stack.length) {
  const i = stack.pop();
  const x = i % width, y = (i / width) | 0;
  if (x > 0) push(x - 1, y);
  if (x < width - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < height - 1) push(x, y + 1);
}

// Apply the mask: background -> transparent. The source's own anti-aliased
// edges keep the boundary smooth, so no extra feather is needed.
for (let i = 0; i < N; i++) data[i * channels + 3] = bg[i] ? 0 : 255;

await sharp(data, { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .trim({ threshold: 1 })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} ${meta.width}x${meta.height}`);
