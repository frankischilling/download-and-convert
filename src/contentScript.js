// contentScript.js

// Map extension -> MIME type for canvas
function getMimeFromFormat(format) {
  switch (format) {
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "png":
    default:
      return "image/png";
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "CONVERT_AND_SEND") return;

  const { srcUrl, format } = message;

  (async () => {
    try {
      // Fetch the image bytes
      const res = await fetch(srcUrl);
      const blob = await res.blob();

      // Create a bitmap or image from blob
      const imgBitmap = await createImageBitmap(blob);

      // Draw on canvas
      const canvas = document.createElement("canvas");
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgBitmap, 0, 0);

      const mimeType = getMimeFromFormat(format);

      // Convert canvas to Blob in target format
      canvas.toBlob(
        (convertedBlob) => {
          if (!convertedBlob) {
            console.error("Conversion failed: toBlob returned null");
            sendResponse(null);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result; // "data:image/png;base64,..."
            sendResponse({ dataUrl });
          };
          reader.readAsDataURL(convertedBlob);
        },
        mimeType,
        0.92 // quality (mainly for JPEG/WebP)
      );
    } catch (err) {
      console.error("Error converting image:", err);
      sendResponse(null);
    }
  })();

  // Tell Chrome we'll respond asynchronously
  return true;
});


