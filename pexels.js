async function getPexelsKey() {
  const data = await chrome.storage.local.get(["pexelsAccessKey"]);
  const key = (data.pexelsAccessKey || "").trim();
  if (!key) throw new Error("Missing Pexels API key");
  return key;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function pexelsPickVideo(query) {
  if (!query) throw new Error("Video search query is empty");

  const key = await getPexelsKey();

  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
    {
      headers: {
        Authorization: key
      }
    }
  );

  if (!res.ok) throw new Error(`Pexels error ${res.status}`);

  const data = await res.json();
  const video = pickRandom(data.videos || []);

  if (!video) throw new Error("No videos found");

  // Pick a good quality file
  const file = video.video_files.find(f => f.quality === "hd") || video.video_files[0];

  return {
    renderType: "video",
    url: file.link,
    attribution: {
      photographerName: video.user?.name || "Unknown",
      photographerUrl: video.user?.url,
      unsplashUrl: null // not used
    }
  };
}