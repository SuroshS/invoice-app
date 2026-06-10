import { useMemo, useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";

function buildInvoiceNumber(settings, type) {
  const isQuote = type === "Quote";
  const prefix = isQuote
    ? settings.quotePrefix || "QUO-"
    : settings.invoicePrefix || "INV-";
  const number = isQuote
    ? settings.nextQuoteNumber || 1
    : settings.nextInvoiceNumber || 1;

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

function AutoTextarea({ value, onChange, placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="ci-desc-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      style={{ overflow: "hidden" }}
    />
  );
}

function fmt(n) {
  return (n || 0).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const styles = `
.ci-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: system-ui, sans-serif;
}

.ci-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 12px;
  flex-wrap: wrap;
}

.ci-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.ci-invoice-num {
  font-size: 0.78rem;
  color: #bbb;
  font-weight: 400;
  margin-top: 3px;
}

.ci-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ci-save-btn,
.ci-preview-btn {
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  white-space: nowrap;
}

.ci-save-btn {
  border: 1px solid #111;
  background: #111;
  color: #fff;
}

.ci-save-btn:hover {
  background: #333;
  border-color: #333;
}

.ci-preview-btn {
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
}

.ci-preview-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.ci-layout {
  display: block;
}

.ci-form-col {
  min-width: 0;
}

.ci-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 12px;
}

.ci-card-title {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #bbb;
  margin: 0 0 14px;
}

.ci-type-group {
  display: flex;
  gap: 8px;
}

.ci-type-btn {
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

.ci-type-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.ci-type-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.ci-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.ci-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ci-field label {
  font-size: 0.7rem;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.ci-field input,
.ci-field textarea {
  width: 100%;
  padding: 9px 11px;
  border-radius: 7px;
  border: 1px solid #e5e5e5;
  background: #fafafa;
  font-size: 0.875rem;
  color: #111;
  font-family: system-ui;
  box-sizing: border-box;
  transition: border 0.15s, background 0.15s;
}

.ci-field input:focus,
.ci-field textarea:focus {
  outline: none;
  border-color: #111;
  background: #fff;
}

.ci-field textarea {
  resize: vertical;
  min-height: 70px;
  line-height: 1.5;
}

.ci-line-labels {
  display: grid;
  grid-template-columns: 1fr 72px 88px 80px 28px;
  gap: 8px;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #bbb;
  padding: 0 2px;
  margin-bottom: 8px;
}

.ci-line-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #ebebeb;
  border-radius: 9px;
  padding: 10px 12px;
  transition: border-color 0.15s;
}

.ci-line-row:focus-within {
  border-color: #ccc;
  background: #fff;
}

.ci-desc-textarea {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  padding: 2px 0;
  font-size: 0.875rem;
  font-family: system-ui;
  line-height: 1.5;
  outline: none;
  color: #111;
  min-height: 28px;
  box-sizing: border-box;
}

.ci-desc-textarea::placeholder {
  color: #ccc;
}

.ci-line-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ci-line-input {
  width: 72px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  background: #fff;
  font-size: 0.82rem;
  color: #111;
  font-family: system-ui;
  text-align: right;
  box-sizing: border-box;
  appearance: textfield;
  -moz-appearance: textfield;
}

.ci-line-input::-webkit-outer-spin-button,
.ci-line-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ci-line-input:focus {
  outline: none;
  border-color: #111;
}

.ci-line-total {
  width: 80px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111;
  text-align: right;
  white-space: nowrap;
  padding: 5px 0;
}

.ci-line-delete {
  background: none;
  border: none;
  color: #ddd;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 2px;
  transition: color 0.15s;
  flex-shrink: 0;
  line-height: 1;
}

.ci-line-delete:hover {
  color: #c0392b;
}

.ci-add-btn {
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px dashed #e0e0e0;
  background: #fff;
  color: #888;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  margin-top: 4px;
}

.ci-add-btn:hover {
  background: #fafafa;
  border-color: #bbb;
  color: #333;
}

.ci-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  padding: 6px 0;
  color: #555;
}

.ci-total-row.final {
  font-weight: 600;
  font-size: 1rem;
  color: #111;
  padding-top: 12px;
  margin-top: 6px;
  border-top: 1px solid #ebebeb;
}

.ci-gst-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #888;
}

.ci-gst-toggle {
  font-size: 11px;
  padding: 4px 9px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-family: system-ui;
}

.ci-gst-toggle.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.ci-mobile-label {
  display: none;
  font-size: 0.62rem;
  color: #bbb;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}

/* Preview Modal */
.ci-preview-overlay {
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

.ci-preview-modal {
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

.ci-preview-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 12px;
}

.ci-preview-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 2px;
}

.ci-preview-meta {
  font-size: 0.75rem;
  color: #aaa;
}

.ci-preview-close {
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

.ci-preview-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: block;
  background: #f7f7f7;
  padding: 16px;
}

.ci-preview-img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto 16px;
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.08);
}

.ci-preview-loading {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 0.875rem;
  gap: 10px;
  flex-direction: column;
}

.ci-preview-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #ebebeb;
  border-top-color: #111;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@media (max-width: 640px) {
  .ci-page {
    padding: 1rem;
  }

  .ci-title {
    font-size: 1rem;
  }

  .ci-header {
    align-items: flex-start;
  }

  .ci-header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .ci-save-btn,
  .ci-preview-btn {
    padding: 8px 12px;
    width: 100%;
  }

  .ci-card {
    padding: 16px;
  }

  .ci-grid-2 {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .ci-line-labels {
    display: none;
  }

  .ci-line-row {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .ci-desc-textarea {
    width: 100%;
    font-size: 0.95rem;
  }

  .ci-line-inputs {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
  }

  .ci-mobile-label {
    display: block;
  }

  .ci-line-input-wrap {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .ci-line-input {
    width: 100%;
    font-size: 0.95rem;
    padding: 8px 10px;
    text-align: left;
  }

  .ci-line-total {
    font-size: 0.95rem;
    width: auto;
    flex: 1;
    text-align: right;
    padding: 8px 0;
  }

  .ci-total-row {
    font-size: 0.95rem;
  }

  .ci-total-row.final {
    font-size: 1.05rem;
  }

  .ci-preview-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .ci-preview-modal {
    height: 92vh;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
  }

  .ci-preview-topbar {
    padding: 14px 16px;
  }

  .ci-preview-body {
    padding: 12px;
  }
}
`;

export default function CreateInvoice() {
  const { data, saveInvoice } = useApp();
  const { settings } = data;

  const [type, setType] = useState("Invoice");
  const [form, setForm] = useState(() => blankForm("Invoice"));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  const invoiceNumber = buildInvoiceNumber(settings, type);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (acc, item) => acc + (Number(item.qty) || 0) * (Number(item.rate) || 0),
      0
    );

    const gst = form.gstEnabled ? subtotal * form.gstRate : 0;

    return {
      subtotal,
      gst,
      total: subtotal + gst,
    };
  }, [form]);

  function handleTypeChange(newType) {
    setType(newType);
    setForm(blankForm(newType));
  }

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateItem(index, field, value) {
    const items = [...form.items];

    items[index] = {
      ...items[index],
      [field]: value,
    };

    setForm((prev) => ({
      ...prev,
      items,
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", qty: 1, rate: 0 }],
    }));
  }

  function removeItem(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function openPreview() {
    const invoice = {
      ...form,
      invoiceNumber,
    };

    setPreviewOpen(true);
    setPdfPages([]);
    setPdfLoading(true);

    try {
      const blob = await pdf(
        <InvoicePDF invoice={invoice} settings={settings} totals={totals} />
      ).toBlob();

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

      const arrayBuffer = await blob.arrayBuffer();

      const pdfDoc = await window.pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;

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
      console.error("Preview error:", e);
      setPdfPages([]);
    }

    setPdfLoading(false);
  }

  async function exportPDF() {
    const invoice = {
      ...form,
      invoiceNumber,
    };

    try {
      const blob = await pdf(
        <InvoicePDF invoice={invoice} settings={settings} totals={totals} />
      ).toBlob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      saveInvoice(invoice, totals, base64);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export error:", e);
      saveInvoice(invoice, totals, null);
    }

    setForm(blankForm(type));
  }

  return (
    <>
      <style>{styles}</style>

      <div className="ci-page">
        <div className="ci-header">
          <div>
            <h1 className="ci-title">New {type}</h1>
            <div className="ci-invoice-num">{invoiceNumber}</div>
          </div>

          <div className="ci-header-actions">
            <button className="ci-preview-btn" onClick={openPreview}>
              Preview
            </button>

            <button className="ci-save-btn" onClick={exportPDF}>
              Save & Export
            </button>
          </div>
        </div>

        <div className="ci-layout">
          <div className="ci-form-col">
            <div className="ci-card">
              <p className="ci-card-title">Document Type</p>

              <div className="ci-type-group">
                {["Invoice", "Quote"].map((t) => (
                  <button
                    key={t}
                    className={`ci-type-btn${type === t ? " active" : ""}`}
                    onClick={() => handleTypeChange(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="ci-card">
              <p className="ci-card-title">Client Details</p>

              <div className="ci-grid-2">
                <div className="ci-field">
                  <label>Name</label>
                  <input
                    value={form.billToName}
                    onChange={(e) => update("billToName", e.target.value)}
                    placeholder="Client name"
                  />
                </div>

                <div className="ci-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.billToEmail}
                    onChange={(e) => update("billToEmail", e.target.value)}
                    placeholder="client@email.com"
                  />
                </div>
              </div>

              <div className="ci-field">
                <label>Address</label>
                <textarea
                  value={form.billToAddress}
                  onChange={(e) => update("billToAddress", e.target.value)}
                  placeholder="Street, Suburb, State"
                />
              </div>
            </div>

            <div className="ci-card">
              <p className="ci-card-title">Line Items</p>

              <div className="ci-line-labels">
                <span>Description</span>
                <span style={{ textAlign: "right" }}>Qty</span>
                <span style={{ textAlign: "right" }}>Rate ($)</span>
                <span style={{ textAlign: "right" }}>Total</span>
                <span />
              </div>

              {form.items.map((item, i) => (
                <div key={i} className="ci-line-row">
                  <AutoTextarea
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, "description", e.target.value)
                    }
                    placeholder="Description of work..."
                  />

                  <div className="ci-line-inputs">
                    <div className="ci-line-input-wrap">
                      <span className="ci-mobile-label">Qty</span>

                      <input
                        type="number"
                        inputMode="numeric"
                        className="ci-line-input"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(i, "qty", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="ci-line-input-wrap">
                      <span className="ci-mobile-label">Rate</span>

                      <input
                        type="number"
                        inputMode="decimal"
                        className="ci-line-input"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(i, "rate", Number(e.target.value))
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="ci-line-input-wrap">
                      <span className="ci-mobile-label">Total</span>

                      <div className="ci-line-total">
                        ${fmt(item.qty * item.rate)}
                      </div>
                    </div>

                    {form.items.length > 1 && (
                      <button
                        className="ci-line-delete"
                        onClick={() => removeItem(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button className="ci-add-btn" onClick={addItem}>
                + Add item
              </button>
            </div>

            <div className="ci-card">
              <p className="ci-card-title">Totals</p>

              <div className="ci-total-row">
                <span>Subtotal</span>
                <span>${fmt(totals.subtotal)}</span>
              </div>

              <div className="ci-total-row">
                <span className="ci-gst-label">
                  GST (10%)
                  <button
                    className={`ci-gst-toggle${
                      form.gstEnabled ? " active" : ""
                    }`}
                    onClick={() => update("gstEnabled", !form.gstEnabled)}
                  >
                    {form.gstEnabled ? "On" : "Off"}
                  </button>
                </span>

                <span>${fmt(totals.gst)}</span>
              </div>

              <div className="ci-total-row final">
                <span>Total</span>
                <span>${fmt(totals.total)}</span>
              </div>
            </div>

            <div className="ci-card">
              <p className="ci-card-title">Notes</p>

              <div className="ci-field">
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Payment terms, additional info..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div
          className="ci-preview-overlay"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="ci-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ci-preview-topbar">
              <div>
                <div className="ci-preview-title">{invoiceNumber}</div>
                <div className="ci-preview-meta">
                  {form.billToName || "No client"} · {form.date}
                </div>
              </div>

              <button
                className="ci-preview-close"
                onClick={() => setPreviewOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="ci-preview-body">
              {pdfLoading && (
                <div className="ci-preview-loading">
                  <div className="ci-preview-spinner" />
                  Loading preview...
                </div>
              )}

              {!pdfLoading &&
                pdfPages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Page ${i + 1}`}
                    className="ci-preview-img"
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}