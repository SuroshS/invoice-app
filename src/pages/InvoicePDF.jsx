import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica"
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25
  },

  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
    marginBottom: 8
  },

  businessName: {
    fontSize: 16,
    fontWeight: "bold"
  },

  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  section: {
    marginBottom: 15
  },

  divider: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd"
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: "bold"
  },

  row: {
    flexDirection: "row",
    marginBottom: 6
  },

  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colRate: { width: "15%", textAlign: "right" },
  colAmt: { width: "20%", textAlign: "right" },

  totals: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: "40%"
  },

  bold: {
    fontWeight: "bold"
  },

  termsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8
  },

  termsText: {
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.4
  }
});

/* ================= COMPONENT ================= */

export default function InvoicePDF({ invoice, settings, totals }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            {settings.logoDataUrl && (
              <Image style={styles.logo} src={settings.logoDataUrl} />
            )}

            <Text style={styles.businessName}>
              {settings.businessName}
            </Text>

            {settings.abn && <Text>ABN: {settings.abn}</Text>}
            {settings.qbcc && <Text>QBCC: {settings.qbcc}</Text>}
            {settings.address && <Text>{settings.address}</Text>}
          </View>

          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text>#{invoice.invoiceNumber}</Text>
            <Text>Date: {invoice.date}</Text>
          </View>
        </View>

        {/* BILL TO */}
        <View style={styles.section}>
          <Text style={styles.bold}>Bill To:</Text>
          <Text>{invoice.billToName}</Text>
          <Text>{invoice.billToAddress}</Text>
          <Text>{invoice.billToEmail}</Text>
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

  return (
    <View key={i} style={styles.row}>
      <Text style={styles.colDesc}>{item.description}</Text>
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
          <Text style={styles.bold}>
            Total: ${totals.total.toFixed(2)}
          </Text>
        </View>
{invoice.notes && (
  <View style={{ marginTop: 20 }}>
    <Text style={styles.bold}>Notes:</Text>
    <Text style={{ marginTop: 6, fontSize: 10 }}>
      {invoice.notes}
    </Text>
  </View>
)}
        {/* PAYMENT DETAILS */}
        <View style={{ marginTop: 25 }}>
          <Text style={styles.bold}>Payment Details:</Text>
          {settings.bankName && <Text>Bank: {settings.bankName}</Text>}
          {settings.bsb && <Text>BSB: {settings.bsb}</Text>}
          {settings.accountNumber && (
            <Text>Account Number: {settings.accountNumber}</Text>
          )}
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* TERMS & CONDITIONS */}
        <View>
          <Text style={styles.termsTitle}>
            Terms & Conditions
          </Text>

          <Text style={styles.termsText}>
            • All works have been completed in accordance with applicable Australian Standards and QBCC regulations.
          </Text>

          <Text style={styles.termsText}>
            • This invoice is issued upon completion of works unless otherwise agreed in writing.
          </Text>

          <Text style={styles.termsText}>
            • Payment is due within 7 days from the invoice issue date.
          </Text>

          <Text style={styles.termsText}>
            • Late payments may be subject to administrative follow-up.
          </Text>

          <Text style={styles.termsText}>
            • Ownership of materials and workmanship remains with Coat & Cure until payment is received in full.
          </Text>
        </View>

      </Page>
    </Document>
  );
}