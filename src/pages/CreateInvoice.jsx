import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import "./CreateInvoice.css";

function buildInvoiceNumber(settings, type) {
  const isQuote = type === "Quote";
  const prefix = isQuote ? (settings.quotePrefix || "QUO-") : (settings.invoicePrefix || "INV-");
  const number = isQuote ? (settings.nextQuoteNumber || 1) : (settings.nextInvoiceNumber || 1);
  return `${prefix}${number}`;
}

function blankForm(type) {
  return {
    type,
    date: new Date().toISOString().slice(0, 10),
    billToName: "",
    billToAddress: "",
    billToEmail: "",
    gstEnabled: true,
    gstRate: 0.1,
    notes: "",
    items: [{ description: "", qty: 1, rate: 0 }],
  };
}

export default function CreateInvoice() {
  const { data, saveInvoice } = useApp();
  const { settings } = data;

  const [type, setType] = useState("Invoice");
  const [form, setForm] = useState(() => blankForm("Invoice"));

  const invoiceNumber = buildInvoiceNumber(settings, type);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((acc, item) => acc + item.qty * item.rate, 0);
    const gst = form.gstEnabled ? subtotal * form.gstRate : 0;
    return { subtotal, gst, total: subtotal + gst };
  }, [form]);

  function handleTypeChange(newType) {
    setType(newType);
    setForm(blankForm(newType));
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updateItem(index, field, value) {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm(prev => ({ ...prev, items }));
  }

  function addItem() {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: "", qty: 1, rate: 0 }],
    }));
  }

  function removeItem(index) {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function exportPDF() {
    const invoice = { ...form, invoiceNumber };

    try {
      // Generate PDF blob
      const blob = await pdf(
        <InvoicePDF invoice={invoice} settings={settings} totals={totals} />
      ).toBlob();

      // Convert blob to base64 so we can store and re-download later
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Save invoice with base64 PDF attached
      saveInvoice(invoice, totals, base64);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error("PDF export error:", e);
      // Save without PDF if generation fails
      saveInvoice(invoice, totals, null);
    }

    // Reset form
    setForm(blankForm(type));
  }

  return (
    <div className="invoice-page">

      <div className="invoice-header">
        <div>
          <h1>New {type}</h1>
          <span className="invoice-number">{invoiceNumber}</span>
        </div>
        <button className="primary-btn" onClick={exportPDF}>
          Save & Export
        </button>
      </div>

      <div className="invoice-section">
        <p className="section-title">Document Type</p>
        <div className="status-group">
          {["Invoice", "Quote"].map(t => (
            <button
              key={t}
              className={`status ${type === t ? "active" : ""}`}
              onClick={() => handleTypeChange(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="invoice-section">
        <p className="section-title">Client Details</p>
        <div className="grid-2">
          <div className="field">
            <label>Name</label>
            <input
              value={form.billToName}
              onChange={e => update("billToName", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              value={form.billToEmail}
              onChange={e => update("billToEmail", e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Address</label>
          <textarea
            value={form.billToAddress}
            onChange={e => update("billToAddress", e.target.value)}
          />
        </div>
      </div>

      <div className="invoice-section">
        <p className="section-title">Line Items</p>
        <div className="line-row labels">
          <label>Description</label>
          <label>Qty</label>
          <label>Amount</label>
          <label>Total</label>
          <span></span>
        </div>
        {form.items.map((item, i) => (
          <div key={i} className="line-row">
            <input
              value={item.description}
              onChange={e => updateItem(i, "description", e.target.value)}
            />
            <input
              type="number"
              inputMode="numeric"
              className="no-spinner"
              value={item.qty}
              onChange={e => updateItem(i, "qty", Number(e.target.value))}
            />
            <input
              type="number"
              inputMode="numeric"
              className="no-spinner"
              value={item.rate}
              onChange={e => updateItem(i, "rate", Number(e.target.value))}
            />
            <div className="line-total">${(item.qty * item.rate).toFixed(2)}</div>
            {form.items.length > 1 && (
              <button className="delete-btn" onClick={() => removeItem(i)}>✕</button>
            )}
          </div>
        ))}
        <button className="add-btn" onClick={addItem}>+ Add Item</button>
      </div>

      <div className="invoice-section totals-section">
        <div className="total-row">
          <span>Subtotal</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="total-row gst-row">
          <span className="gst-label">
            GST (10%)
            <button
              className={`gst-toggle ${form.gstEnabled ? "active" : ""}`}
              onClick={() => update("gstEnabled", !form.gstEnabled)}
            >
              {form.gstEnabled ? "On" : "Off"}
            </button>
          </span>
          <span>${totals.gst.toFixed(2)}</span>
        </div>
        <div className="total-row final">
          <span>Total</span>
          <span>${totals.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="invoice-section">
        <p className="section-title">Notes</p>
        <textarea
          value={form.notes}
          onChange={e => update("notes", e.target.value)}
          placeholder="Payment terms, additional info..."
        />
      </div>

    </div>
  );
}