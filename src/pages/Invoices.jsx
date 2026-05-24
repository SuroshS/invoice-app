import { useApp } from "../context/AppContext";
import "./Invoices.css";

export default function Invoices() {
  const { data, deleteInvoice } = useApp();

  const allInvoices = data.invoices.filter(i => i.type === "Invoice" || !i.type);
  const quotes = data.invoices.filter(i => i.type === "Quote");
  const totalRevenue = allInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

  const sorted = [...data.invoices].sort(
    (a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date)
  );

  function fmt(n) {
    return (n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function openPDF(invoice) {
    if (!invoice.pdfBase64) return;
    const byteChars = atob(invoice.pdfBase64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="invoices-wrapper">
      <h1 className="page-title">Invoices & Quotes</h1>

      <div className="invoice-stats">
        <div className="stat-card">
          <p>Total Invoices</p>
          <h2>{allInvoices.length}</h2>
        </div>
        <div className="stat-card">
          <p>Total Quotes</p>
          <h2>{quotes.length}</h2>
        </div>
        <div className="stat-card">
          <p>Total Revenue</p>
          <h2>${fmt(totalRevenue)}</h2>
        </div>
      </div>

      <div className="table-card">
        {data.invoices.length === 0 ? (
          <p>No invoices or quotes yet.</p>
        ) : (
          <table>
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
              {sorted.map((invoice) => {
                const origIndex = data.invoices.indexOf(invoice);
                const isQuote = invoice.type === "Quote";
                return (
                  <tr key={invoice._id || origIndex}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>
                      <span className={`type-badge ${isQuote ? "type-quote" : "type-invoice"}`}>
                        {isQuote ? "Quote" : "Invoice"}
                      </span>
                    </td>
                    <td>{invoice.billToName || "—"}</td>
                    <td>{invoice.date}</td>
                    <td>${fmt(invoice.total)}</td>
                    <td>
                      {invoice.pdfBase64 && (
                        <button
                          className="small-btn"
                          onClick={() => openPDF(invoice)}
                        >
                          Download
                        </button>
                      )}
                      <button
                        className="delete-btn"
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
        )}
      </div>
    </div>
  );
}