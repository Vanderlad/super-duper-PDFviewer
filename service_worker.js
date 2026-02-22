chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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