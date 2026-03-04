import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import "./CreateInvoice.css";

export default function CreateInvoice() {
  const { data } = useApp();
  const { settings } = data;

  const [invoice, setInvoice] = useState({
  invoiceNumber: `${settings.invoicePrefix}${settings.nextInvoiceNumber}`,
  date: new Date().toISOString().slice(0, 10),
  billToName: "",
  billToAddress: "",
  billToEmail: "",
  gstRate: 0.1,
  status: "Unpaid",
  notes: "",   // ✅ ADD THIS LINE
  items: [{ description: "", qty: 1, rate: 0 }]
});

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce(
      (acc, item) => acc + item.qty * item.rate,
      0
    );
    const gst = subtotal * invoice.gstRate;
    return { subtotal, gst, total: subtotal + gst };
  }, [invoice]);

  function update(field, value) {
    setInvoice(prev => ({ ...prev, [field]: value }));
  }

  function updateItem(index, field, value) {
    const items = [...invoice.items];
    items[index][field] = value;
    setInvoice(prev => ({ ...prev, items }));
  }

  function addItem() {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: "", qty: 1, amount: 0 }]
    }));
  }

  function removeItem(index) {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }

  function changeStatus(newStatus) {
    update("status", newStatus);
  }

  async function exportPDF() {
    const blob = await pdf(
      <InvoicePDF invoice={invoice} settings={settings} totals={totals} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.pdf`;
    a.click();
  }

  return (
    <div className="invoice-page">

      {/* Header */}
      <div className="invoice-header">
        <div>
          <h1>New Invoice</h1>
          <span className="invoice-number">{invoice.invoiceNumber}</span>
        </div>

        <button className="primary-btn" onClick={exportPDF}>
          Save & Export
        </button>
      </div>

      {/* Status */}
      <div className="invoice-section">
        <p className="section-title">Status</p>
        <div className="status-group">
          {["Unpaid", "Paid"].map(status => (
            <button
              key={status}
              className={`status ${
                invoice.status === status ? "active" : ""
              }`}
              onClick={() => changeStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Client Details */}
      <div className="invoice-section">
        <p className="section-title">Client Details</p>

        <div className="grid-2">
          <div className="field">
            <label>Name</label>
            <input
              value={invoice.billToName}
              onChange={e => update("billToName", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              value={invoice.billToEmail}
              onChange={e => update("billToEmail", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Address</label>
          <textarea
            value={invoice.billToAddress}
            onChange={e => update("billToAddress", e.target.value)}
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="invoice-section">
        <p className="section-title">Line Items</p>

        <div className="line-row labels">
          <label>Description</label>
          <label>Qty</label>
          <label>Amount</label>
          <label>Total</label>
          <span></span>
        </div>

        {invoice.items.map((item, i) => (
          <div key={i} className="line-row">
            <input
              value={item.description}
              onChange={e =>
                updateItem(i, "description", e.target.value)
              }
            />

            <input
              type="number"
              inputMode="numeric"
              className="no-spinner"
              value={item.qty}
              onChange={e =>
                updateItem(i, "qty", Number(e.target.value))
              }
            />

            <input
              type="number"
              inputMode="numeric"
              className="no-spinner"
              value={item.rate}
onChange={e => updateItem(i, "rate", Number(e.target.value))}
            />

            <div className="line-total">
              ${(item.qty * item.rate).toFixed(2)}
            </div>

            {invoice.items.length > 1 && (
              <button
                className="delete-btn"
                onClick={() => removeItem(i)}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button className="add-btn" onClick={addItem}>
          + Add Item
        </button>
      </div>

      {/* Totals */}
      <div className="invoice-section totals-section">
        <div className="total-row">
          <span>Subtotal</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>

        <div className="total-row">
          <span>GST (10%)</span>
          <span>${totals.gst.toFixed(2)}</span>
        </div>

        <div className="total-row final">
          <span>Total</span>
          <span>${totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
<div className="invoice-section">
  <p className="section-title">Notes</p>
  <textarea
    value={invoice.notes}
    onChange={e => update("notes", e.target.value)}
    placeholder="Payment terms, additional info..."
  />
</div>

    </div>
  );
}