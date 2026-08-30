import { useState } from "react";
import { useApp } from "../context/AppContext";

const styles = `
* { box-sizing: border-box; }

.sett-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 3rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #111;
}

.sett-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 12px;
  flex-wrap: wrap;
}
.sett-header-left h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 2px;
  letter-spacing: -0.01em;
}
.sett-subtitle { font-size: 0.8rem; color: #aaa; }

.sett-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
}

.sett-card-title {
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #bbb;
  margin: 0 0 12px;
}

.sett-card-desc { font-size: 0.78rem; color: #aaa; margin: -5px 0 12px; }

.sett-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.sett-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.sett-field:last-child { margin-bottom: 0; }
.sett-field label {
  font-size: 0.7rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.sett-field input,
.sett-field textarea {
  width: 100%;
  padding: 8px 11px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 0.85rem;
  color: #111;
  font-family: system-ui;
  box-sizing: border-box;
  transition: border 0.15s, background 0.15s;
}

.sett-field input:focus,
.sett-field textarea:focus { outline: none; border-color: #111; background: #fff; }
.sett-field textarea { resize: vertical; min-height: 64px; line-height: 1.5; }

/* Bank accordion / Terms accordion — same shared accordion family */
.card-bank, .card-terms { padding: 0; overflow: hidden; }
.accordion-trigger {
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: #fff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: system-ui;
  text-align: left;
  transition: background 0.15s;
}
.accordion-trigger:hover { background: #fafafa; }
.accordion-trigger .sett-card-title { margin: 0; }
.accordion-chevron {
  font-size: 11px;
  color: #bbb;
  transition: transform 0.2s ease;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-bank.open .accordion-chevron,
.card-terms.open .accordion-chevron { transform: rotate(180deg); background: #111; color: #fff; }
.accordion-body { padding: 0 18px 16px; border-top: 1px solid #f5f5f5; }
.accordion-body .sett-card-desc { margin-top: 12px; }

/* Sub-tabs for switching between Quote / Invoice terms within the Terms card */
.terms-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.terms-tab {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 7px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  color: #888;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
}
.terms-tab:hover { border-color: #bbb; color: #555; }
.terms-tab.active { background: #111; color: #fff; border-color: #111; }
.terms-tab.quote-active { background: #5b41c0; border-color: #5b41c0; }

.sett-logo-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.sett-logo-btn {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #111;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  white-space: nowrap;
}
.sett-logo-btn:hover { background: #f5f5f5; border-color: #bbb; }
.sett-logo-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sett-logo-preview {
  width: 108px;
  height: 58px;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
}
.sett-logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
.sett-logo-placeholder { font-size: 0.68rem; color: #bbb; text-align: center; }

.sett-save-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }

/* Same button family as ci-btn-dark in CreateInvoice */
.sett-save-btn {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sett-save-btn:hover { background: #333; border-color: #333; }
.sett-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sett-saved {
  font-size: 0.8rem;
  color: #2a7a50;
  font-weight: 600;
}

.sett-error {
  background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0;
  border-radius: 9px; padding: 9px 13px; font-size: 0.82rem;
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}

.sett-logo-error {
  font-size: 0.74rem; color: #c0392b; margin-top: 6px;
  width: 100%;
}

.sett-spinner {
  width: 11px; height: 11px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: settSpin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes settSpin { to { transform: rotate(360deg) } }

@media (max-width: 600px) {
  .sett-page { padding: 1rem 1rem 3rem; }
  .sett-header-left h1 { font-size: 1.1rem; }
  .sett-grid-2 { grid-template-columns: 1fr; gap: 10px; }
  .sett-card { padding: 14px; }
  .accordion-trigger { padding: 12px 14px; }
  .accordion-body { padding: 0 14px 14px; }
  .sett-save-btn { width: 100%; justify-content: center; padding: 10px 14px; }
  .sett-save-row { align-items: stretch; flex-direction: column; }
  .terms-tabs { width: 100%; }
  .terms-tab { flex: 1; text-align: center; }
}
`;

function Field({ label, children }) {
  return (
    <div className="sett-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function Settings() {
  const { data, saveSettings, uploadLogo } = useApp();

  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [bankOpen, setBankOpen] = useState(false);

  // Terms & Conditions accordion + which sub-tab (Invoice or Quote) is active inside it
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState("invoice"); // "invoice" | "quote"

  // Local draft, seeded from AppContext.data.settings on mount — same
  // pattern CreateInvoice.jsx already uses for its own form. Previously
  // every keystroke on every field called AppContext's generic setData(),
  // pushing a brand-new `data` object into the global context on every
  // character typed — which re-rendered every other useApp() consumer
  // mounted alongside this page (Layout's sidebar, AuthGate) on every
  // keystroke, for a value nothing outside this page needs until Save is
  // actually clicked. Editing a local copy and only committing to
  // AppContext via saveSettings() removes that per-keystroke global
  // re-render entirely.
  const [settings, setSettings] = useState(() => data?.settings || {});

  function update(field, value) {
    setSaveError("");
    setSettings(prev => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError("");
    setLogoUploading(true);

    const { url, error } = await uploadLogo(file);

    if (error) {
      setLogoError(error);
    } else if (url) {
      const cacheBustedUrl = `${url}?t=${Date.now()}`;
      update("logoUrl", cacheBustedUrl);
    }

    setLogoUploading(false);
  }

  function numericOnly(value, maxLen) {
    const clean = value.replace(/\D/g, "");
    return maxLen ? clean.slice(0, maxLen) : clean;
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    setSaved(false);

    const { error } = await saveSettings(settings);

    if (error) {
      setSaveError(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }

    setSaving(false);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sett-page">

        <div className="sett-header">
          <div className="sett-header-left">
            <h1>Settings</h1>
            <span className="sett-subtitle">Business & invoice configuration</span>
          </div>
        </div>

        {saveError && (
          <div className="sett-error">⚠ {saveError}</div>
        )}

        <div className="sett-card">
          <p className="sett-card-title">Business Information</p>

          <Field label="Business Name">
            <input
              value={settings.businessName || ""}
              onChange={e => update("businessName", e.target.value)}
              placeholder="e.g. Smith Electrical Pty Ltd"
            />
          </Field>

          <div className="sett-grid-2">
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

        <div className={`sett-card card-bank ${bankOpen ? "open" : ""}`}>
          <button
            type="button"
            className="accordion-trigger"
            onClick={() => setBankOpen(prev => !prev)}
          >
            <p className="sett-card-title">Bank Details</p>
            <span className="accordion-chevron">⌄</span>
          </button>

          {bankOpen && (
            <div className="accordion-body">
              <p className="sett-card-desc">
                These appear on every invoice so clients know how to pay you.
              </p>
              <Field label="Account Name">
                <input
                  value={settings.bankName || ""}
                  onChange={e => update("bankName", e.target.value)}
                  placeholder="Name on your bank account"
                />
              </Field>
              <div className="sett-grid-2">
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
            </div>
          )}
        </div>

        {/* Terms & Conditions — separate fields for Invoice vs Quote, since quotes
            typically need a validity period / disclaimer while invoices need payment
            terms. Stored as settings.invoiceTerms and settings.quoteTerms respectively,
            and pulled into the PDF based on which type of document is being rendered. */}
        <div className={`sett-card card-terms ${termsOpen ? "open" : ""}`}>
          <button
            type="button"
            className="accordion-trigger"
            onClick={() => setTermsOpen(prev => !prev)}
          >
            <p className="sett-card-title">Terms & Conditions</p>
            <span className="accordion-chevron">⌄</span>
          </button>

          {termsOpen && (
            <div className="accordion-body">
              <p className="sett-card-desc">
                Set different terms for invoices and quotes — these print at the bottom of every document.
              </p>

              <div className="terms-tabs">
                <button
                  type="button"
                  className={`terms-tab${termsTab === "invoice" ? " active" : ""}`}
                  onClick={() => setTermsTab("invoice")}
                >
                  Invoice Terms
                </button>
                <button
                  type="button"
                  className={`terms-tab${termsTab === "quote" ? " quote-active active" : ""}`}
                  onClick={() => setTermsTab("quote")}
                >
                  Quote Terms
                </button>
              </div>

              {termsTab === "invoice" ? (
                <Field label="Invoice Terms & Conditions">
                  <textarea
                    value={settings.invoiceTerms || ""}
                    onChange={e => update("invoiceTerms", e.target.value)}
                    placeholder="e.g. Payment due within 14 days. Late payments may incur a 5% fee."
                    style={{ minHeight: 110 }}
                  />
                </Field>
              ) : (
                <Field label="Quote Terms & Conditions">
                  <textarea
                    value={settings.quoteTerms || ""}
                    onChange={e => update("quoteTerms", e.target.value)}
                    placeholder="e.g. This quote is valid for 30 days. Prices may change if the job scope changes."
                    style={{ minHeight: 110 }}
                  />
                </Field>
              )}
            </div>
          )}
        </div>

        <div className="sett-card">
          <p className="sett-card-title">Branding</p>
          <p className="sett-card-desc">Your logo appears at the top of every invoice and quote.</p>

          <div className="sett-logo-row">
            <label className="sett-logo-btn" style={{ opacity: logoUploading ? 0.6 : 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={logoUploading}
                hidden
              />
              {logoUploading ? "Uploading..." : settings.logoUrl ? "Replace Logo" : "Upload Logo"}
            </label>

            <div className="sett-logo-preview">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Business logo" />
              ) : (
                <div className="sett-logo-placeholder">No logo yet</div>
              )}
            </div>

            {logoError && <div className="sett-logo-error">⚠ {logoError}</div>}
          </div>
        </div>

        <div className="sett-save-row">
          <button
            className="sett-save-btn"
            onClick={handleSave}
            disabled={saving || logoUploading}
          >
            {saving && <div className="sett-spinner" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="sett-saved">✓ Saved</span>}
        </div>
      </div>
    </>
  );
}