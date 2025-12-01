## download-and-convert

Right-click any image in Chrome (e.g. on Google Images), choose **“Download & convert image to PNG”** (or another format), and this extension will:

- **Grab the image URL**
- **Download it**
- **Convert it in a hidden `canvas`**
- **Save it in your chosen format using `chrome.downloads`**

### Folder structure

```text
image-converter-extension/
  ├─ manifest.json
  ├─ src/
  │   ├─ background.js
  │   └─ contentScript.js
  └─ README.md
```

### Files

- **`manifest.json`**: Chrome Manifest V3 configuration, permissions, and wiring to background/content scripts.
- **`src/background.js`**: Service worker that creates the right-click context menu and triggers the download after conversion.
- **`src/contentScript.js`**: Runs in the page, fetches the image, renders it to a hidden `canvas`, converts it, and sends a data URL back to the background script.

### How to install (development)

1. Open Chrome and go to `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **“Load unpacked”**.
4. Select this project folder (the one containing `manifest.json`).

### How to use

1. Navigate to any page with an image (e.g. Google Images).
2. Right-click on an image.
3. Choose **“Download & convert image to PNG”** (or whatever format the extension is configured to use).
4. A converted file will appear in your downloads folder with a name like `converted-image-<timestamp>.png`.

### Changing the output format

- In **`src/background.js`**, change:

```js
const DEFAULT_FORMAT = "png"; // or "jpeg" or "webp"
```

- In **`src/contentScript.js`**, the function `getMimeFromFormat(format)` already maps:
  - `"png"` → `image/png`
  - `"jpeg"` / `"jpg"` → `image/jpeg`
  - `"webp"` → `image/webp`

Reload the extension from `chrome://extensions` after making changes.

### TODO (next update)

- **Add UI to choose output format**
  - Add an **options page** or **popup** with a dropdown to select the target format (PNG / JPEG / WEBP).
  - Store the selection in `chrome.storage.sync`.
  - Read the stored format in `src/background.js` and use it instead of the hard-coded `DEFAULT_FORMAT`.
  - Update the context menu title dynamically to match the selected format.
