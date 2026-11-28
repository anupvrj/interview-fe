/**
 * Fingerprints of our resume designs, for "closest design first" in the new-resume flow.
 * Reads each design's preview image with the same analyser the browser uses on an uploaded
 * resume (src/lib/resume-style/designStyle.ts), plus its font and whether it shows a photo.
 *
 *   npx jiti scripts/resume-template-fingerprints.ts
 *
 * Run again after adding a design or changing a preview image; commit the JSON.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { analyzePagePixels, serifFromFontFamily, type DesignStyle } from "../src/lib/resume-style/designStyle";

const root = path.resolve(__dirname, "..");
const configsDir = path.join(root, "src/configs/resume-templates");
const out = path.join(root, "src/lib/resume-style/template-fingerprints.json");

async function main() {
  const result: Record<string, DesignStyle> = {};
  for (const id of fs.readdirSync(configsDir).sort()) {
    const configFile = path.join(configsDir, id, "config.ts");
    if (!fs.existsSync(configFile)) continue;
    const config = fs.readFileSync(configFile, "utf8");
    const preview = config.match(/preview:\s*"([^"]+)"/)?.[1];
    const font = config.match(/fontFamily:\s*"([^"]+)"/)?.[1] ?? null;
    if (!preview) {
      console.warn(`skip ${id}: no preview image`);
      continue;
    }
    const file = path.join(root, "public", preview.replace(/^\//, ""));
    if (!fs.existsSync(file)) {
      console.warn(`skip ${id}: ${preview} missing`);
      continue;
    }
    const { data, info } = await sharp(file).flatten({ background: "#ffffff" }).resize({ width: 240 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = analyzePagePixels(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height);
    const dummy = path.join(configsDir, id, "dummy-content.ts");
    // the design has a photo slot (its sample leaves it empty)
    const photo = fs.existsSync(dummy) && /profilePicture\s*:/.test(fs.readFileSync(dummy, "utf8"));
    const { gutter: _gutter, ...layout } = pixels;
    void _gutter;
    result[id] = { ...layout, photo, serif: serifFromFontFamily(font) };
    console.log(id.padEnd(16), JSON.stringify(result[id]));
  }
  fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`wrote ${Object.keys(result).length} fingerprints → ${path.relative(root, out)}`);
}

void main();
