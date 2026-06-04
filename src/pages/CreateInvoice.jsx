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

.ci-save-btn {
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 6px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
}

.ci-save-btn:hover {
  background: #333;
  border-color: #333;
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

  .ci-save-btn {
    padding: 8px 12px;
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
}
`;

export default function CreateInvoice() {
  const { data, saveInvoice } = useApp();
  const { settings } = data;

  const [type, setType] = useState("Invoice");
  const [form, setForm] = useState(() => blankForm("Invoice"));

  const invoiceNumber = buildInvoiceNumber(settings, type);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (acc, item) => acc + item.qty * item.rate,
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

          <button className="ci-save-btn" onClick={exportPDF}>
            Save & Export
          </button>
        </div>

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
                    ${(item.qty * item.rate).toFixed(2)}
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
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>

          <div className="ci-total-row">
            <span className="ci-gst-label">
              GST (10%)
              <button
                className={`ci-gst-toggle${form.gstEnabled ? " active" : ""}`}
                onClick={() => update("gstEnabled", !form.gstEnabled)}
              >
                {form.gstEnabled ? "On" : "Off"}
              </button>
            </span>

            <span>${totals.gst.toFixed(2)}</span>
          </div>

          <div className="ci-total-row final">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
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
    </>
  );
}