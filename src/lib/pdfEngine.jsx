// Dynamically imports @react-pdf/renderer and InvoicePDF.jsx only when a
// PDF actually needs to be generated.
//
// Invoices.jsx, CreateInvoice.jsx, and Clients.jsx are already route-level
// lazy chunks, but they previously imported `{ pdf } from "@react-pdf/renderer"`
// and `InvoicePDF` as ordinary top-level (static) imports. A static import is
// not deferred — it's a hard prerequisite of the module that imports it, so
// simply navigating to any of those three pages forced the browser to fetch
// and evaluate the entire ~527KB gzipped react-pdf engine, even if the user
// never clicked Preview/Download/Print/Send in that visit (confirmed by
// inspecting the actual production build output: Invoices-*.js contains a
// static `import ... from "./InvoicePDF-*.js"` at the top of the compiled
// chunk). Routing that dependency through a dynamic import() here means
// each page's own chunk no longer carries that weight, and the engine
// downloads exactly once, the first time it's genuinely needed, then stays
// cached in the browser for the rest of the session.
let pdfModulePromise = null;

function loadPdfModules() {
  if (!pdfModulePromise) {
    pdfModulePromise = Promise.all([
      import("@react-pdf/renderer"),
      import("../pages/InvoicePDF"),
    ]);
  }
  return pdfModulePromise;
}

export async function generateInvoicePdfBlob(invoice, settings, totals) {
  const [{ pdf }, { default: InvoicePDF }] = await loadPdfModules();
  const doc = <InvoicePDF invoice={invoice} settings={settings} totals={totals} />;
  return pdf(doc).toBlob();
}

// Lets Dashboard's existing idle-prefetch (see usePrefetchIdle) warm this up
// in the background — same reasoning as its existing loadPdfJs() prefetch —
// so the first real PDF action in a session still feels instant even though
// the engine is no longer bundled into the page chunks themselves.
export function prefetchPdfEngine() {
  loadPdfModules().catch(() => {});
}
