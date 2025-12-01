const FORMAT_KEY = "format";
const selectEl = document.getElementById("format");
const statusEl = document.getElementById("status");
const DEFAULT_FORMAT = "png";

function showSavedMessage() {
  statusEl.textContent = "Saved";
  setTimeout(() => {
    statusEl.textContent = "";
  }, 900);
}

async function restoreOptions() {
  const stored = await chrome.storage.sync.get({ [FORMAT_KEY]: DEFAULT_FORMAT });
  selectEl.value = stored[FORMAT_KEY] || DEFAULT_FORMAT;
}

async function saveFormat(newFormat) {
  await chrome.storage.sync.set({ [FORMAT_KEY]: newFormat });
  showSavedMessage();
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  selectEl.addEventListener("change", (event) => {
    saveFormat(event.target.value);
  });
});
