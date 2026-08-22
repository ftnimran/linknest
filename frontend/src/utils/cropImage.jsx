export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  // FIX: Enable anonymous crossOrigin to prevent Canvas Tainted DOM SecurityError
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;
  
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // ⚡ FIX: JPEG format transparency support nahi karta, isliye background me solid color fill karna padega
  ctx.fillStyle = '#081b29'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    // ⚡ FIX: 'image/png' ko 'image/jpeg' kiya aur 0.7 (70%) quality set ki. (Size ab 50-100kb aayega)
    canvas.toBlob((file) => {
      if (!file) {
        reject(new Error('Canvas conversion failed: image area is empty'));
        return;
      }
      resolve(URL.createObjectURL(file));
    }, 'image/jpeg', 0.7);
  });
};