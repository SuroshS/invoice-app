import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";

let pdfjsLoadPromise = null;

function loadPdfJs() {
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

const styles = `
.inv-page { box-sizing: border-box; width: 100%; max-width: none; margin: 0; padding: 2rem; font-family: system-ui, sans-serif; }
.inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 12px; flex-wrap: wrap; }
.inv-title { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0; }
.inv-create-btn { height: 34px; padding: 0 13px; border-radius: 8px; border: 1px solid #111; background: #111; color: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: system-ui; }
.inv-global-error { background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0; border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 14px; }
.inv-global-success { background: #f0faf5; color: #2a7a50; border: 1px solid #c3e6d8; border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 14px; }

/* Read-only banner — shown when trial has expired but user still has full view access */
.inv-readonly-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #c61919ff;
  border: 1px solid #c61919ff;
  border-radius: 9px;
  padding: 10px 14px;
  font-size: 0.82rem;
  color: #ffffffff;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.inv-readonly-banner-text { flex: 1; line-height: 1.5; }
.inv-readonly-banner-text strong { font-weight: 700; }
.inv-readonly-subscribe-btn {
  height: 30px;
  padding: 0 13px;
  border-radius: 7px;
  border: 1px solid #ffffffff;
  background: #ffffffff;
  color: #000000ff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  white-space: nowrap;
  flex-shrink: 0;
}
.inv-readonly-subscribe-btn:hover { background: #000000ff; color: #ffffffff; }

.inv-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.inv-stat { background: #fff; border: 1px solid #ebebeb; border-radius: 10px; padding: 14px 18px; }
.inv-stat p { font-size: 0.7rem; color: #bbb; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; margin: 0 0 6px; }
.inv-stat h2 { font-size: 1.4rem; font-weight: 600; color: #111; margin: 0; }
.inv-tools { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.inv-filters { display: flex; gap: 8px; flex-shrink: 0; }
.inv-filter-btn { height: 34px; padding: 0 13px; border-radius: 8px; border: 1px solid #e0e0e0; background: #fff; color: #333; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: system-ui; }
.inv-filter-btn.active { background: #111; color: #fff; border-color: #111; }
.inv-search { width: 100%; max-width: 280px; height: 34px; padding: 0 11px; border-radius: 8px; border: 1px solid #e0e0e0; background: #fff; font-size: 0.82rem; color: #333; font-family: system-ui; }
.inv-card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; width: 100%; }
.inv-table-wrap { width: 100%; border-radius: 12px; }
.inv-empty { padding: 40px 24px; text-align: center; font-size: 0.875rem; color: #bbb; }
.inv-table { width: 100%; min-width: 680px; border-collapse: collapse; }
.inv-table thead th { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #bbb; padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; background: #fafafa; white-space: nowrap; }
.inv-table tbody tr { border-bottom: 1px solid #f5f5f5; position: relative; }
.inv-table tbody tr:hover { background: #fafafa; }
.inv-table td { padding: 12px 16px; font-size: 0.85rem; color: #333; vertical-align: middle; white-space: nowrap; }
.inv-table td:last-child { text-align: right; }
.inv-client-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.inv-num-cell { display: flex; flex-direction: column; gap: 2px; }
.type-badge { font-size: 0.65rem; font-weight: 600; padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
.type-invoice { background: #f0f0f0; color: #555; }
.type-quote { background: #f0eefe; color: #5b41c0; }
.link-badge {
  font-size: 0.65rem; font-weight: 500; color: #888; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 3px; cursor: pointer; text-decoration: underline;
}
.link-badge:hover { color: #111; }

.inv-row-actions { display: inline-flex; align-items: center; gap: 6px; }
.btn-preview {
  height: 30px; padding: 0 12px; border-radius: 7px; border: 1px solid #111;
  background: #111; color: #fff; font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: system-ui;
}
.btn-preview:hover { background: #333; }

.more-wrap { position: relative; display: inline-flex; }
.more-btn {
  width: 30px; height: 30px; border-radius: 7px; border: 1px solid #e0e0e0;
  background: #fff; color: #888; cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 16px; font-family: system-ui; line-height: 1;
}
.more-btn:hover { background: #f5f5f5; border-color: #bbb; }
.more-btn.open { background: #111; color: #fff; border-color: #111; }

.more-menu {
  position: absolute; top: 36px; right: 0; background: #fff; border: 1px solid #ebebeb;
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.14); min-width: 170px;
  z-index: 80; display: none; overflow: hidden; padding: 6px; text-align: left;
}
.more-menu.show { display: block; }
.more-menu.open-up { top: auto; bottom: 36px; }
.more-menu-item {
  display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 7px;
  font-size: 0.82rem; font-weight: 500; color: #333; cursor: pointer; white-space: nowrap;
  background: none; border: none; width: 100%; text-align: left; font-family: system-ui;
}
.more-menu-item:hover { background: #f5f5f5; }
.more-menu-item .mi-icon { width: 16px; flex-shrink: 0; font-size: 13px; color: #999; }
.more-menu-item.convert-item { color: #5b41c0; }
.more-menu-item.convert-item .mi-icon { color: #5b41c0; }
.more-menu-divider { height: 1px; background: #f0f0f0; margin: 5px 4px; }
.more-menu-item.delete-item { color: #c0392b; }
.more-menu-item.delete-item .mi-icon { color: #c0392b; }
.more-menu-item.locked-item { color: #aaa; }
.more-menu-item.locked-item .mi-icon { color: #ccc; }

.inv-mobile-list { display: none; }
.inv-mobile-card { padding: 14px 16px; border-bottom: 1px solid #f5f5f5; position: relative; }
.inv-mobile-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 10px; }
.inv-mobile-left { flex: 1; min-width: 0; }
.inv-mobile-num { font-size: 0.85rem; font-weight: 500; color: #111; display: flex; align-items: center; gap: 7px; margin-bottom: 3px; }
.inv-mobile-client { font-size: 0.78rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.inv-mobile-link { font-size: 0.7rem; color: #888; margin-top: 2px; text-decoration: underline; }
.inv-mobile-right { text-align: right; flex-shrink: 0; }
.inv-mobile-total { font-size: 0.95rem; font-weight: 600; color: #111; }
.inv-mobile-date { font-size: 0.72rem; color: #bbb; margin-top: 2px; }
.inv-mobile-actions { display: flex; gap: 8px; align-items: center; }
.inv-mobile-actions .btn-preview { flex: 1; height: 34px; }
.inv-mobile-actions .more-wrap { flex-shrink: 0; }
.inv-mobile-actions .more-btn { width: 34px; height: 34px; }
.inv-mobile-actions .more-menu { top: 40px; }
.inv-mobile-actions .more-menu.open-up { top: auto; bottom: 40px; }

.preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
.preview-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 760px; height: 88vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.preview-topbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; gap: 12px; }
.preview-topbar-left { min-width: 0; }
.preview-modal-num { font-size: 0.92rem; font-weight: 700; color: #111; margin-bottom: 2px; }
.preview-modal-meta { font-size: 0.76rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.preview-modal-link { font-size: 0.72rem; color: #5b41c0; margin-top: 4px; text-decoration: underline; cursor: pointer; display: inline-block; }
.preview-topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.preview-primary-btn {
  height: 34px; padding: 0 16px; border-radius: 8px; border: 1px solid #111;
  background: #111; color: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer;
  font-family: system-ui; white-space: nowrap; display: flex; align-items: center; gap: 6px;
}
.preview-primary-btn:hover { background: #333; }
.preview-primary-btn.convert { background: #533483; border-color: #533483; }
.preview-primary-btn.convert:hover { background: #443070; }
.preview-more-wrap { position: relative; }
.preview-more-btn {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e0e0e0;
  background: #fff; color: #888; cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 17px; font-family: system-ui; line-height: 1;
}
.preview-more-btn:hover { background: #f5f5f5; border-color: #bbb; }
.preview-more-btn.open { background: #111; color: #fff; border-color: #111; }
.preview-more-menu {
  position: absolute; top: 40px; right: 0; background: #fff; border: 1px solid #ebebeb;
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.16); min-width: 180px;
  display: none; overflow: hidden; padding: 6px; z-index: 90; text-align: left;
}
.preview-more-menu.show { display: block; }
.preview-close { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e5e5; background: #f5f5f5; color: #888; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.preview-body { flex: 1; overflow-y: auto; overflow-x: hidden; background: #f7f7f7; padding: 16px; }
.preview-page-img { width: 100%; height: auto; display: block; margin: 0 auto 16px; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }

.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 700; display: flex; align-items: center; justify-content: center; padding: 20px; }
.confirm-modal { width: 100%; max-width: 380px; background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.confirm-title { margin: 0 0 6px; font-size: 1rem; font-weight: 600; color: #111; }
.confirm-text { margin: 0 0 14px; font-size: 0.85rem; color: #888; line-height: 1.5; }
.confirm-error { background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0; border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; margin-bottom: 14px; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
.confirm-cancel, .confirm-delete, .confirm-convert { height: 34px; padding: 0 13px; border-radius: 8px; cursor: pointer; font-family: system-ui; font-size: 0.82rem; font-weight: 600; border: 1px solid #e0e0e0; display: flex; align-items: center; gap: 6px; }
.confirm-cancel { background: #fff; color: #333; }
.confirm-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.confirm-delete { background: #c0392b; color: #fff; border-color: #c0392b; }
.confirm-convert { background: #533483; color: #fff; border-color: #533483; }
.confirm-delete:disabled, .confirm-convert:disabled { opacity: 0.6; cursor: not-allowed; }
.confirm-spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .inv-page { padding: 1rem; }
  .inv-header { align-items: stretch; flex-direction: column; }
  .inv-create-btn { width: 100%; }
  .inv-stats { grid-template-columns: 1fr 1fr; gap: 8px; }
  .revenue-stat { grid-column: 1 / -1; }
  .inv-tools { flex-direction: column; align-items: stretch; }
  .inv-filters { display: grid; grid-template-columns: repeat(3, 1fr); }
  .inv-search { max-width: 100%; width: 100%; }
  .inv-table-wrap { display: none; }
  .inv-mobile-list { display: block; }
  .preview-overlay { align-items: flex-end; padding: 0; }
  .preview-modal { height: 92vh; max-height: 92vh; border-radius: 16px 16px 0 0; }
  .preview-topbar { padding: 14px 16px; align-items: flex-start; }
  .preview-primary-btn { height: 32px; padding: 0 12px; font-size: 0.76rem; }
  .inv-readonly-banner { flex-direction: column; align-items: flex-start; }
}
`;

// Calls the upgrade prompt that lives in AuthGate. Using the window bridge
// set up by UpgradePromptBridge so we don't need to pass it as a prop.
function showUpgradePrompt() {
  if (typeof window.__payvleShowUpgradePrompt === "function") {
    window.__payvleShowUpgradePrompt();
  }
}

export default function Invoices() {
  const { data, deleteInvoice, convertQuoteToInvoice, isReadOnly } = useApp();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");
  const [confirmConvert, setConfirmConvert] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [openUpKey, setOpenUpKey] = useState(null);

  const invoices = data?.invoices || [];

  useEffect(() => {
    function handleOutsideClick(e) {
      const clickedInsideMenu = e.target.closest(".more-menu, .preview-more-menu");
      const clickedToggleBtn = e.target.closest(".more-btn, .preview-more-btn");
      if (!clickedInsideMenu && !clickedToggleBtn) {
        setOpenMenuKey(null);
        setOpenUpKey(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function toggleMenu(key, e) {
    e.stopPropagation();
    const isClosing = openMenuKey === key;
    if (isClosing) { setOpenMenuKey(null); return; }
    const btnRect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - btnRect.bottom;
    setOpenUpKey(spaceBelow < 220 ? key : null);
    setOpenMenuKey(key);
  }

  function closeMenu() {
    setOpenMenuKey(null);
    setOpenUpKey(null);
  }

  function fmt(n) {
    return (n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  function findById(id) { return invoices.find((i) => i._id === id); }

  function jumpToLinked(id) {
    const target = findById(id);
    if (!target) { setGlobalError("That linked document could not be found."); setTimeout(() => setGlobalError(""), 4000); return; }
    openPreview(target, invoices.indexOf(target));
  }

  async function generatePdfBlob(invoice) {
    return await pdf(
      <InvoicePDF invoice={invoice} settings={data.settings} totals={{ subtotal: invoice.subtotal || 0, gst: invoice.gst || 0, total: invoice.total || 0 }} />
    ).toBlob();
  }

  async function openPreview(invoice, originalIndex) {
    closeMenu();
    setPreview(invoice);
    setPreviewIndex(originalIndex);
    setPdfPages([]);
    setDeleteError("");
    setPdfLoading(true);
    try {
      await loadPdfJs();
      const blob = await generatePdfBlob(invoice);
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const pages = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        pages.push(canvas.toDataURL("image/png"));
      }
      setPdfPages(pages);
    } catch (e) {
      console.error("PDF preview error:", e);
      setGlobalError("Could not generate preview.");
      setTimeout(() => setGlobalError(""), 4000);
    }
    setPdfLoading(false);
  }

  function closePreview() {
    setPreview(null); setPreviewIndex(null); setPdfPages([]); setPdfLoading(false);
    setConfirmDelete(false); setDeleteError(""); setDeleting(false); setOpenMenuKey(null);
  }

  // If isReadOnly, intercept create/edit/convert and show the upgrade prompt instead.
  function goToCreate() {
    if (isReadOnly) { showUpgradePrompt(); return; }
    navigate("/create");
  }

  function goToEdit(invoice) {
    closeMenu();
    if (isReadOnly) { showUpgradePrompt(); return; }
    navigate("/create", { state: { editingInvoice: invoice } });
  }

  function openConvertConfirm(quote) {
    closeMenu();
    if (isReadOnly) { showUpgradePrompt(); return; }
    setConvertError("");
    setConfirmConvert(quote);
  }

  async function downloadPDF(invoice) {
    closeMenu();
    try {
      const blob = await generatePdfBlob(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
      setGlobalError("Could not download PDF.");
      setTimeout(() => setGlobalError(""), 4000);
    }
  }

  async function printPDF(invoice) {
    closeMenu();
    try {
      const blob = await generatePdfBlob(invoice);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (!printWindow) { setGlobalError("Pop-up blocked. Please allow pop-ups to print."); setTimeout(() => setGlobalError(""), 4000); return; }
      printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
    } catch (e) {
      console.error("Print error:", e);
      setGlobalError("Could not print PDF.");
      setTimeout(() => setGlobalError(""), 4000);
    }
  }

  async function confirmDeleteInvoice() {
    if (previewIndex === null || previewIndex === undefined) return;
    setDeleting(true); setDeleteError("");
    const { error } = await deleteInvoice(previewIndex);
    if (error) { setDeleteError(error); setDeleting(false); return; }
    closePreview();
  }

  function openDeleteConfirm() { closeMenu(); setConfirmDelete(true); }

  async function handleConvert() {
    if (!confirmConvert) return;
    setConverting(true); setConvertError("");
    try {
      const invoiceVersion = { ...confirmConvert, type: "Invoice" };
      await loadPdfJs();
      const blob = await generatePdfBlob(invoiceVersion);
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const totals = { subtotal: confirmConvert.subtotal || 0, gst: confirmConvert.gst || 0, total: confirmConvert.total || 0 };
      const { error, invoiceNumber } = await convertQuoteToInvoice(confirmConvert._id, invoiceVersion, totals, base64);
      if (error) { setConvertError(error); setConverting(false); return; }
      setConfirmConvert(null); setConverting(false);
      if (preview && preview._id === confirmConvert._id) closePreview();
      setGlobalSuccess(`Converted to ${invoiceNumber}. The original quote has been kept.`);
      setTimeout(() => setGlobalSuccess(""), 5000);
    } catch (e) {
      console.error("Convert error:", e);
      setConvertError("Failed to convert this quote. Please try again.");
      setConverting(false);
    }
  }

  const allInvoices = invoices.filter((i) => i.type === "Invoice" || !i.type);
  const quotes = invoices.filter((i) => i.type === "Quote");
  const totalRevenue = allInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const sorted = [...invoices].sort((a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date));
  const filtered = sorted.filter((invoice) => {
    const matchesType = filter === "All" || (filter === "Invoice" && (invoice.type === "Invoice" || !invoice.type)) || (filter === "Quote" && invoice.type === "Quote");
    const matchesSearch = (invoice.billToName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <>
      <style>{styles}</style>

      <div className="inv-page">
        <div className="inv-header">
          <h1 className="inv-title">Invoices & Quotes</h1>
          <button className="inv-create-btn" onClick={goToCreate}>
            + Create
          </button>
        </div>

        {/* Read-only banner — only shown when trial has expired */}
        {isReadOnly && (
          <div className="inv-readonly-banner">
            <span className="inv-readonly-banner-text">
              <strong>Your trial has ended.</strong> You can still view, download and print your existing records — subscribe to create and edit invoices.
            </span>
            <button className="inv-readonly-subscribe-btn" onClick={showUpgradePrompt}>
              Subscribe →
            </button>
          </div>
        )}

        {globalError && <div className="inv-global-error">⚠ {globalError}</div>}
        {globalSuccess && <div className="inv-global-success">✓ {globalSuccess}</div>}

        <div className="inv-stats">
          <div className="inv-stat"><p>Invoices</p><h2>{allInvoices.length}</h2></div>
          <div className="inv-stat"><p>Quotes</p><h2>{quotes.length}</h2></div>
          <div className="inv-stat revenue-stat"><p>Revenue</p><h2>${fmt(totalRevenue)}</h2></div>
        </div>

        <div className="inv-tools">
          <div className="inv-filters">
            {["All", "Invoice", "Quote"].map((option) => (
              <button key={option} className={`inv-filter-btn${filter === option ? " active" : ""}`} onClick={() => setFilter(option)}>
                {option === "All" ? "All" : `${option}s`}
              </button>
            ))}
          </div>
          <input className="inv-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by client..." />
        </div>

        <div className="inv-card">
          {invoices.length === 0 ? (
            <div className="inv-empty">No invoices or quotes yet.</div>
          ) : filtered.length === 0 ? (
            <div className="inv-empty">No matching records found.</div>
          ) : (
            <>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Type</th><th>Client</th><th>Date</th><th>Total</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((invoice) => {
                      const origIndex = invoices.indexOf(invoice);
                      const isQuote = invoice.type === "Quote";
                      const canConvert = isQuote && !invoice.convertedToInvoiceId;
                      const rowKey = `row:${invoice._id || origIndex}`;

                      return (
                        <tr key={invoice._id || origIndex}>
                          <td>
                            <div className="inv-num-cell">
                              <span style={{ fontWeight: 500, color: "#111" }}>{invoice.invoiceNumber}</span>
                              {isQuote && invoice.convertedToInvoiceId && (
                                <span className="link-badge" onClick={() => jumpToLinked(invoice.convertedToInvoiceId)}>→ {invoice.convertedToInvoiceNumber}</span>
                              )}
                              {!isQuote && invoice.convertedFromQuoteId && (
                                <span className="link-badge" onClick={() => jumpToLinked(invoice.convertedFromQuoteId)}>← {invoice.convertedFromQuoteNumber}</span>
                              )}
                            </div>
                          </td>
                          <td><span className={`type-badge ${isQuote ? "type-quote" : "type-invoice"}`}>{isQuote ? "Quote" : "Invoice"}</span></td>
                          <td className="inv-client-cell">{invoice.billToName || "—"}</td>
                          <td style={{ color: "#888" }}>{formatDate(invoice.date)}</td>
                          <td style={{ fontWeight: 500 }}>${fmt(invoice.total)}</td>
                          <td>
                            <div className="inv-row-actions">
                              <button className="btn-preview" onClick={() => openPreview(invoice, origIndex)}>Preview</button>
                              <div className="more-wrap">
                                <button className={`more-btn${openMenuKey === rowKey ? " open" : ""}`} onClick={(e) => toggleMenu(rowKey, e)} aria-label="More actions">⋯</button>
                                <div className={`more-menu${openMenuKey === rowKey ? " show" : ""}${openUpKey === rowKey ? " open-up" : ""}`}>
                                  <button className={`more-menu-item${isReadOnly ? " locked-item" : ""}`} onClick={() => goToEdit(invoice)}>
                                    <span className="mi-icon">{isReadOnly ? "✎" : "✎"}</span> Edit
                                  </button>
                                  {canConvert && (
                                    <button className={`more-menu-item convert-item${isReadOnly ? " locked-item" : ""}`} onClick={() => openConvertConfirm(invoice)}>
                                      <span className="mi-icon">{isReadOnly ? "→" : "→"}</span> Convert to invoice
                                    </button>
                                  )}
                                  <button className="more-menu-item" onClick={() => downloadPDF(invoice)}>
                                    <span className="mi-icon">↓</span> Download PDF
                                  </button>
                                  <button className="more-menu-item" onClick={() => printPDF(invoice)}>
                                    <span className="mi-icon">⎙</span> Print
                                  </button>
                                  <div className="more-menu-divider" />
                                  <button className="more-menu-item delete-item" onClick={() => { closeMenu(); setPreview(invoice); setPreviewIndex(origIndex); setConfirmDelete(true); }}>
                                    <span className="mi-icon">✕</span> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="inv-mobile-list">
                {filtered.map((invoice) => {
                  const origIndex = invoices.indexOf(invoice);
                  const isQuote = invoice.type === "Quote";
                  const canConvert = isQuote && !invoice.convertedToInvoiceId;
                  const mobileKey = `mobile:${invoice._id || origIndex}`;

                  return (
                    <div key={invoice._id || origIndex} className="inv-mobile-card">
                      <div className="inv-mobile-top">
                        <div className="inv-mobile-left">
                          <div className="inv-mobile-num">
                            <span className={`type-badge ${isQuote ? "type-quote" : "type-invoice"}`}>{isQuote ? "QUO" : "INV"}</span>
                            {invoice.invoiceNumber}
                          </div>
                          <div className="inv-mobile-client">{invoice.billToName || "No client"}</div>
                          {isQuote && invoice.convertedToInvoiceId && (<div className="inv-mobile-link" onClick={() => jumpToLinked(invoice.convertedToInvoiceId)}>→ Converted to {invoice.convertedToInvoiceNumber}</div>)}
                          {!isQuote && invoice.convertedFromQuoteId && (<div className="inv-mobile-link" onClick={() => jumpToLinked(invoice.convertedFromQuoteId)}>← From {invoice.convertedFromQuoteNumber}</div>)}
                        </div>
                        <div className="inv-mobile-right">
                          <div className="inv-mobile-total">${fmt(invoice.total)}</div>
                          <div className="inv-mobile-date">{formatDate(invoice.date)}</div>
                        </div>
                      </div>
                      <div className="inv-mobile-actions">
                        <button className="btn-preview" onClick={() => openPreview(invoice, origIndex)}>Preview</button>
                        <div className="more-wrap">
                          <button className={`more-btn${openMenuKey === mobileKey ? " open" : ""}`} onClick={(e) => toggleMenu(mobileKey, e)} aria-label="More actions">⋯</button>
                          <div className={`more-menu${openMenuKey === mobileKey ? " show" : ""}${openUpKey === mobileKey ? " open-up" : ""}`}>
                            <button className={`more-menu-item${isReadOnly ? " locked-item" : ""}`} onClick={() => goToEdit(invoice)}>
                              <span className="mi-icon">{isReadOnly ? "✎" : "✎"}</span> Edit
                            </button>
                            {canConvert && (
                              <button className={`more-menu-item convert-item${isReadOnly ? " locked-item" : ""}`} onClick={() => openConvertConfirm(invoice)}>
                                <span className="mi-icon">{isReadOnly ? "→" : "→"}</span> Convert to invoice
                              </button>
                            )}
                            <button className="more-menu-item" onClick={() => downloadPDF(invoice)}><span className="mi-icon">↓</span> Download PDF</button>
                            <button className="more-menu-item" onClick={() => printPDF(invoice)}><span className="mi-icon">⎙</span> Print</button>
                            <div className="more-menu-divider" />
                            <button className="more-menu-item delete-item" onClick={() => { closeMenu(); setPreview(invoice); setPreviewIndex(origIndex); setConfirmDelete(true); }}>
                              <span className="mi-icon">✕</span> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {preview && (
        <div className="preview-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-topbar">
              <div className="preview-topbar-left">
                <div className="preview-modal-num">{preview.invoiceNumber}</div>
                <div className="preview-modal-meta">{preview.billToName || "No client"} · {formatDate(preview.date)}</div>
                {preview.type === "Quote" && preview.convertedToInvoiceId && (<span className="preview-modal-link" onClick={() => jumpToLinked(preview.convertedToInvoiceId)}>→ Converted to {preview.convertedToInvoiceNumber}</span>)}
                {preview.type !== "Quote" && preview.convertedFromQuoteId && (<span className="preview-modal-link" onClick={() => jumpToLinked(preview.convertedFromQuoteId)}>← From quote {preview.convertedFromQuoteNumber}</span>)}
              </div>
              <div className="preview-topbar-right">
                {preview.type === "Quote" && !preview.convertedToInvoiceId ? (
                  <button className="preview-primary-btn convert" onClick={() => openConvertConfirm(preview)}>
                    {isReadOnly ? "→ Convert to invoice" : "→ Convert to invoice"}
                  </button>
                ) : (
                  <button className="preview-primary-btn" onClick={() => downloadPDF(preview)}>↓ Download PDF</button>
                )}
                <div className="preview-more-wrap">
                  <button className={`preview-more-btn${openMenuKey === "previewMenu" ? " open" : ""}`} onClick={(e) => toggleMenu("previewMenu", e)} aria-label="More actions">⋯</button>
                  <div className={`preview-more-menu${openMenuKey === "previewMenu" ? " show" : ""}`}>
                    <button className={`more-menu-item${isReadOnly ? " locked-item" : ""}`} onClick={() => goToEdit(preview)}>
                      <span className="mi-icon">{isReadOnly ? "✎" : "✎"}</span> Edit
                    </button>
                    {(preview.type !== "Quote" || preview.convertedToInvoiceId) && (
                      <button className="more-menu-item" onClick={() => downloadPDF(preview)}><span className="mi-icon">↓</span> Download PDF</button>
                    )}
                    <button className="more-menu-item" onClick={() => printPDF(preview)}><span className="mi-icon">⎙</span> Print</button>
                    <div className="more-menu-divider" />
                    <button className="more-menu-item delete-item" onClick={openDeleteConfirm}><span className="mi-icon">✕</span> Delete</button>
                  </div>
                </div>
                <button className="preview-close" onClick={closePreview}>✕</button>
              </div>
            </div>
            <div className="preview-body">
              {pdfLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#aaa", fontSize: "0.875rem", gap: 10, flexDirection: "column" }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #ebebeb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Loading preview...
                </div>
              )}
              {!pdfLoading && pdfPages.map((src, i) => (<img key={i} src={src} alt={`Page ${i + 1}`} className="preview-page-img" />))}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Delete this document?</h3>
            <p className="confirm-text">Are you sure you want to delete {preview?.invoiceNumber}? This action cannot be undone.</p>
            {deleteError && <div className="confirm-error">⚠ {deleteError}</div>}
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
              <button className="confirm-delete" onClick={confirmDeleteInvoice} disabled={deleting}>
                {deleting && <div className="confirm-spinner" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConvert && (
        <div className="confirm-overlay" onClick={() => !converting && setConfirmConvert(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Convert to invoice?</h3>
            <p className="confirm-text">This creates a new invoice from <strong>{confirmConvert.invoiceNumber}</strong> with its own invoice number. The original quote will stay exactly as it is — nothing is deleted.</p>
            {convertError && <div className="confirm-error">⚠ {convertError}</div>}
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmConvert(null)} disabled={converting}>Cancel</button>
              <button className="confirm-convert" onClick={handleConvert} disabled={converting}>
                {converting && <div className="confirm-spinner" />}
                {converting ? "Converting..." : "Convert to Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}