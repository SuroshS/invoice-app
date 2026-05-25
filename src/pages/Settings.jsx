import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./Settings.css";

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function Settings() {
  const { data, setData, uploadLogo } = useApp();
  const [bankOpen, setBankOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const settings = data?.settings || {};

  function update(field, value) {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    const url = await uploadLogo(file);
    if (url) update("logoUrl", url);
    setLogoUploading(false);
  }

  function numericOnly(value, maxLen) {
    const clean = value.replace(/\D/g, "");
    return maxLen ? clean.slice(0, maxLen) : clean;
  }

  function handleSave() {
    setData(prev => ({ ...prev, settings: prev.settings }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-wrapper">
      <div className="settings-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Business & invoice configuration</p>
      </div>

      <div className="settings-grid-layout">

        {/* Business */}
        <div className="settings-card card-business">
          <p className="card-title">Business Information</p>
          <div className="fields-row fields-row-3">
            <Field label="Business Name">
              <input
                value={settings.businessName || ""}
                onChange={e => update("businessName", e.target.value)}
                placeholder="Your business name"
              />
            </Field>
            <Field label="ABN">
              <input
                value={settings.abn || ""}
                onChange={e => update("abn", e.target.value)}
                placeholder="12 345 678 901"
              />
            </Field>
            <Field label="QBCC Licence">
              <input
                value={settings.qbcc || ""}
                onChange={e => update("qbcc", e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
          <Field label="Business Address">
            <textarea
              value={settings.address || ""}
              onChange={e => update("address", e.target.value)}
              placeholder="Street, Suburb, State, Postcode"
            />
          </Field>
        </div>

        {/* Bank */}
        <div className={`settings-card card-bank ${bankOpen ? "open" : ""}`}>
          <div className="accordion-trigger" onClick={() => setBankOpen(prev => !prev)}>
            <p className="card-title">Bank Details</p>
            <span className="accordion-chevron">{bankOpen ? "▴" : "▾"}</span>
          </div>
          {bankOpen && (
            <div className="accordion-body">
              <div className="fields-row fields-row-2">
                <Field label="BSB">
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={settings.bsb || ""}
                    onChange={e => update("bsb", numericOnly(e.target.value, 6))}
                    placeholder="000000"
                  />
                </Field>
                <Field label="Account Number">
                  <input
                    inputMode="numeric"
                    value={settings.accountNumber || ""}
                    onChange={e => update("accountNumber", numericOnly(e.target.value))}
                    placeholder="000000000"
                  />
                </Field>
              </div>
              <Field label="Account Name">
                <input
                  value={settings.bankName || ""}
                  onChange={e => update("bankName", e.target.value)}
                  placeholder="Name on account"
                />
              </Field>
            </div>
          )}
        </div>

        {/* Invoice */}
        <div className="settings-card">
          <p className="card-title">Invoicing</p>
          <div className="fields-row fields-row-2">
            <Field label="Invoice Prefix">
              <input
                value={settings.invoicePrefix || ""}
                onChange={e => update("invoicePrefix", e.target.value)}
                placeholder="INV-"
              />
            </Field>
            <Field label="Next Number">
              <input
                type="number"
                min={1}
                value={settings.nextInvoiceNumber || 1}
                onChange={e => update("nextInvoiceNumber", Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="fields-row fields-row-2">
            <Field label="Quote Prefix">
              <input
                value={settings.quotePrefix || ""}
                onChange={e => update("quotePrefix", e.target.value)}
                placeholder="QUO-"
              />
            </Field>
            <Field label="Next Quote Number">
              <input
                type="number"
                min={1}
                value={settings.nextQuoteNumber || 1}
                onChange={e => update("nextQuoteNumber", Number(e.target.value))}
              />
            </Field>
          </div>
        </div>

        {/* Branding */}
        <div className="settings-card branding-card" style={{ gridColumn: "1 / -1" }}>
          <p className="card-title">Branding</p>
          <div className="logo-upload">
            <label className="upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                hidden
              />
              {logoUploading ? "Uploading..." : settings.logoUrl ? "Replace Logo" : "Upload Logo"}
            </label>
            {settings.logoUrl && (
              <div className="logo-preview">
                <img src={settings.logoUrl} alt="Business Logo" />
              </div>
            )}
          </div>
        </div>

      </div>

      <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={handleSave}
          style={{
            background: "#111", color: "#fff", border: "none", borderRadius: 8,
            padding: "0.6rem 1.5rem", fontSize: "0.875rem", fontWeight: 600,
            cursor: "pointer", fontFamily: "system-ui",
          }}
        >
          Save Settings
        </button>
        {saved && <span style={{ fontSize: "0.8rem", color: "#34c77b" }}>Saved ✓</span>}
      </div>

    </div>
  );
}