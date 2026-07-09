import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  invoiceTerms: "",
  quoteTerms: "",
};

const TRIAL_DAYS = 14;

// Cache is keyed by user ID — a different user gets a completely different
// cache entry so their data never bleeds into another user's session.
function cacheKey(userId) { return `payvle_data_${userId}`; }

function readCache(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeCache(userId, data) {
  if (!userId) return;
  try {
    // Strip pdfBase64 blobs — they're large and not needed for the initial render
    const lean = {
      settings: data.settings,
      invoices: data.invoices.map(({ pdfBase64: _, ...rest }) => rest),
    };
    localStorage.setItem(cacheKey(userId), JSON.stringify(lean));
  } catch { /* storage full — silently skip */ }
}

export function AppProvider({ children }) {
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [data, setDataState] = useState({
    settings: defaultSettings,
    invoices: [],
  });
  const [userId, setUserId] = useState(null);
  const [daysLeft, setDaysLeft] = useState(TRIAL_DAYS);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  const loadedForUserRef = useRef(null);
  const isReadOnly = trialExpired && !subscriptionActive;

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setUserId(session.user.id);
        computeDaysLeft(session.user);
        loadData(session.user.id);
      } else {
        resetLocalData();
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      if (!user) { resetLocalData(); return; }
      setUserId(user.id);
      computeDaysLeft(user);
      if (loadedForUserRef.current !== user.id) loadData(user.id);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  function resetLocalData() {
    loadedForUserRef.current = null;
    setUserId(null);
    setDataState({ settings: defaultSettings, invoices: [] });
    setDataLoading(false);
    setDataError(null);
    setSubscriptionActive(false);
    setTrialExpired(false);
  }

  function computeDaysLeft(user) {
    const diffDays = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, TRIAL_DAYS - diffDays));
    setTrialExpired(diffDays >= TRIAL_DAYS);
  }

  async function loadData(id) {
    // Load this specific user's cached data instantly — completely safe because
    // the cache key includes the user ID so it can never return another user's data.
    const cached = readCache(id);
    if (cached) {
      setDataState(cached);
      setSubscriptionActive(cached.settings?.subscriptionActive === true);
      loadedForUserRef.current = id;
    }

    // Always fetch fresh from Supabase — cache is only for the initial render
    setDataLoading(true);
    setDataError(null);

    try {
      const [
        { data: settingsRow, error: settingsError },
        { data: invoiceRows, error: invoicesError },
      ] = await Promise.all([
        supabase.from("settings").select("data").eq("user_id", id).maybeSingle(),
        supabase.from("invoices").select("data, id, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
      ]);

      if (settingsError) throw settingsError;
      if (invoicesError) throw invoicesError;

      const loadedSettings = settingsRow?.data || defaultSettings;
      setSubscriptionActive(loadedSettings.subscriptionActive === true);

      const freshData = {
        settings: loadedSettings,
        invoices: invoiceRows?.map((row) => ({ ...row.data, _id: row.id })) || [],
      };

      setDataState(freshData);
      writeCache(id, freshData);
      loadedForUserRef.current = id;
    } catch (error) {
      console.error("Load data error:", error);
      // Only show the hard error screen if there's no cached data to fall back on
      if (!cached) setDataError("Failed to load your account data.");
    } finally {
      setDataLoading(false);
    }
  }

  function setData(updaterOrValue) {
    setDataState((prev) => typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue);
  }

  async function saveSettings(settings) {
    if (!userId) return { error: "Not logged in." };
    const { error } = await supabase.from("settings").upsert(
      { user_id: userId, data: settings, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) { console.error("Settings save error:", error); return { error: "Failed to save settings. Please try again." }; }
    setDataState((prev) => ({ ...prev, settings }));
    setSubscriptionActive(settings.subscriptionActive === true);
    writeCache(userId, { settings, invoices: data.invoices });
    return { error: null };
  }

  async function uploadLogo(file) {
    if (!userId) return { url: null, error: "Not logged in." };
    const ext = file.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { console.error("Logo upload error:", error); return { url: null, error: "Failed to upload logo. Please try again." }; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    return { url: urlData.publicUrl, error: null };
  }

  async function saveInvoice(invoice, totals, pdfBase64 = null) {
    if (!userId) return { error: "Not logged in." };
    const isQuote = invoice.type === "Quote";
    const invoiceRecord = {
      ...invoice, total: totals.total, subtotal: totals.subtotal, gst: totals.gst,
      savedAt: new Date().toISOString(), ...(pdfBase64 ? { pdfBase64 } : {}),
    };
    const updatedSettings = {
      ...data.settings,
      nextInvoiceNumber: isQuote ? data.settings.nextInvoiceNumber : data.settings.nextInvoiceNumber + 1,
      nextQuoteNumber: isQuote ? data.settings.nextQuoteNumber + 1 : data.settings.nextQuoteNumber,
    };
    const { data: inserted, error: invoiceError } = await supabase.from("invoices").insert({ user_id: userId, data: invoiceRecord }).select("id").single();
    if (invoiceError) { console.error("Invoice save error:", invoiceError); return { error: "Failed to save invoice. Please try again." }; }
    const { error: settingsError } = await supabase.from("settings").upsert({ user_id: userId, data: updatedSettings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (settingsError) console.error("Settings update error:", settingsError);
    const newInvoices = [{ ...invoiceRecord, _id: inserted.id }, ...data.invoices].slice(0, 50);
    setDataState((prev) => ({ ...prev, settings: updatedSettings, invoices: newInvoices }));
    writeCache(userId, { settings: updatedSettings, invoices: newInvoices });
    return { error: null, id: inserted.id, invoiceNumber: invoice.invoiceNumber };
  }

  async function updateInvoice(invoiceDbId, invoice, totals, pdfBase64 = null) {
    if (!userId) return { error: "Not logged in." };
    if (!invoiceDbId) return { error: "Missing invoice id — cannot update." };
    const existing = data.invoices.find((i) => i._id === invoiceDbId);
    const invoiceRecord = {
      ...invoice, total: totals.total, subtotal: totals.subtotal, gst: totals.gst,
      savedAt: existing?.savedAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      ...(pdfBase64 ? { pdfBase64 } : existing?.pdfBase64 ? { pdfBase64: existing.pdfBase64 } : {}),
    };
    const { error } = await supabase.from("invoices").update({ data: invoiceRecord }).eq("id", invoiceDbId).eq("user_id", userId);
    if (error) { console.error("Invoice update error:", error); return { error: "Failed to update invoice. Please try again." }; }
    const newInvoices = data.invoices.map((i) => i._id === invoiceDbId ? { ...invoiceRecord, _id: invoiceDbId } : i);
    setDataState((prev) => ({ ...prev, invoices: newInvoices }));
    writeCache(userId, { settings: data.settings, invoices: newInvoices });
    return { error: null, invoiceNumber: invoice.invoiceNumber };
  }

  async function convertQuoteToInvoice(quoteDbId, invoice, totals, pdfBase64 = null) {
    if (!userId) return { error: "Not logged in." };
    if (!quoteDbId) return { error: "Missing quote id — cannot convert." };
    const quote = data.invoices.find((i) => i._id === quoteDbId);
    if (!quote) return { error: "Could not find the original quote." };
    const newInvoiceNumber = `${data.settings.invoicePrefix || "INV-"}${data.settings.nextInvoiceNumber || 1}`;
    const invoiceRecord = {
      ...invoice, type: "Invoice", invoiceNumber: newInvoiceNumber,
      total: totals.total, subtotal: totals.subtotal, gst: totals.gst,
      savedAt: new Date().toISOString(), convertedFromQuoteId: quoteDbId,
      convertedFromQuoteNumber: quote.invoiceNumber, ...(pdfBase64 ? { pdfBase64 } : {}),
    };
    const updatedSettings = { ...data.settings, nextInvoiceNumber: data.settings.nextInvoiceNumber + 1 };
    const { data: inserted, error: insertError } = await supabase.from("invoices").insert({ user_id: userId, data: invoiceRecord }).select("id").single();
    if (insertError) { console.error("Convert error:", insertError); return { error: "Failed to create the invoice. Please try again." }; }
    const updatedQuoteRecord = { ...quote };
    delete updatedQuoteRecord._id;
    updatedQuoteRecord.convertedToInvoiceId = inserted.id;
    updatedQuoteRecord.convertedToInvoiceNumber = newInvoiceNumber;
    const { error: quoteUpdateError } = await supabase.from("invoices").update({ data: updatedQuoteRecord }).eq("id", quoteDbId).eq("user_id", userId);
    if (quoteUpdateError) console.error("Convert (link quote) error:", quoteUpdateError);
    const { error: settingsError } = await supabase.from("settings").upsert({ user_id: userId, data: updatedSettings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (settingsError) console.error("Settings update error:", settingsError);
    const newInvoices = [
      { ...invoiceRecord, _id: inserted.id },
      ...data.invoices.map((i) => i._id === quoteDbId ? { ...updatedQuoteRecord, _id: quoteDbId } : i),
    ].slice(0, 50);
    setDataState((prev) => ({ ...prev, settings: updatedSettings, invoices: newInvoices }));
    writeCache(userId, { settings: updatedSettings, invoices: newInvoices });
    return { error: null, id: inserted.id, invoiceNumber: newInvoiceNumber };
  }

  async function deleteInvoice(index) {
    const inv = data.invoices[index];
    if (inv?._id) {
      const { error } = await supabase.from("invoices").delete().eq("id", inv._id).eq("user_id", userId);
      if (error) { console.error("Delete error:", error); return { error: "Failed to delete. Please try again." }; }
    }
    const newInvoices = data.invoices.filter((_, i) => i !== index);
    setDataState((prev) => ({ ...prev, invoices: newInvoices }));
    writeCache(userId, { settings: data.settings, invoices: newInvoices });
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    resetLocalData();
  }

  const value = {
    data, setData, saveInvoice, updateInvoice, convertQuoteToInvoice,
    deleteInvoice, saveSettings, uploadLogo, signOut,
    userId, daysLeft, dataLoading, dataError,
    reloadData: () => userId && loadData(userId),
    isReadOnly, subscriptionActive, trialExpired,
  };

  return (
    <AppContext.Provider value={value}>
      {dataError && !readCache(userId) ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f7", padding: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: 14, padding: 32, maxWidth: 400, width: "100%", textAlign: "center", fontFamily: "system-ui" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111", marginBottom: 8 }}>Something went wrong</p>
            <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: 24, lineHeight: 1.6 }}>{dataError}</p>
            <button onClick={() => userId && loadData(userId)} style={{ padding: "10px 24px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", fontFamily: "system-ui" }}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}