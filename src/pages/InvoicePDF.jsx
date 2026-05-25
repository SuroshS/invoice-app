import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  logo: { width: 120, height: 60, objectFit: "contain", marginBottom: 8 },
  businessName: { fontSize: 16, fontWeight: "bold" },
  invoiceTitle: { fontSize: 18, fontWeight: "bold" },
  section: { marginBottom: 15 },
  divider: { marginVertical: 20, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 6, marginBottom: 6, fontWeight: "bold" },
  row: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colRate: { width: "15%", textAlign: "right" },
  colAmt: { width: "20%", textAlign: "right" },
  descLine: { fontSize: 11 },
  descSubLine: { fontSize: 11, color: "#444" },
  totals: { marginTop: 20, alignSelf: "flex-end", width: "40%" },
  bold: { fontWeight: "bold" },
  termsTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  termsText: { fontSize: 9, marginBottom: 4, lineHeight: 1.4 }
});

export default function InvoicePDF({ invoice, settings, totals }) {
  const isQuote = invoice.type === "Quote";
  const docTitle = isQuote ? "QUOTE" : "INVOICE";
  const billToLabel = isQuote ? "Prepared For:" : "Bill To:";
  const logoSrc = settings.logoUrl || settings.logoDataUrl || null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            {logoSrc ? <Image style={styles.logo} src={logoSrc} /> : null}
            <Text style={styles.businessName}>{settings.businessName || ""}</Text>
            {settings.abn ? <Text>ABN: {settings.abn}</Text> : null}
            {settings.qbcc ? <Text>QBCC: {settings.qbcc}</Text> : null}
            {settings.address ? <Text>{settings.address}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{docTitle}</Text>
            <Text>#{invoice.invoiceNumber}</Text>
            <Text>Date: {invoice.date}</Text>
          </View>
        </View>

        {/* BILL TO */}
        <View style={styles.section}>
          <Text style={styles.bold}>{billToLabel}</Text>
          {invoice.billToName ? <Text>{invoice.billToName}</Text> : null}
          {invoice.billToAddress ? <Text>{invoice.billToAddress}</Text> : null}
          {invoice.billToEmail ? <Text>{invoice.billToEmail}</Text> : null}
        </View>

        {/* LINE ITEMS */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colRate}>Rate</Text>
          <Text style={styles.colAmt}>Amount</Text>
        </View>

        {invoice.items.map((item, i) => {
          const qty = Number(item.qty) || 0;
          const rate = Number(item.rate) || 0;
          const amount = qty * rate;
          // Split description by newlines
          const lines = (item.description || "").split("\n");
          const firstLine = lines[0] || "";
          const extraLines = lines.slice(1);

          return (
            <View key={i} style={styles.row}>
              {/* Description column — first line inline, extra lines below */}
              <View style={styles.colDesc}>
                <Text style={styles.descLine}>{firstLine}</Text>
                {extraLines.map((line, li) => (
                  <Text key={li} style={styles.descSubLine}>{line}</Text>
                ))}
              </View>
              {/* Qty, rate, amount always aligned to first line */}
              <Text style={styles.colQty}>{qty}</Text>
              <Text style={styles.colRate}>${rate.toFixed(2)}</Text>
              <Text style={styles.colAmt}>${amount.toFixed(2)}</Text>
            </View>
          );
        })}

        {/* TOTALS */}
        <View style={styles.totals}>
          <Text>Subtotal: ${totals.subtotal.toFixed(2)}</Text>
          <Text>GST: ${totals.gst.toFixed(2)}</Text>
          <Text style={styles.bold}>Total: ${totals.total.toFixed(2)}</Text>
        </View>

        {/* NOTES */}
        {invoice.notes ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.bold}>Notes:</Text>
            <Text style={{ marginTop: 6, fontSize: 10 }}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* PAYMENT DETAILS — invoices only */}
        {!isQuote && (settings.bankName || settings.bsb || settings.accountNumber) ? (
          <View style={{ marginTop: 25 }}>
            <Text style={styles.bold}>Payment Details:</Text>
            {settings.bankName ? <Text>Account Name: {settings.bankName}</Text> : null}
            {settings.bsb ? <Text>BSB: {settings.bsb}</Text> : null}
            {settings.accountNumber ? <Text>Account Number: {settings.accountNumber}</Text> : null}
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* TERMS */}
        {!isQuote ? (
          <View>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>• All works have been completed in accordance with applicable Australian Standards and QBCC regulations.</Text>
            <Text style={styles.termsText}>• This invoice is issued upon completion of works unless otherwise agreed in writing.</Text>
            <Text style={styles.termsText}>• Payment is due within 7 days from the invoice issue date.</Text>
            <Text style={styles.termsText}>• Late payments may be subject to administrative follow-up.</Text>
            <Text style={styles.termsText}>• Ownership of materials and workmanship remains with {settings.businessName || "the business"} until payment is received in full.</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.termsTitle}>Quote Terms</Text>
            <Text style={styles.termsText}>• This quote is valid for 30 days from the date of issue.</Text>
            <Text style={styles.termsText}>• Prices are subject to change after the validity period.</Text>
            <Text style={styles.termsText}>• Work will commence upon written acceptance of this quote.</Text>
            <Text style={styles.termsText}>• All works will be completed in accordance with applicable Australian Standards and QBCC regulations.</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}