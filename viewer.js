import * as pdfjsLib from "./pdfjs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

function getPdfUrlFromQuery() {
  const params = new URLSearchParams(location.search);
  return params.get("src");
}

async function renderPdf(url) {
  if (!url) {
    document.getElementById("pages").textContent = "No PDF URL provided.";
    return;
  }

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ url });
  const pdf = await loadingTask.promise;

  const pagesEl = document.getElementById("pages");
  pagesEl.innerHTML = "";

  // Render each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // Pick a scale that roughly matches our CSS width
    const viewport1 = page.getViewport({ scale: 1.0 });
    const targetWidth = 860;
    const scale = targetWidth / viewport1.width;
    const viewport = page.getViewport({ scale });

    const pageWrap = document.createElement("div");
    pageWrap.className = "page";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    pageWrap.appendChild(canvas);
    pagesEl.appendChild(pageWrap);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;
  }
}

renderPdf(getPdfUrlFromQuery());