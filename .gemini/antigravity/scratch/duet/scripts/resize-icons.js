/**
 * resize-icons.js
 * Run with: node resize-icons.js
 * Requires: npm install sharp
 * Resizes the Duet app icon to all required Android/PWA sizes.
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';

const SOURCE = '../../../brain/88558823-7d6b-4dd5-8680-1053fd9be482/duet_app_icon_1781178383820.png';
const OUTPUT_DIR = '../client/public/icons';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function resizeAll() {
  for (const size of sizes) {
    await sharp(SOURCE)
      .resize(size, size)
      .toFile(`${OUTPUT_DIR}/icon-${size}.png`);
    console.log(`✅ icon-${size}.png created`);
  }
  console.log('\n🎉 All icons generated!');
}

resizeAll().catch(console.error);
