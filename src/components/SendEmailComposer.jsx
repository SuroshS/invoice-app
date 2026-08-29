// Renders as a swapped-in VIEW inside Invoices.jsx's existing preview
// modal (see the previewView === "compose" branch there) — this is
// intentionally not its own overlay/modal. One component handles both
// Invoice and Quote by branching on invoice.type, per Payvle's convention
// of a single shared template with type-driven copy (see InvoicePDF.jsx).
//
// Purely presentational/controlled — Invoices.jsx owns the draft state and
// the actual send (onSend triggers a real call to the send-invoice-email
// Edge Function, see src/lib/sendInvoiceEmail.js).
const styles = `
.sec-root { flex: 1; min-height: 0; display: flex; flex-direction: column; background: #fff; }
.sec-body { flex: 1; overflow-y: auto; padding: 20px; }
.sec-field { margin-bottom: 16px; }
.sec-field:last-child { margin-bottom: 0; }
.sec-field label {
  display: block; font-size: 0.72rem; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px;
}
.sec-field input, .sec-field textarea {
  width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid #e0e0e0;
  background: #fafafa; font-size: 0.85rem; color: #111; font-family: system-ui;
  transition: border 0.15s, background 0.15s;
}
.sec-field input:focus, .sec-field textarea:focus {
  outline: none; border-color: #111; background: #fff;
}
.sec-field input:disabled, .sec-field textarea:disabled { opacity: 0.7; }
.sec-message { resize: vertical; min-height: 160px; line-height: 1.6; }
.sec-hint { font-size: 0.74rem; color: #c0392b; margin-top: 6px; }
.sec-error {
  background: #fff5f5; color: #c0392b; border: 1px solid #fde0e0;
  border-radius: 9px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 16px;
}
.sec-attachment {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border: 1px solid #ebebeb; border-radius: 10px; background: #fafafa;
}
.sec-attachment-icon { font-size: 22px; flex-shrink: 0; }
.sec-attachment-name { font-size: 0.85rem; font-weight: 600; color: #111; word-break: break-word; }
.sec-attachment-sub { font-size: 0.72rem; color: #aaa; margin-top: 2px; }
.sec-success {
  margin-top: 16px; background: #f0faf5; color: #2a7a50; border: 1px solid #c3e6d8;
  border-radius: 9px; padding: 10px 14px; font-size: 0.82rem;
}
.sec-footer {
  flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;
  gap: 10px; padding: 14px 20px; border-top: 1px solid #f0f0f0;
}
.sec-back-link {
  background: none; border: none; color: #555; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; font-family: system-ui; padding: 8px 4px;
}
.sec-back-link:hover { color: #111; }
.sec-back-link:disabled { opacity: 0.5; cursor: not-allowed; }
.sec-send-btn {
  height: 36px; padding: 0 18px; border-radius: 8px; border: 1px solid #2a7a50;
  background: #2a7a50; color: #fff; font-size: 0.84rem; font-weight: 600; cursor: pointer;
  font-family: system-ui; display: flex; align-items: center; gap: 7px; white-space: nowrap;
}
.sec-send-btn:hover:not(:disabled) { background: #226241; }
.sec-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.sec-send-btn.sent { background: #1f5c3d; border-color: #1f5c3d; }
.sec-spinner {
  width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff; border-radius: 50%; animation: secSpin 0.7s linear infinite;
}
@keyframes secSpin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .sec-body { padding: 16px; }
  .sec-footer { flex-direction: column-reverse; align-items: stretch; padding: 14px 16px; }
  .sec-send-btn { width: 100%; justify-content: center; }
  .sec-back-link { text-align: center; }
  .sec-message { min-height: 140px; }
}
`;

export default function SendEmailComposer({
  invoice,
  to,
  subject,
  message,
  onChangeTo,
  onChangeSubject,
  onChangeMessage,
  sendState,
  sendError,
  onSend,
  onBack,
}) {
  const isQuote = invoice.type === "Quote";
  const docLabel = isQuote ? "Quote" : "Invoice";
  const number = invoice.invoiceNumber || "";
  const sending = sendState === "sending";
  const sent = sendState === "sent";
  const canSend = !sending && !sent && to.trim().length > 0;

  return (
    <div className="sec-root">
      <style>{styles}</style>
      <div className="sec-body">
        {sendError && <div className="sec-error">⚠ {sendError}</div>}
        <div className="sec-field">
          <label>To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => onChangeTo(e.target.value)}
            placeholder="client@email.com"
            disabled={sending || sent}
          />
          {!invoice.billToEmail && (
            <div className="sec-hint">No email on file for this client — enter one before sending.</div>
          )}
        </div>

        <div className="sec-field">
          <label>Subject</label>
          <input value={subject} onChange={(e) => onChangeSubject(e.target.value)} disabled={sending || sent} />
        </div>

        <div className="sec-field">
          <label>Message</label>
          <textarea
            className="sec-message"
            value={message}
            onChange={(e) => onChangeMessage(e.target.value)}
            disabled={sending || sent}
          />
        </div>

        <div className="sec-field">
          <label>Attachment</label>
          <div className="sec-attachment">
            <span className="sec-attachment-icon">📄</span>
            <div>
              <div className="sec-attachment-name">{docLabel} #{number}.pdf</div>
              <div className="sec-attachment-sub">Automatically attached by Payvle</div>
            </div>
          </div>
        </div>

        {sent && <div className="sec-success">✓ Sent to {to || "recipient"}.</div>}
      </div>

      <div className="sec-footer">
        <button className="sec-back-link" onClick={onBack} disabled={sending}>← Back to Preview</button>
        <button className={`sec-send-btn${sent ? " sent" : ""}`} onClick={onSend} disabled={!canSend}>
          {sending && <span className="sec-spinner" />}
          {sending ? "Sending..." : sent ? "✓ Sent" : `Send ${docLabel}`}
        </button>
      </div>
    </div>
  );
}
