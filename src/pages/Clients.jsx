import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { renderPdfPagesToImages } from "../lib/pdfjs";
import { computeClientInvoiceStats, getInvoicesForClient } from "../lib/clientStats";
import { getInvoicePdfBlob, getInvoicePdfPages } from "../lib/pdfCache";
import { generateInvoicePdfBlob } from "../lib/pdfEngine";

const styles = `
.cli-page { box-sizing: border-box; width: 100%; max-width: none; margin: 0; padding: 2rem; font-family: system-ui, sans-serif; }
.cli-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 12px; flex-wrap: wrap; }
.cli-title { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0; }
.cli-subtitle { font-size: 0.8rem; color: #aaa; margin: 2px 0 0; }
.cli-search { width: 100%; max-width: 280px; height: 34px; padding: 0 11px; border-radius: 8px; border: 1px solid #e0e0e0; background: #fff; font-size: 0.82rem; color: #333; font-family: system-ui; }
.cli-global-error { background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0; border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 14px; }

.cli-card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; width: 100%; }
.cli-table-wrap { width: 100%; border-radius: 12px; }
.cli-empty { padding: 40px 24px; text-align: center; font-size: 0.875rem; color: #bbb; line-height: 1.6; }
.cli-table { width: 100%; min-width: 640px; border-collapse: collapse; }
.cli-table thead th { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #bbb; padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; background: #fafafa; white-space: nowrap; }
.cli-table tbody tr { border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.12s; }
.cli-table tbody tr:last-child { border-bottom: none; }
.cli-table tbody tr:hover { background: #fafafa; }
.cli-table td { padding: 12px 16px; font-size: 0.85rem; color: #333; vertical-align: middle; }
.cli-name-cell { font-weight: 500; color: #111; }
.cli-muted { color: #aaa; }
.cli-count-badge { font-size: 0.72rem; font-weight: 600; background: #f0f0f0; color: #555; padding: 3px 9px; border-radius: 99px; white-space: nowrap; }

.cli-mobile-list { display: none; }
.cli-mobile-card { padding: 14px 16px; border-bottom: 1px solid #f5f5f5; cursor: pointer; }
.cli-mobile-card:last-child { border-bottom: none; }
.cli-mobile-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.cli-mobile-name { font-size: 0.88rem; font-weight: 500; color: #111; margin-bottom: 3px; }
.cli-mobile-sub { font-size: 0.76rem; color: #aaa; }

.cli-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
.cli-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; height: 82vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.cli-modal-topbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; gap: 12px; }
.cli-modal-title-wrap { min-width: 0; }
.cli-modal-name { font-size: 0.95rem; font-weight: 700; color: #111; margin-bottom: 2px; }
.cli-modal-meta { font-size: 0.76rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cli-modal-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cli-modal-back { height: 32px; padding: 0 12px; border-radius: 8px; border: 1px solid #e0e0e0; background: #fff; color: #333; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: system-ui; }
.cli-modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e5e5e5; background: #f5f5f5; color: #888; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cli-modal-download { height: 32px; padding: 0 14px; border-radius: 8px; border: 1px solid #111; background: #111; color: #fff; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: system-ui; white-space: nowrap; }
.cli-modal-body { flex: 1; overflow-y: auto; overflow-x: hidden; }

.cli-inv-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 20px; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.12s; }
.cli-inv-row:last-child { border-bottom: none; }
.cli-inv-row:hover { background: #fafafa; }
.cli-inv-left { min-width: 0; }
.cli-inv-num { font-size: 0.85rem; font-weight: 500; color: #111; display: flex; align-items: center; gap: 7px; }
.cli-inv-date { font-size: 0.74rem; color: #aaa; margin-top: 2px; }
.cli-inv-right { text-align: right; flex-shrink: 0; font-size: 0.9rem; font-weight: 600; color: #111; }
.cli-type-badge { font-size: 0.62rem; font-weight: 600; padding: 2px 7px; border-radius: 5px; white-space: nowrap; }
.cli-type-badge.invoice { background: #f0f0f0; color: #555; }
.cli-type-badge.quote { background: #f0eefe; color: #5b41c0; }

.cli-preview-body { background: #f7f7f7; padding: 16px; }
.cli-preview-page-img { width: 100%; height: auto; display: block; margin: 0 auto 16px; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
.cli-loading-wrap { display: flex; align-items: center; justify-content: center; height: 300px; color: #aaa; font-size: 0.875rem; gap: 10px; flex-direction: column; }
.cli-spinner { width: 26px; height: 26px; border: 3px solid #ebebeb; border-top-color: #111; border-radius: 50%; animation: cliSpin 0.7s linear infinite; }
@keyframes cliSpin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .cli-page { padding: 1rem; }
  .cli-header { align-items: stretch; flex-direction: column; }
  .cli-search { max-width: 100%; width: 100%; }
  .cli-table-wrap { display: none; }
  .cli-mobile-list { display: block; }
  .cli-overlay { align-items: flex-end; padding: 0; }
  .cli-modal { height: 90vh; max-height: 90vh; border-radius: 16px 16px 0 0; }
}
`;

export default function Clients() {
  const { data, secondaryDataLoading } = useApp();
  const clients = useMemo(() => data.clients || [], [data.clients]);
  const invoices = useMemo(() => data.invoices || [], [data.invoices]);

  // Per-client invoiceCount/totalBilled — derived synchronously from
  // AppContext's already-loaded invoices, no network request of its own.
  // See lib/clientStats.js for why this replaced a separate RPC call.
  const clientStatsById = useMemo(() => computeClientInvoiceStats(invoices), [invoices]);

  const [searchTerm, setSearchTerm] = useState("");

  const [openClient, setOpenClient] = useState(null);
  const [openClientInvoices, setOpenClientInvoices] = useState(null);

  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [previewPages, setPreviewPages] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  function fmt(n) {
    return (n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  const clientRows = useMemo(() => {
    return clients
      .map((client) => {
        const stats = clientStatsById.get(client.id);
        return {
          client,
          invoiceCount: stats?.invoiceCount || 0,
          totalBilled: stats?.totalBilled || 0,
        };
      })
      .sort((a, b) => a.client.name.localeCompare(b.client.name));
  }, [clients, clientStatsById]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return clientRows;
    return clientRows.filter(({ client }) =>
      client.name.toLowerCase().includes(q) ||
      (client.email || "").toLowerCase().includes(q) ||
      (client.phone || "").toLowerCase().includes(q)
    );
  }, [clientRows, searchTerm]);

  // The client's invoice/quote records are just a filter over the invoices
  // already loaded into AppContext — instant, no fetch, no loading state
  // needed for this step at all.
  function openClientModal(entry) {
    setOpenClient(entry);
    setOpenClientInvoices(getInvoicesForClient(invoices, entry.client.id));
    setViewingInvoice(null);
    setPreviewPages([]);
    setPreviewError("");
  }

  function closeClientModal() {
    setOpenClient(null);
    setOpenClientInvoices(null);
    setViewingInvoice(null);
    setPreviewPages([]);
    setPreviewError("");
  }

  function invoiceTotals(invoice) {
    return { subtotal: invoice.subtotal || 0, gst: invoice.gst || 0, total: invoice.total || 0 };
  }

  // Reuses an already-generated blob/pages for this exact invoice+settings
  // combination when one exists (see lib/pdfCache.js) — Preview then
  // Download on the same record no longer re-runs react-pdf's layout engine
  // twice, and reopening the same invoice's preview skips rasterization too.
  // generateInvoicePdfBlob dynamically imports react-pdf/InvoicePDF on first
  // use (see lib/pdfEngine.jsx) rather than this page bundling that engine
  // just by being navigated to.
  async function generatePdfBlob(invoice) {
    return getInvoicePdfBlob(invoice, data.settings, () => generateInvoicePdfBlob(invoice, data.settings, invoiceTotals(invoice)));
  }

  async function openInvoicePreview(invoice) {
    setViewingInvoice(invoice);
    setPreviewPages([]);
    setPreviewError("");
    setPreviewLoading(true);
    try {
      const pages = await getInvoicePdfPages(
        invoice,
        data.settings,
        () => generateInvoicePdfBlob(invoice, data.settings, invoiceTotals(invoice)),
        (blob) => renderPdfPagesToImages(blob, 3)
      );
      setPreviewPages(pages);
    } catch (e) {
      console.error("Client invoice preview error:", e);
      setPreviewError("Could not generate preview.");
    }
    setPreviewLoading(false);
  }

  async function downloadInvoice(invoice) {
    try {
      const blob = await generatePdfBlob(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Client invoice download error:", e);
      setPreviewError("Could not download this document.");
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="cli-page">
        <div className="cli-header">
          <div>
            <h1 className="cli-title">Clients</h1>
            <p className="cli-subtitle">{clients.length} client{clients.length !== 1 ? "s" : ""} on file</p>
          </div>
          <input className="cli-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email or phone..." />
        </div>

        <div className="cli-card">
          {secondaryDataLoading ? (
            // Clients/invoices are still loading in the background (see
            // AppContext) — without this check, an empty data.clients this
            // early would incorrectly show "No clients yet" for an account
            // that actually has clients.
            <div className="cli-loading-wrap">
              <div className="cli-spinner" />
              Loading clients...
            </div>
          ) : clients.length === 0 ? (
            <div className="cli-empty">
              No clients yet.<br />
              Clients are added automatically when you create an invoice or quote and choose "New client".
            </div>
          ) : filtered.length === 0 ? (
            <div className="cli-empty">No matching clients.</div>
          ) : (
            <>
              <div className="cli-table-wrap">
                <table className="cli-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Phone</th><th>Invoices</th><th>Total billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.client.id} onClick={() => openClientModal(entry)}>
                        <td className="cli-name-cell">{entry.client.name}</td>
                        <td className={entry.client.email ? "" : "cli-muted"}>{entry.client.email || "—"}</td>
                        <td className={entry.client.phone ? "" : "cli-muted"}>{entry.client.phone || "—"}</td>
                        <td><span className="cli-count-badge">{entry.invoiceCount}</span></td>
                        <td style={{ fontWeight: 500 }}>${fmt(entry.totalBilled)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cli-mobile-list">
                {filtered.map((entry) => (
                  <div key={entry.client.id} className="cli-mobile-card" onClick={() => openClientModal(entry)}>
                    <div className="cli-mobile-top">
                      <div>
                        <div className="cli-mobile-name">{entry.client.name}</div>
                        <div className="cli-mobile-sub">{[entry.client.email, entry.client.phone].filter(Boolean).join(" · ") || "No contact details"}</div>
                      </div>
                      <span className="cli-count-badge">{entry.invoiceCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {openClient && (
        <div className="cli-overlay" onClick={closeClientModal}>
          <div className="cli-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cli-modal-topbar">
              {viewingInvoice ? (
                <>
                  <button className="cli-modal-back" onClick={() => setViewingInvoice(null)}>← Back</button>
                  <div className="cli-modal-title-wrap">
                    <div className="cli-modal-name">{viewingInvoice.invoiceNumber}</div>
                    <div className="cli-modal-meta">{formatDate(viewingInvoice.date)}</div>
                  </div>
                  <div className="cli-modal-actions">
                    <button className="cli-modal-download" onClick={() => downloadInvoice(viewingInvoice)}>↓ Download</button>
                    <button className="cli-modal-close" onClick={closeClientModal} aria-label="Close">✕</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="cli-modal-title-wrap">
                    <div className="cli-modal-name">{openClient.client.name}</div>
                    <div className="cli-modal-meta">{openClient.invoiceCount} document{openClient.invoiceCount !== 1 ? "s" : ""} · ${fmt(openClient.totalBilled)} total billed</div>
                  </div>
                  <button className="cli-modal-close" onClick={closeClientModal} aria-label="Close">✕</button>
                </>
              )}
            </div>

            <div className={`cli-modal-body${viewingInvoice ? " cli-preview-body" : ""}`}>
              {viewingInvoice ? (
                <>
                  {previewLoading && (
                    <div className="cli-loading-wrap">
                      <div className="cli-spinner" />
                      Loading preview...
                    </div>
                  )}
                  {!previewLoading && previewError && <div className="cli-loading-wrap">⚠ {previewError}</div>}
                  {!previewLoading && !previewError && previewPages.map((src, i) => (
                    <img key={i} src={src} alt={`Page ${i + 1}`} className="cli-preview-page-img" />
                  ))}
                </>
              ) : (openClientInvoices || []).length === 0 ? (
                <div className="cli-empty">No invoices or quotes for this client yet.</div>
              ) : (
                openClientInvoices.map((inv) => {
                  const isQuote = inv.type === "Quote";
                  return (
                    <div key={inv._id} className="cli-inv-row" onClick={() => openInvoicePreview(inv)}>
                      <div className="cli-inv-left">
                        <div className="cli-inv-num">
                          <span className={`cli-type-badge ${isQuote ? "quote" : "invoice"}`}>{isQuote ? "Quote" : "Invoice"}</span>
                          {inv.invoiceNumber}
                        </div>
                        <div className="cli-inv-date">{formatDate(inv.date)}</div>
                      </div>
                      <div className="cli-inv-right">${fmt(inv.total)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
