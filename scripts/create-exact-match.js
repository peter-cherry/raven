const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function createExactMatch() {
  // Load the original solid map
  const img = await loadImage('./public/map-solid-purple.png');

  // Target dimensions to EXACTLY match SVG viewBox
  const targetWidth = 1366;
  const targetHeight = 768;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Draw the image but adjust the scaling to match the SVG exactly
  // The issue is that the PNG and SVG have different natural aspect ratios
  // So we need to scale it to fit exactly the same way the browser scales the SVG

  // Calculate the aspect ratios
  const imgAspect = img.width / img.height;
  const targetAspect = targetWidth / targetHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspect > targetAspect) {
    // Image is wider than target - fit to height
    drawHeight = targetHeight;
    drawWidth = drawHeight * imgAspect;
    offsetX = (targetWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image is taller than target - fit to width
    drawWidth = targetWidth;
    drawHeight = drawWidth / imgAspect;
    offsetX = 0;
    offsetY = (targetHeight - drawHeight) / 2;
  }

  // Draw with exact scaling
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/map-solid-exact.png', buffer);
  console.log(`✅ Created map-solid-exact.png with exact SVG dimensions`);
  console.log(`   Original: ${img.width}×${img.height} (aspect: ${imgAspect.toFixed(3)})`);
  console.log(`   Target: ${targetWidth}×${targetHeight} (aspect: ${targetAspect.toFixed(3)})`);
  console.log(`   Draw: ${drawWidth.toFixed(0)}×${drawHeight.toFixed(0)} at offset (${offsetX.toFixed(0)}, ${offsetY.toFixed(0)})`);
}

createExactMatch().catch(console.error);
