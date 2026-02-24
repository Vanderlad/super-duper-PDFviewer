import {
  loadSettings,
  saveSettings,
  getBackgroundToUse,
  applyBackgroundToDom,
  saveLocalFileAndSet
} from "./background_engine.js";

let settings;

// Toolbar controls
const btnPickBg = document.getElementById("btnPickBg");
const btnClearBg = document.getElementById("btnClearBg");
const btnDownloadPdf = document.getElementById("btnDownloadPdf");
const fileBg = document.getElementById("fileBg");

const blur = document.getElementById("blur");
const blurVal = document.getElementById("blurVal");

const dim = document.getElementById("dim");
const dimVal = document.getElementById("dimVal");

// Dropdown + form
const bgPanel = document.getElementById("bgPanel");
const bgForm = document.getElementById("bgForm");

// Provider controls
const bgType = document.getElementById("bgType");
const sourceKind = document.getElementById("sourceKind");
const frequency = document.getElementById("frequency");

const urlInput = document.getElementById("urlInput");
const colorInput = document.getElementById("colorInput");

const unsplashQuery = document.getElementById("unsplashQuery");
const unsplashCollectionId = document.getElementById("unsplashCollectionId");

const pexelsQuery = document.getElementById("pexelsQuery");

// Keys
const unsplashKey = document.getElementById("unsplashKey");
const btnSaveUnsplashKey = document.getElementById("btnSaveUnsplashKey");

const pexelsKey = document.getElementById("pexelsKey");
const btnSavePexelsKey = document.getElementById("btnSavePexelsKey");

// ---------- helpers ----------
async function refreshBackground(reason) {
  const result = await getBackgroundToUse(reason);
  settings = result.settings;
  applyBackgroundToDom(settings, result.resolved);
  syncUiFromSettings(settings);
}

function syncUiFromSettings(s) {
  blur.value = String(s.background.blurPx);
  blurVal.textContent = String(s.background.blurPx);

  dim.value = String(s.background.dimOpacity);
  dimVal.textContent = String(s.background.dimOpacity);

  bgType.value = s.background.type;
  sourceKind.value = s.background.source.kind;
  frequency.value = s.rotation.frequency;

  urlInput.value = s.background.source.url || "";
  colorInput.value = s.background.solidColor || "#111111";

  unsplashQuery.value = s.background.source.query || "";
  unsplashCollectionId.value = s.background.source.collectionId || "";

  pexelsQuery.value = s.background.source.query || "";

  updateProviderVisibility();
}

function updateProviderVisibility() {
  const type = bgType.value;
  const kind = sourceKind.value;

  const showUrl = kind === "url";
  const showUnsplashSearch = kind === "unsplash_search";
  const showUnsplashCollection = kind === "unsplash_collection";
  const showPexels = kind === "pexels_search";
  const showColor = type === "solid";

  setDisplay("rowUrl", showUrl);
  setDisplay("rowUnsplashQuery", showUnsplashSearch);
  setDisplay("rowUnsplashCollection", showUnsplashCollection);
  setDisplay("rowPexelsQuery", showPexels);
  setDisplay("rowColor", showColor);

  // Keys only when relevant
  setDisplay("rowUnsplashKey", showUnsplashSearch || showUnsplashCollection);
  setDisplay("rowPexelsKey", showPexels);
}

function setDisplay(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

async function syncKeyFields() {
  const data = await chrome.storage.local.get(["unsplashAccessKey", "pexelsAccessKey"]);
  if (unsplashKey) unsplashKey.value = data.unsplashAccessKey || "";
  if (pexelsKey) pexelsKey.value = data.pexelsAccessKey || "";
}

// ---------- events ----------
btnPickBg?.addEventListener("click", () => {
  fileBg.value = ""; // allow picking same file twice
  fileBg.click();
});

fileBg?.addEventListener("change", async () => {
  const file = fileBg.files?.[0];
  if (!file) return;

  const type = file.type.startsWith("video/") ? "video" : "image";
  await saveLocalFileAndSet(settings, file, type);
  await refreshBackground("tab_open");
});

btnClearBg?.addEventListener("click", async () => {
  settings.background.type = "solid";
  settings.background.source = { kind: "url", url: "", query: "", collectionId: "", localId: "" };
  settings.background.solidColor = "#111111";
  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;

  await saveSettings(settings);
  await refreshBackground("tab_open");
});

blur?.addEventListener("input", async () => {
  blurVal.textContent = blur.value;
  settings.background.blurPx = Number(blur.value);
  await saveSettings(settings);
  await refreshBackground("locked");
});

dim?.addEventListener("input", async () => {
  dimVal.textContent = dim.value;
  settings.background.dimOpacity = Number(dim.value);
  await saveSettings(settings);
  await refreshBackground("locked");
});

bgType?.addEventListener("change", async () => {
  settings.background.type = bgType.value;

  if (settings.background.type === "solid" && !settings.background.solidColor) {
    settings.background.solidColor = "#111111";
  }

  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;

  await saveSettings(settings);
  updateProviderVisibility();
  await refreshBackground("tab_open");
});

sourceKind?.addEventListener("change", async () => {
  settings.background.source.kind = sourceKind.value;

  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;

  await saveSettings(settings);
  updateProviderVisibility();
});

frequency?.addEventListener("change", async () => {
  settings.rotation.frequency = frequency.value;
  await saveSettings(settings);
});

colorInput?.addEventListener("input", async () => {
  settings.background.solidColor = colorInput.value;
  await saveSettings(settings);
  await refreshBackground("locked");
});

// Enter-to-apply comes from the form submit
bgForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const kind = sourceKind.value;

  if (kind === "url") {
    settings.background.source.url = urlInput.value.trim();
  } else if (kind === "unsplash_search") {
    settings.background.source.query = unsplashQuery.value.trim();
  } else if (kind === "unsplash_collection") {
    settings.background.source.collectionId = unsplashCollectionId.value.trim();
  } else if (kind === "pexels_search") {
    settings.background.source.query = pexelsQuery.value.trim();
  }

  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;

  await saveSettings(settings);
  await refreshBackground("tab_open");

  // close dropdown
  bgPanel?.removeAttribute("open");
});

// Save keys
btnSaveUnsplashKey?.addEventListener("click", async () => {
  const key = unsplashKey.value.trim();
  await chrome.storage.local.set({ unsplashAccessKey: key });

  btnSaveUnsplashKey.textContent = "Saved";
  setTimeout(() => (btnSaveUnsplashKey.textContent = "Save"), 800);

  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;
  await saveSettings(settings);
});

btnSavePexelsKey?.addEventListener("click", async () => {
  const key = pexelsKey.value.trim();
  await chrome.storage.local.set({ pexelsAccessKey: key });

  btnSavePexelsKey.textContent = "Saved";
  setTimeout(() => (btnSavePexelsKey.textContent = "Save"), 800);

  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;
  await saveSettings(settings);
});

// Service worker broadcast: rotate now
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "BG_ROTATE_NOW") {
    refreshBackground("timer");
  }
});

// ---------- init ----------
(async function init() {
  settings = await loadSettings();
  syncUiFromSettings(settings);
  await syncKeyFields();
  await refreshBackground("tab_open");
})();

// Download PDF File
btnDownloadPdf?.addEventListener("click", () => {
  const params = new URLSearchParams(location.search);
  const src = params.get("src");
  if (!src) return;

  // Temporary <a> to trigger browser download
  const a = document.createElement("a");
  a.href = src;
  a.download = ""; // lets browser decide filename
  a.rel = "noopener";
  a.target = "_blank"; // helps for some cross-origin cases
  document.body.appendChild(a);
  a.click();
  a.remove();
});