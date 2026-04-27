// src/utils/image.js

export function getImageSrc(data) {
  if (!data) return null;

  if (data.imageBase64) {
    return `data:image/png;base64,${data.imageBase64}`;
  }

  if (data.image_url) return data.image_url;
  if (data.image) return data.image;

  return null;
}