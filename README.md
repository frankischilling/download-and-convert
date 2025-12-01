## download-and-convert

Right-click any image in Chrome (e.g. on Google Images), choose **“Download & convert image to PNG/JPEG/WEBP/BMP”**, and this extension will:

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
  │   ├─ contentScript.js
  │   ├─ options.html
  │   ├─ options.js
  │   ├─ popup.html
  │   └─ popup.js
  └─ README.md
```

### Files

- **`manifest.json`**: Chrome Manifest V3 configuration, permissions, and wiring to background/content scripts.
- **`src/background.js`**: Service worker that creates the right-click context menu, reads the chosen format from storage, and triggers the download after conversion.
- **`src/contentScript.js`**: Runs in the page, fetches the image, renders it to a hidden `canvas`, converts it (including custom BMP encoding), and sends a data URL back to the background script.
- **`src/options.html` / `src/options.js`**: Full-page options UI (opened from Chrome’s extension details) to choose the default output format.
- **`src/popup.html` / `src/popup.js`**: Toolbar popup that lets you quickly change the output format on any page.

### How to install (development)

1. Open Chrome and go to `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **“Load unpacked”**.
4. Select this project folder (the one containing `manifest.json`).

### How to use

1. Navigate to any page with an image (e.g. Google Images).
2. Right-click on an image.
3. Choose **“Download & convert image to …”** (PNG/JPEG/WEBP/BMP, depending on your selection).
4. A converted file will appear in your downloads folder with a name like `converted-image-<timestamp>.<ext>`.

### Choosing the output format (popup & options page)

- **Popup (recommended)**:
  - Click the extension icon in the Chrome toolbar.
  - A small popup opens (`src/popup.html`) with a dropdown to select **PNG**, **JPEG**, **WEBP**, or **BMP**.
  - The choice is saved to `chrome.storage.sync` and applied immediately; the right-click menu text updates to match.

- **Options page**:
  - Go to `chrome://extensions` → **Details** for this extension → **Extension options**.
  - This opens `src/options.html`, which has the same format dropdown.

Under the hood, both UIs write the `format` key in `chrome.storage.sync`, which `src/background.js` reads to decide what format to request from `src/contentScript.js`.
