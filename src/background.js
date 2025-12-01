// background.js (service worker)

const DEFAULT_FORMAT = "png";
const MENU_ID = "download-convert";

let cachedFormat = DEFAULT_FORMAT;

async function loadFormat() {
  const stored = await chrome.storage.sync.get({ format: DEFAULT_FORMAT });
  cachedFormat = stored.format || DEFAULT_FORMAT;
  return cachedFormat;
}

async function rebuildContextMenu(format) {
  const title = "Download & convert image to " + format.toUpperCase();
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title,
    contexts: ["image"]
  });
}

async function ensureContextMenu() {
  const format = await loadFormat();
  rebuildContextMenu(format);
}

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.format) return;
  const nextFormat = changes.format.newValue || DEFAULT_FORMAT;
  cachedFormat = nextFormat;
  rebuildContextMenu(nextFormat);
});

// Handle context menu click on an image
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  if (!info.srcUrl || !tab.id) return;

  const format = await loadFormat();

  // Ask content script in that tab to fetch, convert, and send back data URL
  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "CONVERT_AND_SEND",
      srcUrl: info.srcUrl,
      format
    },
    (response) => {
      if (chrome.runtime.lastError) {
        const message = chrome.runtime.lastError.message || "";
        // Ignore the common "Receiving end does not exist" error on pages
        // where the content script cannot run (e.g. chrome://, Web Store).
        if (message.includes("Receiving end does not exist")) {
          return;
        }
        console.error("Error sending message:", chrome.runtime.lastError);
        return;
      }
      if (!response) {
        console.error("No response from content script");
        return;
      }

      if (response.error) {
        console.error("Conversion error:", response.error);
        return;
      }

      if (!response.dataUrl) {
        console.error("No dataUrl in response from content script");
        return;
      }

      const actualMime = response.mimeType || "";
      let extension = format;

      // If the browser fell back to a different format, make the filename
      // match the real content type.
      if (actualMime.includes("image/png")) {
        extension = "png";
      } else if (actualMime.includes("image/jpeg")) {
        extension = "jpeg";
      } else if (actualMime.includes("image/webp")) {
        extension = "webp";
      } else if (actualMime.includes("image/bmp")) {
        extension = "bmp";
      }

      const time = Date.now();
      const filename = `converted-image-${time}.${extension}`;

      chrome.downloads.download({
        url: response.dataUrl,
        filename,
        saveAs: false
      });
    }
  );
});

