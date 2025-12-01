// background.js (service worker)

// Default format; change to "jpeg", "webp", etc.
const DEFAULT_FORMAT = "png";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "download-convert",
    title: "Download & convert image to " + DEFAULT_FORMAT.toUpperCase(),
    contexts: ["image"]
  });
});

// Handle context menu click on an image
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "download-convert") return;
  if (!info.srcUrl || !tab.id) return;

  // Ask content script in that tab to fetch, convert, and send back data URL
  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "CONVERT_AND_SEND",
      srcUrl: info.srcUrl,
      format: DEFAULT_FORMAT
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        return;
      }
      if (!response || !response.dataUrl) {
        console.error("No response or no dataUrl from content script");
        return;
      }

      // Build a filename (basic; you can parse from srcUrl if you want)
      const time = Date.now();
      const filename = `converted-image-${time}.${DEFAULT_FORMAT}`;

      chrome.downloads.download({
        url: response.dataUrl,
        filename: filename,
        saveAs: false
      });
    }
  );
});


