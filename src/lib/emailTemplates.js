// Builds the default (fully editable) subject/message/recipient shown when
// the send-email composer first opens for a given invoice or quote. Purely
// a starting point for the textarea/inputs — nothing here is persisted back
// to the invoice record.
export function buildDefaultEmailDraft(invoice, settings) {
  const isQuote = invoice.type === "Quote";
  const docLabel = isQuote ? "Quote" : "Invoice";
  const businessName = settings?.businessName || "";
  // The app has no separate first/last name field on an invoice/quote —
  // billToName is the only customer-name field that exists, so it's used
  // as-is rather than guessing at a "first name" split.
  const customerName = invoice.billToName || "there";
  const number = invoice.invoiceNumber || "";

  const subject = `${docLabel} #${number} from ${businessName}`.trim();

  const message = `Hi ${customerName},

Please find attached your ${docLabel.toLowerCase()} #${number}.

Please let me know if you have any questions.

Kind regards,
${businessName}`;

  return {
    to: invoice.billToEmail || "",
    subject,
    message,
  };
}
