import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./Settings.css";
import logo from "../assets/logo.png";

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function Settings() {
  const { data, setData } = useApp();

  const defaultSettings = {
    businessName: "COAT&CURE PTY LTD",
    abn: "34695334742",
    qbcc: "15576833",
    address: "",
    bsb: "064236",
    accountNumber: "10130392",
    bankName: "Ahmad Hussain Nazari Ibrahim",
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
    logoDataUrl: logo,
  };

  const settings = data?.settings || {};

  const [bankOpen, setBankOpen] = useState(false);

  useEffect(() => {
    if (!data?.settings || Object.keys(data.settings).length === 0) {
      setData(prev => ({
        ...prev,
        settings: defaultSettings,
      }));
    }
  }, []);

  function update(field, value) {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      update("logoDataUrl", reader.result);
    };
    reader.readAsDataURL(file);
  }

  function numericOnly(value, maxLen) {
    const clean = value.replace(/\D/g, "");
    return maxLen ? clean.slice(0, maxLen) : clean;
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
              />
            </Field>

            <Field label="ABN">
              <input
                value={settings.abn || ""}
                onChange={e => update("abn", e.target.value)}
              />
            </Field>

            <Field label="QBCC Licence">
              <input
                value={settings.qbcc || ""}
                onChange={e => update("qbcc", e.target.value)}
              />
            </Field>

          </div>

          <Field label="Business Address">
            <textarea
              value={settings.address || ""}
              onChange={e => update("address", e.target.value)}
            />
          </Field>

        </div>

        {/* Bank */}
        <div className={`settings-card card-bank ${bankOpen ? "open" : ""}`}>

          <div
            className="accordion-trigger"
            onClick={() => setBankOpen(prev => !prev)}
          >
            <p className="card-title">Bank Details</p>
            <span className="accordion-chevron">
              {bankOpen ? "▴" : "▾"}
            </span>
          </div>

          {bankOpen && (
            <div className="accordion-body">

              <div className="fields-row fields-row-2">

                <Field label="BSB">
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={settings.bsb || ""}
                    onChange={e =>
                      update("bsb", numericOnly(e.target.value, 6))
                    }
                  />
                </Field>

                <Field label="Account Number">
                  <input
                    inputMode="numeric"
                    value={settings.accountNumber || ""}
                    onChange={e =>
                      update("accountNumber", numericOnly(e.target.value))
                    }
                  />
                </Field>

              </div>

              <Field label="Bank Name">
                <input
                  value={settings.bankName || ""}
                  onChange={e => update("bankName", e.target.value)}
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
              />
            </Field>

            <Field label="Next Number">
              <input
                type="number"
                min={1}
                value={settings.nextInvoiceNumber || 1}
                onChange={e =>
                  update("nextInvoiceNumber", Number(e.target.value))
                }
              />
            </Field>

          </div>

        </div>

        {/* Branding */}
        <div
          className="settings-card branding-card"
          style={{ gridColumn: "1 / -1" }}
        >

          <p className="card-title">Branding</p>

          <div className="logo-upload">

            <label className="upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                hidden
              />
              {settings.logoDataUrl ? "Replace Logo" : "Upload Logo"}
            </label>

            {settings.logoDataUrl && (
              <div className="logo-preview">
                <img
                  src={settings.logoDataUrl}
                  alt="Business Logo"
                />
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}