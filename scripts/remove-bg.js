const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function removeBackground() {
  const img = await loadImage('./public/map-solid.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Remove white/light gray background (make transparent)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is light gray/white (background), make it transparent
    if (r > 200 && g > 200 && b > 200) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
    // Change dark gray (map) to purple #7E7AA8
    else if (r < 200 && g < 200 && b < 200) {
      data[i] = 126;     // R
      data[i + 1] = 122; // G
      data[i + 2] = 168; // B
      data[i + 3] = 255; // Keep opaque
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/map-solid-purple.png', buffer);
  console.log('✅ Created map-solid-purple.png with transparent background');
}

removeBackground().catch(console.error);
