import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AppContext = createContext();

const defaultSettings = {
  businessName: "",
  abn: "",
  qbcc: "",
  address: "",
  bankName: "",
  bsb: "",
  accountNumber: "",
  logoUrl: null,
  invoicePrefix: "INV-",
  quotePrefix: "QUO-",
  nextInvoiceNumber: 1,
  nextQuoteNumber: 1,
};

function getCurrentUser() {
  try {
    const stored = sessionStorage.getItem("app_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setDataState] = useState({ settings: defaultSettings, invoices: [] });

  // Track userId in state so changes trigger re-renders and useEffect
  const [userId, setUserId] = useState(() => getCurrentUser()?.userId ?? null);

  // Poll sessionStorage for login — catches when AuthGate sets the session
  useEffect(() => {
    function checkSession() {
      const user = getCurrentUser();
      const id = user?.userId ?? null;
      setUserId(prev => prev !== id ? id : prev);
    }

    // Check immediately and on storage events
    checkSession();
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, []);

  useEffect(() => {
    if (userId) {
      loadData(userId);
    } else {
      setDataLoading(false);
    }
  }, [userId]);

  async function loadData(id) {
    setDataLoading(true);
    try {
      const [{ data: settingsRow }, { data: invoiceRows }] = await Promise.all([
        supabase.from("settings").select("data").eq("user_id", id).single(),
        supabase.from("invoices").select("data, id, created_at").eq("user_id", id).order("created_at", { ascending: true }),
      ]);
      setDataState({
        settings: settingsRow?.data ?? defaultSettings,
        invoices: invoiceRows?.map(r => ({ ...r.data, _id: r.id })) ?? [],
      });
    } catch (e) {
      console.error("Load data error:", e);
      setDataState({ settings: defaultSettings, invoices: [] });
    }
    setDataLoading(false);
  }

  async function setData(updaterOrValue) {
    setDataState(prev => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      if (next.settings !== prev.settings && userId) {
        supabase
          .from("settings")
          .upsert({ user_id: userId, data: next.settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
          .then(({ error }) => { if (error) console.error("Settings save error:", error); });
      }
      return next;
    });
  }

  async function uploadLogo(file) {
    const ext = file.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });
    if (error) { console.error("Logo upload error:", error); return null; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function saveInvoice(invoice, totals, pdfBase64 = null) {
    if (!userId) return;
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
      .insert({ user_id: userId, data: invoiceRecord })
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
      .upsert({ user_id: userId, data: updatedSettings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
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
    <AppContext.Provider value={{ data, setData, saveInvoice, deleteInvoice, uploadLogo, dataLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}