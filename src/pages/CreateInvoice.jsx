import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { loadPdfJs, renderPdfPagesToImages } from "../lib/pdfjs";
import { generateInvoicePdfBlob } from "../lib/pdfEngine";

function buildInvoiceNumber(settings, type) {
  const isQuote = type === "Quote";
  const prefix = isQuote ? settings.quotePrefix || "QUO-" : settings.invoicePrefix || "INV-";
  const number = isQuote ? settings.nextQuoteNumber || 1 : settings.nextInvoiceNumber || 1;
  return `${prefix}${number}`;
}

function blankForm(type) {
  return {
    type,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    billToName: "",
    billToAddress: "",
    billToEmail: "",
    billToPhone: "",
    gstEnabled: true,
    gstRate: 0.1,
    notes: "",
    items: [{ description: "", qty: 1, rate: 0 }],
  };
}

function formFromInvoice(invoice) {
  return {
    type: invoice.type || "Invoice",
    date: invoice.date || new Date().toISOString().slice(0, 10),
    clientId: invoice.clientId || null,
    billToName: invoice.billToName || "",
    billToAddress: invoice.billToAddress || "",
    billToEmail: invoice.billToEmail || "",
    billToPhone: invoice.billToPhone || "",
    gstEnabled: invoice.gstEnabled !== undefined ? invoice.gstEnabled : true,
    gstRate: invoice.gstRate || 0.1,
    notes: invoice.notes || "",
    items:
      invoice.items && invoice.items.length > 0
        ? invoice.items.map((i) => ({
            description: i.description || "",
            qty: i.qty ?? 1,
            rate: i.rate ?? 0,
          }))
        : [{ description: "", qty: 1, rate: 0 }],
  };
}

function AutoTextarea({ value, onChange, placeholder, className }) {
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
      className={className}
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

function isFormDirty(form) {
  const hasClientInfo = form.billToName || form.billToEmail || form.billToAddress || form.billToPhone;
  const hasNotes = form.notes;
  const hasLineItemContent = form.items.some(
    (item) => item.description || item.rate > 0 || item.qty !== 1
  );
  return Boolean(hasClientInfo || hasNotes || hasLineItemContent);
}

/* Styled to match the app's theme — clean, bold labels, but sized sensibly for a dense form */
const styles = `
* { box-sizing: border-box; }

.ci-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 3rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #111;
}

.ci-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 12px;
  flex-wrap: wrap;
}
.ci-header-left h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 2px;
  letter-spacing: -0.01em;
}
.ci-num {
  font-size: 0.8rem;
  color: #aaa;
}
.ci-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ci-btn {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: system-ui;
  transition: all 0.15s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
}
.ci-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ci-btn-dark { background: #111; color: #fff; border-color: #111; }
.ci-btn-dark:hover { background: #333; border-color: #333; }

.ci-btn-outline { background: #fff; color: #111; border-color: #e0e0e0; }
.ci-btn-outline:hover { background: #f5f5f5; border-color: #bbb; }

.ci-btn-ghost { background: #f5f5f5; color: #555; border-color: #f5f5f5; }
.ci-btn-ghost:hover { background: #ececec; }

.ci-btn-spinner {
  width: 11px; height: 11px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: ciSpin 0.7s linear infinite;
}
.ci-btn-outline .ci-btn-spinner,
.ci-btn-ghost .ci-btn-spinner {
  border: 2px solid rgba(0,0,0,0.15);
  border-top-color: #555;
}
@keyframes ciSpin { to { transform: rotate(360deg) } }

.ci-editing-badge {
  background: #f0eefe; color: #5b41c0; border: 1px solid #ddd5fa;
  border-radius: 9px; padding: 9px 13px; font-size: 0.8rem;
  margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.ci-editing-badge button {
  background: none; border: none; color: #5b41c0; font-size: 0.78rem;
  font-weight: 600; cursor: pointer; font-family: system-ui; text-decoration: underline;
  flex-shrink: 0;
}

.ci-error {
  background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0;
  border-radius: 9px; padding: 9px 13px; font-size: 0.82rem;
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}
.ci-success {
  background: #f0faf5; color: #2a7a50; border: 1px solid #c3e6d8;
  border-radius: 9px; padding: 9px 13px; font-size: 0.82rem;
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}

.ci-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
}
.ci-card-title {
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #bbb;
  margin-bottom: 12px;
}

.ci-type-row { display: flex; gap: 8px; }
.ci-type-btn {
  padding: 6px 16px;
  border-radius: 7px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  font-family: system-ui;
  color: #888;
  transition: all 0.15s;
}
.ci-type-btn:hover { border-color: #bbb; color: #555; }
.ci-type-btn.active { background: #111; color: #fff; border-color: #111; }

.ci-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}
.ci-field:last-child { margin-bottom: 0; }
.ci-field label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ci-field input,
.ci-field textarea,
.ci-desc {
  padding: 8px 11px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 0.85rem;
  color: #111;
  font-family: system-ui;
  width: 100%;
  transition: border 0.15s, background 0.15s;
  line-height: 1.5;
}
.ci-field input:focus,
.ci-field textarea:focus,
.ci-desc:focus {
  outline: none;
  border-color: #111;
  background: #fff;
}
.ci-field textarea { resize: vertical; min-height: 64px; }

.ci-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }

.ci-client-search-wrap { position: relative; margin-bottom: 12px; }
.ci-client-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff;
  border: 1px solid #ebebeb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  max-height: 220px; overflow-y: auto; z-index: 60; padding: 6px;
}
.ci-client-option {
  display: block; width: 100%; text-align: left; padding: 9px 10px; border-radius: 7px;
  border: none; background: none; cursor: pointer; font-family: system-ui;
}
.ci-client-option:hover { background: #f5f5f5; }
.ci-client-option-name { font-size: 0.85rem; font-weight: 500; color: #111; }
.ci-client-option-sub { font-size: 0.72rem; color: #aaa; margin-top: 1px; }
.ci-client-empty { padding: 10px; font-size: 0.8rem; color: #bbb; }
.ci-client-selected {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  background: #fafafa; border: 1px solid #ebebeb; border-radius: 9px; padding: 10px 13px;
  margin-bottom: 12px;
}
.ci-client-selected-info { min-width: 0; }
.ci-client-selected-name { font-size: 0.85rem; font-weight: 600; color: #111; }
.ci-client-selected-sub { font-size: 0.74rem; color: #aaa; margin-top: 2px; }
.ci-client-change-btn {
  background: none; border: none; color: #5b41c0; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; font-family: system-ui; text-decoration: underline; flex-shrink: 0;
}

.ci-line-labels {
  display: grid;
  grid-template-columns: 1fr 68px 84px 76px 24px;
  gap: 8px;
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #bbb;
  margin-bottom: 6px;
  padding: 0 2px;
}

.ci-line-row {
  display: grid;
  grid-template-columns: 1fr 68px 84px 76px 24px;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.ci-desc { resize: none; }

.ci-num-input {
  padding: 8px 9px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 0.85rem;
  color: #111;
  font-family: system-ui;
  width: 100%;
  text-align: right;
  transition: border 0.15s, background 0.15s;
  appearance: textfield;
  -moz-appearance: textfield;
}
.ci-num-input::-webkit-outer-spin-button,
.ci-num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ci-num-input:focus { outline: none; border-color: #111; background: #fff; }

.ci-line-total {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111;
  text-align: right;
  white-space: nowrap;
}

.ci-del-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  padding: 2px;
  transition: color 0.15s;
  text-align: center;
}
.ci-del-btn:hover { color: #c0392b; }

.ci-add-btn {
  background: transparent;
  border: 1px dashed #ddd;
  border-radius: 8px;
  padding: 7px 13px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  color: #aaa;
  font-family: system-ui;
  transition: all 0.15s;
  margin-top: 2px;
  display: inline-block;
}
.ci-add-btn:hover { border-color: #111; color: #111; }

.ci-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 5px 0;
  color: #555;
}
.ci-total-row.final {
  font-weight: 700;
  font-size: 0.98rem;
  color: #111;
  padding-top: 10px;
  margin-top: 6px;
  border-top: 1px solid #ebebeb;
}
.ci-gst-wrap { display: flex; align-items: center; gap: 8px; color: #aaa; }
.ci-gst-btn {
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  font-family: system-ui;
  color: #888;
  transition: all 0.15s;
}
.ci-gst-btn.active { background: #111; color: #fff; border-color: #111; }

.ci-mob-lbl {
  display: none;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #bbb;
  margin-bottom: 3px;
}

/* Preview modal */
.ci-preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
.ci-preview-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 760px; height: 88vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.18); animation: slideUp 0.2s ease; }
.ci-preview-topbar { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; gap: 12px; }
.ci-preview-title { font-size: 0.88rem; font-weight: 600; color: #111; margin-bottom: 2px; }
.ci-preview-meta { font-size: 0.74rem; color: #aaa; }
.ci-preview-close { width: 28px; height: 28px; border-radius: 7px; border: 1px solid #e5e5e5; background: #f5f5f5; color: #888; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ci-preview-body { flex: 1; overflow-y: auto; overflow-x: hidden; display: block; background: #f7f7f7; padding: 14px; }
.ci-preview-img { width: 100%; height: auto; display: block; margin: 0 auto 14px; border-radius: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
.ci-preview-loading { height: 300px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 0.85rem; gap: 10px; flex-direction: column; }
.ci-preview-spinner { width: 26px; height: 26px; border: 3px solid #ebebeb; border-top-color: #111; border-radius: 50%; animation: ciSpin 0.7s linear infinite; }
.ci-preview-error { height: 200px; display: flex; align-items: center; justify-content: center; color: #c0392b; font-size: 0.85rem; flex-direction: column; gap: 8px; }

/* Confirm / info modals — same pattern used on the Invoices page */
.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 700; display: flex; align-items: center; justify-content: center; padding: 20px; }
.confirm-modal { width: 100%; max-width: 380px; background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
.confirm-title { margin: 0 0 6px; font-size: 1rem; font-weight: 600; color: #111; }
.confirm-text { margin: 0 0 14px; font-size: 0.85rem; color: #888; line-height: 1.5; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
.confirm-cancel, .confirm-primary { height: 34px; padding: 0 13px; border-radius: 8px; cursor: pointer; font-family: system-ui; font-size: 0.82rem; font-weight: 600; border: 1px solid #e0e0e0; }
.confirm-cancel { background: #fff; color: #333; }
.confirm-primary { background: #111; color: #fff; border-color: #111; }

@media (max-width: 600px) {
  .ci-page { padding: 1rem 1rem 3rem; }
  .ci-header-left h1 { font-size: 1.1rem; }
  .ci-num { font-size: 0.78rem; }
  .ci-header-actions { width: 100%; }
  .ci-btn { flex: 1; justify-content: center; padding: 9px 10px; font-size: 0.8rem; }
  .ci-grid-2 { grid-template-columns: 1fr; gap: 10px; }
  .ci-card { padding: 14px; }

  .ci-line-labels { display: none; }
  .ci-line-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #fafafa;
    border: 1px solid #ebebeb;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 8px;
  }
  .ci-desc { width: 100%; font-size: 0.9rem; }
  .ci-mob-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; width: 100%; }
  .ci-mob-lbl { display: block; }
  .ci-mob-col { display: flex; flex-direction: column; }
  .ci-num-input { width: 100%; font-size: 0.9rem; text-align: left; padding: 8px 10px; }
  .ci-line-total { font-size: 0.9rem; padding: 8px 0; text-align: left; }
  .ci-del-btn { align-self: flex-end; font-size: 16px; }

  .ci-total-row { font-size: 0.9rem; }
  .ci-total-row.final { font-size: 1rem; }

  .ci-preview-overlay { align-items: flex-end; padding: 0; }
  .ci-preview-modal { height: 92vh; max-height: 92vh; border-radius: 16px 16px 0 0; }
  .ci-preview-topbar { padding: 12px 14px; }
  .ci-preview-body { padding: 10px; }
}
`;

export default function CreateInvoice() {
  const { data, saveInvoice, updateInvoice, createClient, isReadOnly, secondaryDataLoading } = useApp();
  const { settings } = data;
  const location = useLocation();
  const navigate = useNavigate();

  const editingInvoice = location.state?.editingInvoice || null;
  const isEditing = Boolean(editingInvoice);

  // If the user's trial has expired and they have no subscription, this page
  // is read-only — redirect them back to the invoices list and show the upgrade
  // prompt. This handles direct URL navigation to /create while read-only.
  useEffect(() => {
    if (isReadOnly) {
      navigate("/invoices", { replace: true });
      setTimeout(() => {
        if (typeof window.__payvleShowUpgradePrompt === "function") {
          window.__payvleShowUpgradePrompt();
        }
      }, 100);
    }
  }, [isReadOnly, navigate]);

  const [type, setType] = useState(editingInvoice?.type || "Invoice");
  const [form, setForm] = useState(() =>
    editingInvoice ? formFromInvoice(editingInvoice) : blankForm("Invoice")
  );

  // "existing" shows a searchable picker over data.clients; "new" shows the
  // free-text fields (and creates a client record on save). Editing a record
  // that's already linked to a client starts in "existing" with that client
  // pre-selected; a legacy record with no clientId starts in "new" so its
  // free-typed details stay editable exactly as before this feature existed.
  const [clientMode, setClientMode] = useState(
    editingInvoice?.clientId ? "existing" : "new"
  );
  const [clientSearch, setClientSearch] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientError, setClientError] = useState("");
  const clientPickerRef = useRef(null);

  useEffect(() => {
    if (!clientPickerOpen) return;
    function handleOutsideClick(e) {
      if (clientPickerRef.current && !clientPickerRef.current.contains(e.target)) {
        setClientPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [clientPickerOpen]);

  const clients = useMemo(() => data.clients || [], [data.clients]);
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === form.clientId) || null,
    [clients, form.clientId]
  );
  const matchingClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  // Two separate loading flags so only the button actually clicked shows a spinner
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const busy = saving || exporting;

  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Confirm/info modals — replace native window.confirm/window.alert so these
  // flows match the rest of the app's UI instead of a browser-native dialog.
  const [pendingTypeSwitch, setPendingTypeSwitch] = useState(null);
  const [showConvertNotice, setShowConvertNotice] = useState(false);
  const [confirmCancelEdit, setConfirmCancelEdit] = useState(false);

  useEffect(() => {
    loadPdfJs().catch(() => {});
  }, []);

  const invoiceNumber = isEditing
    ? editingInvoice.invoiceNumber
    : buildInvoiceNumber(settings, type);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (acc, item) => acc + (Number(item.qty) || 0) * (Number(item.rate) || 0),
      0
    );
    const gst = form.gstEnabled ? subtotal * form.gstRate : 0;
    return { subtotal, gst, total: subtotal + gst };
  }, [form]);

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isFormDirty(form) && !busy) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, busy]);

  function handleTypeChange(newType) {
    if (newType === type) return;

    // Converting Quote <-> Invoice while editing an existing record is intentionally
    // NOT done here anymore — that's a dedicated "Convert to Invoice" action from the
    // Invoices list which creates a linked-but-separate record. Editing the type here
    // would just relabel the same document, which isn't what conversion should mean.
    if (isEditing) {
      setShowConvertNotice(true);
      return;
    }

    if (isFormDirty(form)) {
      setPendingTypeSwitch(newType);
      return;
    }

    setType(newType);
    setForm(blankForm(newType));
    setSaveError("");
    setSaveSuccess("");
  }

  function confirmTypeSwitch() {
    const newType = pendingTypeSwitch;
    setPendingTypeSwitch(null);
    setType(newType);
    setForm(blankForm(newType));
    setSaveError("");
    setSaveSuccess("");
  }

  function update(field, value) {
    setSaveError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectClient(client) {
    setClientError("");
    setForm((prev) => ({
      ...prev,
      clientId: client.id,
      billToName: client.name || "",
      billToEmail: client.email || "",
      billToPhone: client.phone || "",
      billToAddress: client.address || "",
    }));
    setClientPickerOpen(false);
    setClientSearch("");
  }

  function switchToNewClient() {
    setClientError("");
    setClientMode("new");
    setClientPickerOpen(false);
    setForm((prev) => ({ ...prev, clientId: null }));
  }

  function switchToExistingClient() {
    setClientError("");
    setClientMode("existing");
    // Existing free-typed text isn't a real client match — clear it so the
    // picker starts empty rather than implying those details are linked.
    setForm((prev) => ({ ...prev, clientId: null, billToName: "", billToEmail: "", billToPhone: "", billToAddress: "" }));
  }

  function updateItem(index, field, value) {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm((prev) => ({ ...prev, items }));
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

  function cancelEditing() {
    if (isFormDirty(form)) {
      setConfirmCancelEdit(true);
      return;
    }
    navigate("/invoices");
  }

  function confirmCancelEditing() {
    setConfirmCancelEdit(false);
    navigate("/invoices");
  }

  const renderPdfToImages = useCallback((blob) => renderPdfPagesToImages(blob, 2.2), []);

  async function openPreview() {
    const invoice = { ...form, invoiceNumber };
    setPreviewOpen(true);
    setPdfPages([]);
    setPdfLoading(true);
    setPreviewError("");

    try {
      const blob = await generateInvoicePdfBlob(invoice, settings, totals);
      const pages = await renderPdfToImages(blob);
      setPdfPages(pages);
    } catch (e) {
      console.error("Preview error:", e);
      setPreviewError("Could not generate preview. Try saving and exporting instead.");
    }

    setPdfLoading(false);
  }

  // Deliberately NOT using the pdfCache.js blob cache used by Invoices.jsx/
  // Clients.jsx — this previews a live-editing draft that can change on
  // every keystroke, so always regenerating fresh here is correct, not a
  // bug to fix (unlike those two pages, which preview already-saved,
  // immutable-until-next-edit records).
  async function generatePdfBlob() {
    const invoice = { ...form, invoiceNumber };
    const blob = await generateInvoicePdfBlob(invoice, settings, totals);
    return { invoice, blob };
  }

  // Resolves what clientId should be stored on the saved invoice. In
  // "existing" mode this just requires a picker selection to already be
  // made. In "new" mode, a client record is created from the free-typed
  // fields (unless the name was left blank, matching the pre-existing
  // behaviour of allowing a client-less draft invoice).
  async function resolveClientForSave() {
    if (clientMode === "existing") {
      if (!form.clientId) {
        return { clientId: null, error: 'Please select a client from the list, or switch to "New client".' };
      }
      return { clientId: form.clientId, error: null };
    }
    if (!form.billToName.trim()) {
      return { clientId: null, error: null };
    }
    const { client, error } = await createClient({
      name: form.billToName,
      email: form.billToEmail,
      phone: form.billToPhone,
      address: form.billToAddress,
    });
    if (error) return { clientId: null, error };
    return { clientId: client.id, error: null };
  }

  function triggerDownload(blob, number) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // SAVE — writes to Supabase but does NOT render a PDF or trigger a browser
  // download. Used while drafting or making small edits.
  async function handleSave() {
    setSaveError("");
    setSaveSuccess("");
    setClientError("");
    setSaving(true);

    try {
      const { clientId, error: clientErr } = await resolveClientForSave();
      if (clientErr) {
        setClientError(clientErr);
        setSaving(false);
        return;
      }

      const invoice = { ...form, clientId, invoiceNumber };

      const result = isEditing
        ? await updateInvoice(editingInvoice._id, invoice, totals)
        : await saveInvoice(invoice, totals);

      if (result.error) {
        setSaveError(result.error);
        setSaving(false);
        return;
      }

      if (isEditing) {
        setSaveSuccess(`${invoiceNumber} saved.`);
        setTimeout(() => {
          setSaveSuccess("");
          navigate("/invoices");
        }, 900);
      } else {
        setSaveSuccess(`${result.invoiceNumber || invoiceNumber} saved as a draft.`);
        setTimeout(() => setSaveSuccess(""), 3500);
        setForm(blankForm(type));
      }
    } catch (e) {
      console.error("Save error:", e);
      setSaveError("Failed to save. Please try again.");
    }

    setSaving(false);
  }

  // SAVE & EXPORT — same as Save, plus triggers the PDF download immediately after.
  async function handleSaveAndExport() {
    setSaveError("");
    setSaveSuccess("");
    setClientError("");
    setExporting(true);

    try {
      const { clientId, error: clientErr } = await resolveClientForSave();
      if (clientErr) {
        setClientError(clientErr);
        setExporting(false);
        return;
      }

      const { invoice, blob } = await generatePdfBlob();
      const invoiceWithClient = { ...invoice, clientId };

      const result = isEditing
        ? await updateInvoice(editingInvoice._id, invoiceWithClient, totals)
        : await saveInvoice(invoiceWithClient, totals);

      if (result.error) {
        setSaveError(result.error);
        setExporting(false);
        return;
      }

      const finalNumber = result.invoiceNumber || invoiceNumber;
      triggerDownload(blob, finalNumber);

      if (isEditing) {
        navigate("/invoices");
      } else {
        setForm(blankForm(type));
      }
    } catch (e) {
      console.error("Save & export error:", e);
      setSaveError("Failed to save and export. Please try again.");
    }

    setExporting(false);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ci-page">

        <div className="ci-header">
          <div className="ci-header-left">
            <h1>{isEditing ? `Edit ${type}` : `New ${type}`}</h1>
            <span className="ci-num">{invoiceNumber}</span>
          </div>
          <div className="ci-header-actions">
            <button className="ci-btn ci-btn-outline" onClick={openPreview} disabled={busy}>
              Preview
            </button>
            <button className="ci-btn ci-btn-ghost" onClick={handleSave} disabled={busy}>
              {saving && <div className="ci-btn-spinner" />}
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="ci-btn ci-btn-dark" onClick={handleSaveAndExport} disabled={busy}>
              {exporting && <div className="ci-btn-spinner" />}
              {exporting ? "Saving..." : "Save & Export"}
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="ci-editing-badge">
            <span>
              ✎ Editing existing {editingInvoice.type === "Quote" ? "quote" : "invoice"} — saving will overwrite the original.
            </span>
            <button onClick={cancelEditing}>Cancel</button>
          </div>
        )}

        {saveError && <div className="ci-error">⚠ {saveError}</div>}
        {saveSuccess && <div className="ci-success">✓ {saveSuccess}</div>}

        {/* Document type */}
        <div className="ci-card">
          <p className="ci-card-title">Document Type</p>
          <div className="ci-type-row">
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

        {/* Client details */}
        <div className="ci-card">
          <p className="ci-card-title">Client Details</p>

          <div className="ci-type-row" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={`ci-type-btn${clientMode === "new" ? " active" : ""}`}
              onClick={switchToNewClient}
            >
              New client
            </button>
            <button
              type="button"
              className={`ci-type-btn${clientMode === "existing" ? " active" : ""}`}
              onClick={switchToExistingClient}
            >
              Existing client
            </button>
          </div>

          {clientError && <div className="ci-error">⚠ {clientError}</div>}

          {clientMode === "existing" ? (
            <>
              {selectedClient && (
                <div className="ci-client-selected">
                  <div className="ci-client-selected-info">
                    <div className="ci-client-selected-name">{selectedClient.name}</div>
                    <div className="ci-client-selected-sub">
                      {[selectedClient.email, selectedClient.phone].filter(Boolean).join(" · ") || "No email or phone on file"}
                    </div>
                  </div>
                  <button type="button" className="ci-client-change-btn" onClick={() => setClientPickerOpen(true)}>
                    Change
                  </button>
                </div>
              )}

              {(!selectedClient || clientPickerOpen) && (
                <div className="ci-client-search-wrap" ref={clientPickerRef}>
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onFocus={() => setClientPickerOpen(true)}
                    placeholder="Search clients by name..."
                    autoFocus={clientPickerOpen}
                  />
                  {clientPickerOpen && (
                    <div className="ci-client-dropdown">
                      {matchingClients.length === 0 ? (
                        <div className="ci-client-empty">
                          {secondaryDataLoading
                            ? "Loading clients..."
                            : clients.length === 0
                              ? "No saved clients yet — add one via \"New client\"."
                              : "No matching clients."}
                        </div>
                      ) : (
                        matchingClients.map((c) => (
                          <button type="button" key={c.id} className="ci-client-option" onClick={() => selectClient(c)}>
                            <div className="ci-client-option-name">{c.name}</div>
                            {(c.email || c.phone) && (
                              <div className="ci-client-option-sub">{[c.email, c.phone].filter(Boolean).join(" · ")}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="ci-grid-2">
                <div className="ci-field">
                  <label>Client Name</label>
                  <input
                    value={form.billToName}
                    onChange={(e) => update("billToName", e.target.value)}
                    placeholder="e.g. Matt's Painting"
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
              <div className="ci-grid-2">
                <div className="ci-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={form.billToPhone}
                    onChange={(e) => update("billToPhone", e.target.value)}
                    placeholder="0400 000 000"
                  />
                </div>
              </div>
              <div className="ci-field">
                <label>Address</label>
                <textarea
                  value={form.billToAddress}
                  onChange={(e) => update("billToAddress", e.target.value)}
                  placeholder="Street, Suburb, State, Postcode"
                />
              </div>
            </>
          )}
        </div>

        {/* Line items */}
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
                className="ci-desc"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description of work..."
              />

              <input
                type="number"
                inputMode="numeric"
                className="ci-num-input"
                value={item.qty}
                onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
              />
              <input
                type="number"
                inputMode="decimal"
                className="ci-num-input"
                value={item.rate}
                onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                placeholder="0.00"
              />
              <div className="ci-line-total">${fmt(item.qty * item.rate)}</div>
              {form.items.length > 1 && (
                <button className="ci-del-btn" onClick={() => removeItem(i)} aria-label="Remove item">✕</button>
              )}

              {/* Mobile-only layout for the same fields */}
              <div className="ci-mob-inputs" style={{ display: "none" }}>
                <div className="ci-mob-col">
                  <span className="ci-mob-lbl">Qty</span>
                  <input type="number" inputMode="numeric" className="ci-num-input" value={item.qty} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} />
                </div>
                <div className="ci-mob-col">
                  <span className="ci-mob-lbl">Rate</span>
                  <input type="number" inputMode="decimal" className="ci-num-input" value={item.rate} onChange={(e) => updateItem(i, "rate", Number(e.target.value))} placeholder="0.00" />
                </div>
                <div className="ci-mob-col">
                  <span className="ci-mob-lbl">Total</span>
                  <div className="ci-line-total">${fmt(item.qty * item.rate)}</div>
                </div>
              </div>
            </div>
          ))}

          <button className="ci-add-btn" onClick={addItem}>+ Add item</button>
        </div>

        {/* Totals */}
        <div className="ci-card">
          <p className="ci-card-title">Summary</p>
          <div className="ci-total-row">
            <span>Subtotal</span>
            <span>${fmt(totals.subtotal)}</span>
          </div>
          <div className="ci-total-row">
            <span className="ci-gst-wrap">
              GST (10%)
              <button
                className={`ci-gst-btn${form.gstEnabled ? " active" : ""}`}
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

        {/* Notes */}
        <div className="ci-card">
          <p className="ci-card-title">Notes</p>
          <div className="ci-field">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Payment terms, job details, additional info..."
            />
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="ci-preview-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="ci-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ci-preview-topbar">
              <div>
                <div className="ci-preview-title">{invoiceNumber}</div>
                <div className="ci-preview-meta">{form.billToName || "No client"} · {form.date}</div>
              </div>
              <button className="ci-preview-close" onClick={() => setPreviewOpen(false)} aria-label="Close preview">✕</button>
            </div>
            <div className="ci-preview-body">
              {pdfLoading && (
                <div className="ci-preview-loading">
                  <div className="ci-preview-spinner" />
                  Loading preview...
                </div>
              )}
              {!pdfLoading && previewError && (
                <div className="ci-preview-error">
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  {previewError}
                </div>
              )}
              {!pdfLoading && !previewError && pdfPages.map((src, i) => (
                <img key={i} src={src} alt={`Page ${i + 1}`} className="ci-preview-img" />
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingTypeSwitch && (
        <div className="confirm-overlay" onClick={() => setPendingTypeSwitch(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Switch document type?</h3>
            <p className="confirm-text">You have unsaved changes. Switching document type will clear this form. Continue?</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setPendingTypeSwitch(null)}>Cancel</button>
              <button className="confirm-primary" onClick={confirmTypeSwitch}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {showConvertNotice && (
        <div className="confirm-overlay" onClick={() => setShowConvertNotice(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Use "Convert to Invoice" instead</h3>
            <p className="confirm-text">
              To convert a quote into an invoice, use the "Convert to Invoice" button on the Invoices page instead — it keeps your original quote and creates a separate invoice.
            </p>
            <div className="confirm-actions">
              <button className="confirm-primary" onClick={() => setShowConvertNotice(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {confirmCancelEdit && (
        <div className="confirm-overlay" onClick={() => setConfirmCancelEdit(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Discard changes?</h3>
            <p className="confirm-text">Discard changes to this {editingInvoice?.type === "Quote" ? "quote" : "invoice"}?</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmCancelEdit(false)}>Cancel</button>
              <button className="confirm-primary" onClick={confirmCancelEditing}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}