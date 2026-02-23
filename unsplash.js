// unsplash.js
const UTM = "utm_source=pdf_bg_viewer&utm_medium=referral";

async function getUnsplashKey() {
  const data = await chrome.storage.local.get(["unsplashAccessKey"]);
  const key = (data.unsplashAccessKey || "").trim();
  if (!key) {
    throw new Error("Missing Unsplash Access Key. Add it in Background settings.");
  }
  return key;
}

async function unsplashFetchJson(url) {
  const key = await getUnsplashKey();
  const res = await fetch(url, {
    headers: {
      "Accept-Version": "v1",
      "Authorization": `Client-ID ${key}`
    }
  });
  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
  return res.json();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toResolvedUnsplash(photo) {
  const imageUrl = photo.urls?.regular || photo.urls?.full;

  return {
    renderType: "image",
    url: imageUrl,
    unsplashDownloadUrl: photo.links?.download_location || null,
    attribution: {
      photographerName: photo.user?.name || "Unknown",
      photographerUrl: `${photo.user?.links?.html}?${UTM}`,
      unsplashUrl: `${photo.links?.html}?${UTM}`
    }
  };
}

export async function unsplashPickFromSearch(query) {
  if (!query) throw new Error("Unsplash search query is empty");
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`;
  const data = await unsplashFetchJson(url);
  const photo = pickRandom(data.results || []);
  if (!photo) throw new Error("No Unsplash results");
  return toResolvedUnsplash(photo);
}

export async function unsplashPickFromCollection(collectionId) {
  if (!collectionId) throw new Error("No collection id");
  const url = `https://api.unsplash.com/collections/${encodeURIComponent(collectionId)}/photos?per_page=30&orientation=landscape`;
  const data = await unsplashFetchJson(url);
  const photo = pickRandom(data || []);
  if (!photo) throw new Error("No photos in collection");
  return toResolvedUnsplash(photo);
}