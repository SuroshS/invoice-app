let pdfjsLoadPromise = null;

export function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

// Shared by Invoices.jsx / CreateInvoice.jsx / Clients.jsx — rasterizes a
// generated PDF blob into one <img>-ready data URL per page.
export async function renderPdfPagesToImages(blob, scale = 3) {
  await loadPdfJs();
  const arrayBuffer = await blob.arrayBuffer();
  const pdfDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    pages.push(canvas.toDataURL("image/png"));
  }
  return pages;
}
