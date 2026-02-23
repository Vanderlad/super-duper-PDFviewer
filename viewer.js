import * as pdfjsLib from "./pdfjs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

function getPdfUrlFromQuery() {
  const params = new URLSearchParams(location.search);
  return params.get("src");
}

async function renderPdf(url) {
  const pagesEl = document.getElementById("pages");

  if (!url) {
    pagesEl.textContent = "No PDF URL provided.";
    return;
  }

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ url });
  const pdf = await loadingTask.promise;

  pagesEl.innerHTML = "";

  const targetCssWidth = 860; // matches your --page-width
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap for performance

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // Base viewport at scale 1 (CSS pixels)
    const viewport1 = page.getViewport({ scale: 1 });

    // Scale to fit your desired CSS width
    const cssScale = targetCssWidth / viewport1.width;

    // Render scale = CSS scale * device pixel ratio (sharper)
    const renderViewport = page.getViewport({ scale: cssScale * dpr });

    const pageWrap = document.createElement("div");
    pageWrap.className = "page";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    // Actual pixel buffer size (device pixels)
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    // Display size (CSS pixels)
    canvas.style.width = `${Math.floor(renderViewport.width / dpr)}px`;
    canvas.style.height = `${Math.floor(renderViewport.height / dpr)}px`;

    pageWrap.appendChild(canvas);
    pagesEl.appendChild(pageWrap);

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
    }).promise;
  }
}

renderPdf(getPdfUrlFromQuery());