const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function createExactColor() {
  const img = await loadImage('./public/map-solid-purple.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Exact color from dots: #404063
  const targetR = 64;  // 0x40
  const targetG = 64;  // 0x40
  const targetB = 99;  // 0x63

  // Change all non-transparent pixels to exact dots color
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];

    // If pixel is not transparent (it's part of the map)
    if (alpha > 0) {
      data[i] = targetR;     // R
      data[i + 1] = targetG; // G
      data[i + 2] = targetB; // B
      data[i + 3] = 255;     // Keep fully opaque
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/map-solid-dots-color.png', buffer);
  console.log('✅ Created map-solid-dots-color.png with exact dots color #404063');
}

createExactColor().catch(console.error);
