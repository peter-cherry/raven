const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function resizeToMatchSVG() {
  const img = await loadImage('./public/map-solid-purple.png');

  // Target dimensions to match SVG viewBox
  const targetWidth = 1366;
  const targetHeight = 768;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Calculate scaling to fit image within target dimensions (contain behavior)
  const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;

  // Center the image
  const x = (targetWidth - scaledWidth) / 2;
  const y = (targetHeight - scaledHeight) / 2;

  // Draw image centered and scaled
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/map-solid-aligned.png', buffer);
  console.log(`✅ Created map-solid-aligned.png (${targetWidth}×${targetHeight}) to match SVG`);
}

resizeToMatchSVG().catch(console.error);
