const bgLayer = document.getElementById("bgLayer");
const bgDim = document.getElementById("bgDim");

const btnPickBg = document.getElementById("btnPickBg");
const btnClearBg = document.getElementById("btnClearBg");
const fileBg = document.getElementById("fileBg");

const blur = document.getElementById("blur");
const blurVal = document.getElementById("blurVal");

const dim = document.getElementById("dim");
const dimVal = document.getElementById("dimVal");

function applySettings({ bgDataUrl, blurPx = 12, dimOpacity = 0.25 }) {
  if (bgDataUrl) {
    bgLayer.style.backgroundImage = `url("${bgDataUrl}")`;
  } else {
    bgLayer.style.backgroundImage = "none";
    bgLayer.style.backgroundColor = "#111";
  }

  bgLayer.style.filter = `blur(${blurPx}px)`;
  bgDim.style.opacity = String(dimOpacity);

  blur.value = String(blurPx);
  blurVal.textContent = String(blurPx);

  dim.value = String(dimOpacity);
  dimVal.textContent = String(dimOpacity);
}

async function loadSettings() {
  const data = await chrome.storage.local.get(["bgDataUrl", "blurPx", "dimOpacity"]);
  applySettings(data);
}

async function saveSettings(patch) {
  await chrome.storage.local.set(patch);
  const current = await chrome.storage.local.get(["bgDataUrl", "blurPx", "dimOpacity"]);
  applySettings(current);
}

btnPickBg.addEventListener("click", () => fileBg.click());

fileBg.addEventListener("change", async () => {
  const file = fileBg.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    // Data URL (simple MVP). For huge images, this can be big—fine for now.
    await saveSettings({ bgDataUrl: reader.result });
  };
  reader.readAsDataURL(file);
});

btnClearBg.addEventListener("click", async () => {
  await saveSettings({ bgDataUrl: null });
});

blur.addEventListener("input", async () => {
  blurVal.textContent = blur.value;
  await chrome.storage.local.set({ blurPx: Number(blur.value) });
  bgLayer.style.filter = `blur(${blur.value}px)`;
});

dim.addEventListener("input", async () => {
  dimVal.textContent = dim.value;
  await chrome.storage.local.set({ dimOpacity: Number(dim.value) });
  bgDim.style.opacity = dim.value;
});

loadSettings();