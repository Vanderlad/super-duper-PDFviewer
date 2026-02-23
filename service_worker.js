// ---------- PDF redirect: open PDFs in our viewer ----------
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;

  const url = changeInfo.url;

  // Basic check: URL ends with .pdf (with optional query/hash)
  const isPdf = /\.pdf(\?|#|$)/i.test(url);

  // Avoid redirect loops: don't re-handle our own viewer
  const isOurViewer = url.startsWith(`chrome-extension://${chrome.runtime.id}/viewer.html`);

  if (isPdf && !isOurViewer) {
    const viewerUrl =
      `chrome-extension://${chrome.runtime.id}/viewer.html?src=${encodeURIComponent(url)}`;
    chrome.tabs.update(tabId, { url: viewerUrl });
  }
});

// ---------- Rotation scheduling via alarms ----------
chrome.runtime.onInstalled.addListener(() => ensureAlarmMatchesSettings());
chrome.runtime.onStartup.addListener(() => ensureAlarmMatchesSettings());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.settings) ensureAlarmMatchesSettings();
});

async function ensureAlarmMatchesSettings() {
  const { settings } = await chrome.storage.local.get(["settings"]);
  const freq = settings?.rotation?.frequency || "locked";

  // Clear any existing alarm first
  await chrome.alarms.clear("rotateBg");

  if (freq === "every_hour") {
    chrome.alarms.create("rotateBg", { periodInMinutes: 60 });
  } else if (freq === "every_day") {
    chrome.alarms.create("rotateBg", { periodInMinutes: 60 * 24 });
  }
  // locked / every_tab => no alarm needed
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "rotateBg") return;

  // 1) Invalidate cache so next resolve picks a new background
  const { settings } = await chrome.storage.local.get(["settings"]);
  if (!settings) return;

  settings.cache = settings.cache || {};
  settings.cache.lastBg = null;
  settings.cache.lastChangedAt = 0;
  await chrome.storage.local.set({ settings });

  // 2) Broadcast to all open viewer tabs to refresh NOW
  const viewerUrlPattern = `chrome-extension://${chrome.runtime.id}/viewer.html*`;

  chrome.tabs.query({ url: viewerUrlPattern }, (tabs) => {
    for (const t of tabs) {
      if (!t.id) continue;
      chrome.tabs.sendMessage(t.id, { type: "BG_ROTATE_NOW" });
    }
  });
});