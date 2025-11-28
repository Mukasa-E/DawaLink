#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
let pngToIco = require('png-to-ico');
pngToIco = pngToIco && pngToIco.default ? pngToIco.default : pngToIco;

(async () => {
  try {
    const publicDir = path.join(__dirname, '..', 'public');
    const svgPath = path.join(publicDir, 'favicon.svg');
    if (!fs.existsSync(svgPath)) {
      console.error('favicon.svg not found in public/. Please add one first.');
      process.exit(1);
    }

    const sizes = [16, 24, 32, 48, 64, 128];
    const tmpPngs = [];

    for (const size of sizes) {
      const outPath = path.join(publicDir, `favicon-${size}.png`);
      await sharp(svgPath)
        .resize(size, size, { fit: 'contain' })
        .png()
        .toFile(outPath);
      tmpPngs.push(outPath);
    }

  const icoBuffer = await pngToIco(tmpPngs.map(p => path.resolve(p)));
    const icoPath = path.join(publicDir, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('favicon.ico generated at', icoPath);

    // cleanup tmp pngs
    for (const p of tmpPngs) {
      fs.unlinkSync(p);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error generating favicon.ico:', err);
    process.exit(1);
  }
})();
