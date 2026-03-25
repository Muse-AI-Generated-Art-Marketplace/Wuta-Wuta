const sharp = require('sharp');

/**
 * Processes an image buffer to create an optimized WebP version and a thumbnail.
 * 
 * @param {Buffer} buffer - Raw image buffer from multer
 * @returns {Promise<{optimized: Buffer, thumbnail: Buffer, metadata: object}>}
 */
async function processImage(buffer) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 1. Create optimized WebP (80% quality)
    const optimized = await image
      .webp({ quality: 80 })
      .toBuffer();

    // 2. Create thumbnail (300px width, aspect ratio preserved)
    const thumbnail = await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 70 })
      .toBuffer();

    return { 
      optimized, 
      thumbnail, 
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      }
    };
  } catch (error) {
    console.error('[ImageProcessor] Error:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
}

module.exports = { processImage };
