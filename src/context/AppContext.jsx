import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import logo from "../assets/logo.png";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AppContext = createContext();

const ANON_USER_ID = "00000000-0000-0000-0000-000000000001";

const defaultSettings = {
  businessName: "COAT&CURE PTY LTD",
  abn: "34695334742",
  qbcc: "15576833",
  address: "",
  bankName: "Ahmad Hussain Nazari Ibrahim",
  bsb: "064236",
  accountNumber: "10130392",
  logoDataUrl: logo,
  invoicePrefix: "INV-",
  quotePrefix: "QUO-",
  nextInvoiceNumber: 1,
  nextQuoteNumber: 1,
};

export function AppProvider({ children }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setDataState] = useState({
    settings: defaultSettings,
    invoices: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setDataLoading(true);
    const [{ data: settingsRow }, { data: invoiceRows }] = await Promise.all([
      supabase.from("settings").select("data").eq("user_id", ANON_USER_ID).single(),
      supabase.from("invoices").select("data, id, created_at").eq("user_id", ANON_USER_ID).order("created_at", { ascending: true }),
    ]);
    setDataState({
      settings: settingsRow?.data ?? defaultSettings,
      invoices: invoiceRows?.map(r => ({ ...r.data, _id: r.id })) ?? [],
    });
    setDataLoading(false);
  }

  async function setData(updaterOrValue) {
    setDataState(prev => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      if (next.settings !== prev.settings) {
        supabase
          .from("settings")
          .upsert({ user_id: ANON_USER_ID, data: next.settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
          .then(({ error }) => { if (error) console.error("Settings save error:", error); });
      }
      return next;
    });
  }

  async function saveInvoice(invoice, totals, pdfBase64 = null) {
    const isQuote = invoice.type === "Quote";

    const invoiceRecord = {
      ...invoice,
      total: totals.total,
      subtotal: totals.subtotal,
      gst: totals.gst,
      savedAt: new Date().toISOString(),
      ...(pdfBase64 ? { pdfBase64 } : {}),
    };

    const updatedSettings = {
      ...data.settings,
      nextInvoiceNumber: isQuote ? data.settings.nextInvoiceNumber : data.settings.nextInvoiceNumber + 1,
      nextQuoteNumber: isQuote ? data.settings.nextQuoteNumber + 1 : data.settings.nextQuoteNumber,
    };

    setDataState(prev => ({
      ...prev,
      settings: updatedSettings,
      invoices: [...prev.invoices, { ...invoiceRecord }],
    }));

    const { data: inserted, error: invoiceError } = await supabase
      .from("invoices")
      .insert({ user_id: ANON_USER_ID, data: invoiceRecord })
      .select("id")
      .single();

    if (invoiceError) {
      console.error("Invoice save error:", invoiceError);
    } else {
      setDataState(prev => {
        const invoices = [...prev.invoices];
        const idx = invoices.findIndex(i => i.savedAt === invoiceRecord.savedAt);
        if (idx !== -1) invoices[idx] = { ...invoices[idx], _id: inserted.id };
        return { ...prev, invoices };
      });
    }

    const { error: settingsError } = await supabase
      .from("settings")
      .upsert({ user_id: ANON_USER_ID, data: updatedSettings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (settingsError) console.error("Settings update error:", settingsError);
  }

  async function deleteInvoice(index) {
    const inv = data.invoices[index];
    if (inv._id) {
      const { error } = await supabase.from("invoices").delete().eq("id", inv._id);
      if (error) { console.error("Delete error:", error); return; }
    }
    setDataState(prev => ({
      ...prev,
      invoices: prev.invoices.filter((_, i) => i !== index),
    }));
  }

  if (dataLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f7" }}>
        <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Loading...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      data, setData,
      saveInvoice, deleteInvoice,
      dataLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}