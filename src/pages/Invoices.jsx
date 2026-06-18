import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const styles = `

.inv-page {
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

@media (max-width: 640px) {
  .inv-page {
    padding: 1rem;
  }
}

.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 12px;
  flex-wrap: wrap;
}

.inv-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.inv-create-btn {
  height: 34px;
  padding: 0 13px;
  border-radius: 8px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  white-space: nowrap;
}

.inv-create-btn:hover {
  background: #333;
  border-color: #333;
}

.inv-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.inv-stat {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 10px;
  padding: 14px 18px;
}

.inv-stat p {
  font-size: 0.7rem;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  margin: 0 0 6px;
}

.inv-stat h2 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #111;
  line-height: 1;
  margin: 0;
}

.inv-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.inv-filters {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.inv-filter-btn {
  height: 34px;
  padding: 0 13px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  white-space: nowrap;
}

.inv-filter-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.inv-filter-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.inv-search {
  width: 100%;
  max-width: 280px;
  height: 34px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 0.82rem;
  color: #333;
  font-family: system-ui;
}

.inv-search:focus {
  outline: none;
  border-color: #111;
}

.inv-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
}

.inv-empty {
  padding: 40px 24px;
  text-align: center;
  font-size: 0.875rem;
  color: #bbb;
}

.inv-table-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.inv-table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
}

.inv-table thead th {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #bbb;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  white-space: nowrap;
}

.inv-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}

.inv-table tbody tr:last-child {
  border-bottom: none;
}

.inv-table tbody tr:hover {
  background: #fafafa;
}

.inv-table td {
  padding: 12px 16px;
  font-size: 0.85rem;
  color: #333;
  vertical-align: middle;
  white-space: nowrap;
}

.inv-client-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  white-space: nowrap;
}

.type-invoice {
  background: #f0f0f0;
  color: #555;
}

.type-quote {
  background: #f0eefe;
  color: #5b41c0;
}

.btn-preview {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-preview:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

/* Mobile cards */
.inv-mobile-list {
  display: none;
}

.inv-mobile-card {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.inv-mobile-card:last-child {
  border-bottom: none;
}

.inv-mobile-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 10px;
}

.inv-mobile-left {
  flex: 1;
  min-width: 0;
}

.inv-mobile-num {
  font-size: 0.85rem;
  font-weight: 500;
  color: #111;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 3px;
}

.inv-mobile-client {
  font-size: 0.78rem;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inv-mobile-right {
  text-align: right;
  flex-shrink: 0;
}

.inv-mobile-total {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111;
}

.inv-mobile-date {
  font-size: 0.72rem;
  color: #bbb;
  margin-top: 2px;
}

.inv-mobile-actions {
  display: flex;
  gap: 8px;
}

.inv-mobile-actions button {
  flex: 1;
  height: 34px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  transition: all 0.15s;
}

/* Preview Modal */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.preview-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 760px;
  height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  animation: slideUp 0.2s ease;
}

.preview-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 12px;
}

.preview-topbar-left {
  min-width: 0;
}

.preview-modal-num {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 2px;
}

.preview-modal-meta {
  font-size: 0.75rem;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-action-btn {
  height: 34px;
  padding: 0 13px;
  background: #fff;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  white-space: nowrap;
  transition: all 0.15s;
}

.preview-action-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.preview-download-btn {
  background: #111;
  color: #fff;
  border-color: #111;
}

.preview-download-btn:hover {
  background: #333;
  border-color: #333;
}

.preview-delete-btn {
  background: #fff5f5;
  color: #c0392b;
  border-color: #fde0e0;
}

.preview-delete-btn:hover {
  background: #fde8e8;
  border-color: #f5caca;
}

.preview-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: #f5f5f5;
  color: #888;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: block;
  background: #f7f7f7;
  padding: 16px;
}

.preview-page-img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto 16px;
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.08);
}

/* Confirm Delete */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}

.confirm-modal {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
}

.confirm-title {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}

.confirm-text {
  margin: 0 0 18px;
  font-size: 0.85rem;
  color: #888;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-cancel,
.confirm-delete {
  height: 34px;
  padding: 0 13px;
  border-radius: 8px;
  cursor: pointer;
  font-family: system-ui;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid #e0e0e0;
}

.confirm-cancel {
  background: #fff;
  color: #333;
}

.confirm-delete {
  background: #c0392b;
  color: #fff;
  border-color: #c0392b;
}

.confirm-delete:hover {
  background: #a93226;
}

@media (max-width: 640px) {
  .inv-page {
    padding: 1rem;
  }

  .inv-header {
    align-items: stretch;
    flex-direction: column;
  }

  .inv-title {
    font-size: 1rem;
  }

  .inv-create-btn {
    width: 100%;
  }

  .inv-stats {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .revenue-stat {
    grid-column: 1 / -1;
  }

  .inv-stat {
    padding: 12px;
  }

  .inv-stat h2 {
    font-size: 1.1rem;
  }

  .inv-stat p {
    font-size: 0.62rem;
  }

  .inv-tools {
    flex-direction: column;
    align-items: stretch;
  }

  .inv-filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .inv-filter-btn {
    width: 100%;
  }

  .inv-search {
    max-width: 100%;
    width: 100%;
  }

  .inv-table-wrap {
    display: none;
  }

  .inv-mobile-list {
    display: block;
  }

  .preview-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .preview-modal {
    height: 92vh;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
  }

  .preview-topbar {
    padding: 14px 16px;
    align-items: flex-start;
  }

  .preview-topbar-right {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .preview-action-btn {
    height: 32px;
    padding: 0 11px;
    font-size: 0.75rem;
  }

  .preview-body {
    padding: 12px;
  }
}
`;

export default function Invoices() {
  const { data, deleteInvoice } = useApp();

const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invoices = data?.invoices || [];

  async function openPreview(invoice, originalIndex) {
    setPreview(invoice);
    setPreviewIndex(originalIndex);
    setPdfPages([]);

    if (!invoice.pdfBase64) return;

    setPdfLoading(true);

    try {
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const byteChars = atob(invoice.pdfBase64);
      const byteArray = new Uint8Array(byteChars.length);

      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }

      const pdfDoc = await window.pdfjsLib.getDocument({ data: byteArray })
        .promise;

      const pages = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 3 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        pages.push(canvas.toDataURL("image/png"));
      }

      setPdfPages(pages);
    } catch (e) {
      console.error("PDF render error:", e);
      setPdfPages([]);
    }

    setPdfLoading(false);
  }

  function closePreview() {
    setPreview(null);
    setPreviewIndex(null);
    setPdfPages([]);
    setPdfLoading(false);
    setConfirmDelete(false);
  }

  const allInvoices = invoices.filter(
    (i) => i.type === "Invoice" || !i.type
  );

  const quotes = invoices.filter((i) => i.type === "Quote");

  const totalRevenue = allInvoices.reduce(
    (acc, inv) => acc + (inv.total || 0),
    0
  );

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date)
  );

  const filtered = sorted.filter((invoice) => {
    const matchesType =
      filter === "All" ||
      (filter === "Invoice" && (invoice.type === "Invoice" || !invoice.type)) ||
      (filter === "Quote" && invoice.type === "Quote");

    const clientName = (invoice.billToName || "").toLowerCase();
    const matchesSearch = clientName.includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  function fmt(n) {
    return (n || 0).toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";

    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getPdfBlob(invoice) {
    if (!invoice?.pdfBase64) return null;

    const byteChars = atob(invoice.pdfBase64);
    const byteArray = new Uint8Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }

    return new Blob([byteArray], {
      type: "application/pdf",
    });
  }

  function downloadPDF(invoice) {
    const blob = getPdfBlob(invoice);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${invoice.invoiceNumber}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function printPDF(invoice) {
    const blob = getPdfBlob(invoice);

    if (!blob) {
      alert("No PDF saved for this invoice. Re-create and export it first.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url);

    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups to print this document.");
      URL.revokeObjectURL(url);
      return;
    }

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  function confirmDeleteInvoice() {
    if (previewIndex === null || previewIndex === undefined) return;

    deleteInvoice(previewIndex);
    closePreview();
  }

  return (
        <>
          <style>{styles}</style>

          <div className="inv-page">
            <div className="inv-header">
  <h1 className="inv-title">Invoices & Quotes</h1>

  <button
    className="inv-create-btn"
    onClick={() => navigate("/create")}
  >
    + Create
  </button>
</div>

        <div className="inv-stats">
          <div className="inv-stat">
            <p>Invoices</p>
            <h2>{allInvoices.length}</h2>
          </div>

          <div className="inv-stat">
            <p>Quotes</p>
            <h2>{quotes.length}</h2>
          </div>

          <div className="inv-stat revenue-stat">
            <p>Revenue</p>
            <h2>${fmt(totalRevenue)}</h2>
          </div>
        </div>

        <div className="inv-tools">
          <div className="inv-filters">
            {["All", "Invoice", "Quote"].map((option) => (
              <button
                key={option}
                className={`inv-filter-btn${filter === option ? " active" : ""}`}
                onClick={() => setFilter(option)}
              >
                {option === "All" ? "All" : `${option}s`}
              </button>
            ))}
          </div>

          <input
            className="inv-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client..."
          />
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
                      <th>#</th>
                      <th>Type</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((invoice) => {
                      const origIndex = invoices.indexOf(invoice);
                      const isQuote = invoice.type === "Quote";

                      return (
                        <tr key={invoice._id || origIndex}>
                          <td style={{ fontWeight: 500, color: "#111" }}>
                            {invoice.invoiceNumber}
                          </td>

                          <td>
                            <span
                              className={`type-badge ${
                                isQuote ? "type-quote" : "type-invoice"
                              }`}
                            >
                              {isQuote ? "Quote" : "Invoice"}
                            </span>
                          </td>

                          <td className="inv-client-cell">
                            {invoice.billToName || "—"}
                          </td>

                          <td style={{ color: "#888" }}>
                            {formatDate(invoice.date)}
                          </td>

                          <td style={{ fontWeight: 500 }}>
                            ${fmt(invoice.total)}
                          </td>

                          <td>
                            <button
                              className="btn-preview"
                              onClick={() => openPreview(invoice, origIndex)}
                            >
                              Preview
                            </button>
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

                  return (
                    <div
                      key={invoice._id || origIndex}
                      className="inv-mobile-card"
                    >
                      <div className="inv-mobile-top">
                        <div className="inv-mobile-left">
                          <div className="inv-mobile-num">
                            <span
                              className={`type-badge ${
                                isQuote ? "type-quote" : "type-invoice"
                              }`}
                            >
                              {isQuote ? "QUO" : "INV"}
                            </span>

                            {invoice.invoiceNumber}
                          </div>

                          <div className="inv-mobile-client">
                            {invoice.billToName || "No client"}
                          </div>
                        </div>

                        <div className="inv-mobile-right">
                          <div className="inv-mobile-total">
                            ${fmt(invoice.total)}
                          </div>

                          <div className="inv-mobile-date">
                            {formatDate(invoice.date)}
                          </div>
                        </div>
                      </div>

                      <div className="inv-mobile-actions">
                        <button onClick={() => openPreview(invoice, origIndex)}>
                          Preview
                        </button>
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
          <div
            className="preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-topbar">
              <div className="preview-topbar-left">
                <div className="preview-modal-num">
                  {preview.invoiceNumber}
                </div>

                <div className="preview-modal-meta">
                  {preview.billToName || "No client"} ·{" "}
                  {formatDate(preview.date)}
                </div>
              </div>

              <div className="preview-topbar-right">
                {preview.pdfBase64 && (
                  <>
                    <button
                      className="preview-action-btn preview-download-btn"
                      onClick={() => downloadPDF(preview)}
                    >
                      ↓ Download
                    </button>

                    <button
                      className="preview-action-btn"
                      onClick={() => printPDF(preview)}
                    >
                      Print
                    </button>
                  </>
                )}

                <button
                  className="preview-action-btn preview-delete-btn"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>

                <button className="preview-close" onClick={closePreview}>
                  ✕
                </button>
              </div>
            </div>

            <div className="preview-body">
              {pdfLoading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 300,
                    color: "#aaa",
                    fontSize: "0.875rem",
                    gap: 10,
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      border: "3px solid #ebebeb",
                      borderTopColor: "#111",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />

                  Loading preview...
                </div>
              )}

              {!pdfLoading &&
                pdfPages.length > 0 &&
                pdfPages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Page ${i + 1}`}
                    className="preview-page-img"
                  />
                ))}

              {!pdfLoading &&
                pdfPages.length === 0 &&
                !preview.pdfBase64 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 300,
                      color: "#bbb",
                      fontSize: "0.875rem",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 32 }}>📄</span>
                    <span>No PDF saved for this invoice.</span>
                    <span style={{ fontSize: "0.72rem", color: "#ddd" }}>
                      Re-create and export to generate a PDF.
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="confirm-overlay"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirm-title">Delete this document?</h3>

            <p className="confirm-text">
              Are you sure you want to delete {preview?.invoiceNumber}? This
              action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-delete"
                onClick={confirmDeleteInvoice}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}