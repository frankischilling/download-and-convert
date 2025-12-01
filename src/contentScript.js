// contentScript.js

// Map extension -> MIME type for canvas
function getMimeFromFormat(format) {
  switch (format) {
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "png":
    default:
      return "image/png";
  }
}

// Custom encoder: convert a canvas to a 24-bit BMP Blob
function canvasToBmp(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, w, h);

  const rowSize = w * 3 + (w % 4 ? 4 - ((w * 3) % 4) : 0);
  const fileSize = 54 + rowSize * h;

  const buffer = new ArrayBuffer(fileSize);
  const dv = new DataView(buffer);
  let offset = 0;

  // BMP header "BM"
  dv.setUint16(offset, 0x4d42, true);
  offset += 2;

  // File size
  dv.setUint32(offset, fileSize, true);
  offset += 4;

  // Reserved
  offset += 4;

  // Pixel data offset
  dv.setUint32(offset, 54, true);
  offset += 4;

  // DIB header size
  dv.setUint32(offset, 40, true);
  offset += 4;

  // Width & height
  dv.setInt32(offset, w, true);
  offset += 4;
  dv.setInt32(offset, h, true);
  offset += 4;

  // Planes
  dv.setUint16(offset, 1, true);
  offset += 2;

  // Bits per pixel
  dv.setUint16(offset, 24, true);
  offset += 2;

  // Rest of DIB header (compression, image size, etc.) left as zeros
  offset += 24;

  // Pixel data (BGR, bottom-up)
  for (let y = h - 1; y >= 0; y--) {
    const rowStart = offset;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      dv.setUint8(offset++, data[i + 2]); // B
      dv.setUint8(offset++, data[i + 1]); // G
      dv.setUint8(offset++, data[i]); // R
    }
    // Row padding to 4-byte boundary
    while ((offset - rowStart) % 4 !== 0) {
      dv.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "CONVERT_AND_SEND") return;

  const { srcUrl, format } = message;

  (async () => {
    try {
      let imgBitmap;

      // Handle file:// URLs (local files) - can't use fetch, use DOM image element instead
      if (srcUrl.startsWith("file://")) {
        // Find the img element with this src
        const imgElement = Array.from(document.querySelectorAll("img")).find(
          (img) => img.src === srcUrl || img.currentSrc === srcUrl
        );

        if (!imgElement) {
          throw new Error("Could not find image element for file:// URL");
        }

        // Use the image element directly
        imgBitmap = await createImageBitmap(imgElement);
      } else {
        // For http/https URLs, fetch normally
        const res = await fetch(srcUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
        }
        const blob = await res.blob();
        imgBitmap = await createImageBitmap(blob);
      }

      // Draw on canvas
      const canvas = document.createElement("canvas");
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgBitmap, 0, 0);

      // Special-case BMP: use a custom encoder
      if (format === "bmp") {
        const bmpBlob = canvasToBmp(canvas);
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          sendResponse({ dataUrl, mimeType: "image/bmp" });
        };
        reader.readAsDataURL(bmpBlob);
        return;
      }

      const mimeType = getMimeFromFormat(format);

      // Convert canvas to Blob in target format
      canvas.toBlob(
        (convertedBlob) => {
          if (!convertedBlob) {
            console.error("Conversion failed: toBlob returned null");
            sendResponse({ error: "Canvas conversion failed" });
            return;
          }

          const effectiveType = convertedBlob.type || mimeType;

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result; // "data:image/...;base64,..."
            sendResponse({ dataUrl, mimeType: effectiveType });
          };
          reader.readAsDataURL(convertedBlob);
        },
        mimeType,
        0.92 // quality (mainly for JPEG/WebP)
      );
    } catch (err) {
      console.error("Error converting image:", err);
      sendResponse({ error: err.message || "Conversion failed" });
    }
  })();

  // Tell Chrome we'll respond asynchronously
  return true;
});


