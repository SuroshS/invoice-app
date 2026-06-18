import { useState } from "react";
import { useApp } from "../context/AppContext";

const styles = `
* { box-sizing: border-box; }

.sett-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: system-ui, sans-serif;
  color: #111;
}

.sett-header { margin-bottom: 1.5rem; }
.sett-title { font-size: 1.1rem; font-weight: 600; color: #111; margin: 0; }
.sett-subtitle { font-size: 0.8rem; color: #bbb; margin: 4px 0 0; }

.sett-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 12px;
}

.sett-card-title {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #bbb;
  margin: 0 0 14px;
}

.sett-card-desc { font-size: 0.78rem; color: #aaa; margin: -6px 0 14px; }

.sett-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.sett-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.sett-field:last-child { margin-bottom: 0; }
.sett-field label { font-size: 0.7rem; color: #bbb; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }

.sett-field input,
.sett-field textarea {
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

.sett-field input:focus,
.sett-field textarea:focus { outline: none; border-color: #111; background: #fff; }
.sett-field textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

.card-bank { padding: 0; overflow: hidden; }
.accordion-trigger {
  width: 100%; padding: 18px 20px; border: none; background: #fff;
  cursor: pointer; display: flex; justify-content: space-between;
  align-items: center; font-family: system-ui; text-align: left;
}
.accordion-trigger:hover { background: #fafafa; }
.accordion-chevron { font-size: 13px; color: #bbb; transition: transform 0.2s ease; }
.card-bank.open .accordion-chevron { transform: rotate(180deg); }
.accordion-body { padding: 0 20px 18px; border-top: 1px solid #f0f0f0; }

.sett-logo-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.sett-logo-btn {
  font-size: 12px; padding: 7px 12px; border-radius: 6px;
  border: 1px solid #e0e0e0; background: #fff; color: #333;
  cursor: pointer; font-family: system-ui; transition: all 0.15s;
}
.sett-logo-btn:hover { background: #f5f5f5; border-color: #bbb; }
.sett-logo-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sett-logo-preview {
  width: 120px; height: 64px; border: 1px solid #ebebeb;
  border-radius: 8px; background: #fafafa;
  display: flex; align-items: center; justify-content: center;
  padding: 10px; overflow: hidden;
}
.sett-logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
.sett-logo-placeholder { font-size: 0.7rem; color: #bbb; text-align: center; }

.sett-save-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }

.sett-save-btn {
  font-size: 12px; padding: 8px 14px; border-radius: 6px;
  border: 1px solid #111; background: #111; color: #fff;
  cursor: pointer; font-family: system-ui; font-weight: 500;
  transition: all 0.15s; display: flex; align-items: center; gap: 6px;
}
.sett-save-btn:hover { background: #333; border-color: #333; }
.sett-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sett-saved { font-size: 0.8rem; color: #34c77b; font-weight: 500; }

.sett-error {
  background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0;
  border-radius: 8px; padding: 10px 14px; font-size: 0.8rem;
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}

.sett-logo-error {
  font-size: 0.75rem; color: #c0392b; margin-top: 4px;
}

.sett-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: settSpin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes settSpin { to { transform: rotate(360deg) } }

@media (max-width: 640px) {
  .sett-page { padding: 1rem; }
  .sett-title { font-size: 1rem; }
  .sett-grid-2 { grid-template-columns: 1fr; gap: 10px; }
  .sett-card { padding: 16px; }
  .accordion-trigger { padding: 16px; }
  .accordion-body { padding: 0 16px 16px; }
  .sett-save-btn { width: 100%; padding: 10px 14px; justify-content: center; }
  .sett-save-row { align-items: stretch; flex-direction: column; }
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
  const { data, setData, saveSettings, uploadLogo } = useApp();

  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [bankOpen, setBankOpen] = useState(false);

  const settings = data?.settings || {};

  function update(field, value) {
    setSaveError("");
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
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
          <h1 className="sett-title">Settings</h1>
          <p className="sett-subtitle">Business & invoice configuration</p>
        </div>

        {saveError && (
          <div className="sett-error">
            ⚠ {saveError}
          </div>
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
            <p className="sett-card-title" style={{ margin: 0 }}>Bank Details</p>
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
          </div>

          {logoError && <div className="sett-logo-error">⚠ {logoError}</div>}
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