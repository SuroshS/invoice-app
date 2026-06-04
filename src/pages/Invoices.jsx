import { useState } from "react";
import { useApp } from "../context/AppContext";

const styles = `
.inv-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: system-ui, sans-serif;
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

.inv-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.inv-stat {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 10px;
  padding: 14px 18px;
}

.revenue-stat {
  grid-column: auto;
}

.inv-stat p {
  font-size: 0.7rem;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
  margin-bottom: 6px;
}

.inv-stat h2 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #111;
  line-height: 1;
  margin: 0;
}

/* Filter/Search */
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
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
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
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 12px;
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
}

.inv-empty {
  padding: 40px 24px;
  text-align: center;
  font-size: 0.875rem;
  color: #bbb;
}

.inv-table {
  width: 100%;
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

.btn-preview,
.btn-download {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  margin-right: 6px;
}

.btn-preview:hover,
.btn-download:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.btn-delete {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #fde0e0;
  background: #c0392b;
  color: #fff;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
}

.btn-delete:hover {
  background: #a93226;
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
  padding: 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: system-ui;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  transition: all 0.15s;
}

.inv-mobile-actions .m-delete {
  border-color: #fde0e0;
  background: #fff5f5;
  color: #c0392b;
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

@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
}

.preview-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-dl-btn {
  padding: 7px 14px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  font-family: system-ui;
  white-space: nowrap;
}

.preview-close {
  width: 30px;
  height: 30px;
  border-radius: 7px;
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

/* Responsive */
@media (max-width: 640px) {
  .inv-page {
    padding: 1rem;
  }

  .inv-title {
    font-size: 1rem;
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
    padding: 9px 10px;
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
  }

  .preview-body {
    padding: 12px;
  }
}

@media (max-width: 400px) {
  .inv-stats {
    grid-template-columns: 1fr 1fr;
  }
}
`;

export default function Invoices() {
  const { data, deleteInvoice } = useApp();
  const [preview, setPreview] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  async function openPreview(invoice) {
    setPreview(invoice);
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
    setPdfPages([]);
    setPdfLoading(false);
  }

  const allInvoices = data.invoices.filter(
    (i) => i.type === "Invoice" || !i.type
  );

  const quotes = data.invoices.filter((i) => i.type === "Quote");

  const totalRevenue = allInvoices.reduce(
    (acc, inv) => acc + (inv.total || 0),
    0
  );

  const sorted = [...data.invoices].sort(
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

  function downloadPDF(invoice) {
    if (!invoice.pdfBase64) return;

    const byteChars = atob(invoice.pdfBase64);
    const byteArray = new Uint8Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }

    const blob = new Blob([byteArray], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${invoice.invoiceNumber}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <style>{styles}</style>

      <div className="inv-page">
        <div className="inv-header">
          <h1 className="inv-title">Invoices & Quotes</h1>
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
          {data.invoices.length === 0 ? (
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
                      const origIndex = data.invoices.indexOf(invoice);
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

                          <td>{invoice.billToName || "—"}</td>

                          <td style={{ color: "#888" }}>
                            {formatDate(invoice.date)}
                          </td>

                          <td style={{ fontWeight: 500 }}>
                            ${fmt(invoice.total)}
                          </td>

                          <td>
                            <button
                              className="btn-preview"
                              onClick={() => openPreview(invoice)}
                            >
                              Preview
                            </button>

                            {invoice.pdfBase64 && (
                              <button
                                className="btn-download"
                                onClick={() => downloadPDF(invoice)}
                              >
                                ↓ Download
                              </button>
                            )}

                            <button
                              className="btn-delete"
                              onClick={() => deleteInvoice(origIndex)}
                            >
                              Delete
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
                  const origIndex = data.invoices.indexOf(invoice);
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
                        <button onClick={() => openPreview(invoice)}>
                          Preview
                        </button>

                        {invoice.pdfBase64 && (
                          <button onClick={() => downloadPDF(invoice)}>
                            ↓ Download
                          </button>
                        )}

                        <button
                          className="m-delete"
                          onClick={() => deleteInvoice(origIndex)}
                        >
                          Delete
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
                  <button
                    className="preview-dl-btn"
                    onClick={() => downloadPDF(preview)}
                  >
                    ↓ Download PDF
                  </button>
                )}

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
    </>
  );
}