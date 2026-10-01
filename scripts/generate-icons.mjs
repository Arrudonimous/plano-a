// Gera os ícones do PWA a partir da marca (A + sol) em public/icons/.
// Uso: node scripts/generate-icons.mjs
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const NAVY = "#1e2a4a";
const CREAM = "#faf7f2";
const AMBER = "#e2a15c";

const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "icons",
);

// Marca desenhada num canvas 64x64; `scale` encolhe o desenho ao redor do
// centro (maskable precisa manter tudo dentro da safe zone de 80%).
function svg({ size, scale }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${NAVY}"/>
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)">
    <path d="M17 49 32 17l15 32M23.5 38.5h17" fill="none" stroke="${CREAM}"
          stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="47" cy="15" r="5.5" fill="${AMBER}"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, scale: 1 },
  { file: "icon-512.png", size: 512, scale: 1 },
  { file: "icon-maskable-192.png", size: 192, scale: 0.72 },
  { file: "icon-maskable-512.png", size: 512, scale: 0.72 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.9 },
];

await mkdir(outDir, { recursive: true });

for (const { file, size, scale } of targets) {
  await sharp(Buffer.from(svg({ size, scale })))
    .png()
    .toFile(path.join(outDir, file));
  console.log(`gerado ${file}`);
}
