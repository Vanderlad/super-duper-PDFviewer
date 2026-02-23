import { unsplashPickFromSearch, unsplashPickFromCollection } from "./unsplash.js";
import { idbGetBlobUrl, idbSaveFile } from "./idb_store.js";
import { pexelsPickVideo } from "./pexels.js";

const DEFAULTS = {
  background: {
    type: "image", // "solid" | "image" | "video"
    source: {
      kind: "local", // "unsplash_search" | "unsplash_collection" | "url" | "local"
      query: "",
      collectionId: "",
      url: "",
      localId: ""
    },
    blurPx: 12,
    dimOpacity: 0.25,
    solidColor: "#111111"
  },
  rotation: {
    frequency: "locked" // "locked" | "every_tab" | "every_hour" | "every_day"
  },
  cache: {
    lastBg: null,
    lastChangedAt: 0
  }
};

export async function loadSettings() {
  const data = await chrome.storage.local.get(["settings"]);
  const settings = data.settings ?? DEFAULTS;
  // Shallow merge defaults in case you add new fields later:
  return mergeDefaults(DEFAULTS, settings);
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

function mergeDefaults(def, obj) {
  if (obj == null || typeof obj !== "object") return structuredClone(def);
  const out = Array.isArray(def) ? [] : {};
  for (const k of Object.keys(def)) {
    if (typeof def[k] === "object" && def[k] !== null && !Array.isArray(def[k])) {
      out[k] = mergeDefaults(def[k], obj[k]);
    } else {
      out[k] = obj[k] ?? def[k];
    }
  }
  // keep extra keys too
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}

function shouldRotate(settings, reason /* "tab_open" | "timer" */) {
  const freq = settings.rotation.frequency;
  const last = settings.cache.lastChangedAt || 0;
  const now = Date.now();

  if (freq === "locked") return false;
  if (freq === "every_tab") return reason === "tab_open";

  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (freq === "every_hour") return (now - last) >= hour;
  if (freq === "every_day") return (now - last) >= day;

  return false;
}

async function resolveBackground(settings) {
  const bg = settings.background;

  // 1) Solid color
  if (bg.type === "solid") {
    return { renderType: "solid", solidColor: bg.solidColor, attribution: null };
  }

  // 2) URL
  if (bg.source.kind === "url") {
    return { renderType: bg.type, url: bg.source.url, attribution: null };
  }

  // 3) Local
  if (bg.source.kind === "local") {
    const url = await idbGetBlobUrl(bg.source.localId);
    return { renderType: bg.type, url, attribution: null };
  }

  // 4) Unsplash Search
  if (bg.source.kind === "unsplash_search") {
    const picked = await unsplashPickFromSearch(bg.source.query);
    return picked; // already returns {renderType:"image", url, attribution, unsplashDownloadUrl}
  }

  // 5) Unsplash Collection
  if (bg.source.kind === "unsplash_collection") {
    const picked = await unsplashPickFromCollection(bg.source.collectionId);
    return picked;
  }
    // 6) Pexels
    if (bg.type === "video" && bg.source.kind === "pexels_search") {
        try {
            return await pexelsPickVideo(bg.source.query);
        } catch (e) {
            console.warn(e);
            return { renderType: "solid", solidColor: "#111111", attribution: null };
        }
    }

  // fallback
  return { renderType: "solid", solidColor: "#111111", attribution: null };
}

/**
 * Call this from viewer on load, and from timers if wanted.
 * reason: "tab_open" or "timer"
 */
export async function getBackgroundToUse(reason) {
  const settings = await loadSettings();

  // If we shouldn't rotate and we have a cached resolved background, reuse it:
  if (!shouldRotate(settings, reason) && settings.cache.lastBg) {
    return { settings, resolved: settings.cache.lastBg };
  }

  // Otherwise resolve a fresh background:
  const resolved = await resolveBackground(settings);

  // Update cache:
  settings.cache.lastBg = resolved;
  settings.cache.lastChangedAt = Date.now();
  await saveSettings(settings);

  return { settings, resolved };
}

export function applyBackgroundToDom(settings, resolved) {
  const bgLayer = document.getElementById("bgLayer");
  const bgVideo = document.getElementById("bgVideo");
  const bgDim = document.getElementById("bgDim");
  const credit = document.getElementById("credit");

  const blurPx = settings.background.blurPx;
  const dimOpacity = settings.background.dimOpacity;

  // Always reset credit
  if (credit) credit.innerHTML = "";

  // ---- SOLID ----
  if (resolved.renderType === "solid") {
    bgVideo.pause();
    bgVideo.removeAttribute("src");
    bgVideo.load();
    bgVideo.style.display = "none";

    bgLayer.style.display = "block";
    bgLayer.style.backgroundImage = "none";
    bgLayer.style.backgroundColor = resolved.solidColor || "#111";
    bgLayer.style.filter = `blur(${blurPx}px)`;

    bgDim.style.opacity = String(dimOpacity);
    return;
  }

  // ---- VIDEO ----
  if (resolved.renderType === "video") {

    // Hide image layer
    bgLayer.style.display = "none";
    bgLayer.style.backgroundImage = "none";

    // Show video
    bgVideo.style.display = "block";
    bgVideo.muted = true;
    bgVideo.loop = true;
    bgVideo.playsInline = true;

    bgVideo.src = resolved.url;
    bgVideo.load();
    bgVideo.style.filter = `blur(${blurPx}px)`;

    bgVideo.play().catch(e => {
      console.warn("Video failed to play:", e);
    });

    bgDim.style.opacity = String(dimOpacity);
    return;
  }

  // ---- IMAGE (default fallback) ----
  bgVideo.pause();
  bgVideo.removeAttribute("src");
  bgVideo.load();
  bgVideo.style.display = "none";

  bgLayer.style.display = "block";
  bgLayer.style.backgroundColor = "#111";
  bgLayer.style.backgroundImage = `url("${resolved.url}")`;
  bgLayer.style.filter = `blur(${blurPx}px)`;

  bgDim.style.opacity = String(dimOpacity);

  if (credit && resolved.attribution) {
    const a = resolved.attribution;
    credit.innerHTML =
      `Photo by <a href="${a.photographerUrl}" target="_blank">${a.photographerName}</a>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[c]));
}

// Local file helper used by UI:
export async function saveLocalFileAndSet(settings, file, type /* "image"|"video" */) {
  const localId = await idbSaveFile(file);
  settings.background.type = type;
  settings.background.source = { kind: "local", localId, query: "", collectionId: "", url: "" };
  settings.cache.lastBg = null; // force refresh
  settings.cache.lastChangedAt = 0;
  await saveSettings(settings);
}