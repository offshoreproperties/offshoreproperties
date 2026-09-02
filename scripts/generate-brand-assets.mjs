/**
 * Generate favicon, apple-touch-icon, and OG image from public/offshore-logo.png
 * Run: node scripts/generate-brand-assets.mjs
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public", "offshore-logo.png");

async function main() {
  const logo = sharp(logoPath);
  const meta = await logo.metadata();

  await logo.clone().resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toFile(join(root, "public", "favicon.png"));
  await logo.clone().resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toFile(join(root, "public", "apple-touch-icon.png"));

  const ogWidth = 1200;
  const ogHeight = 630;
  const maxLogoW = Math.round(ogWidth * 0.72);
  const maxLogoH = Math.round(ogHeight * 0.72);
  const logoBuf = await logo
    .clone()
    .resize(maxLogoW, maxLogoH, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: ogWidth,
      height: ogHeight,
      channels: 3,
      background: { r: 8, g: 8, b: 8 },
    },
  })
    .composite([{ input: logoBuf, gravity: "center" }])
    .jpeg({ quality: 90 })
    .toFile(join(root, "public", "og-image.jpg"));

  console.log("Generated favicon.png, apple-touch-icon.png, og-image.jpg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
