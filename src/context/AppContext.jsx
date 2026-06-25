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
};

export function AppProvider({ children }) {
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [data, setDataState] = useState({
    settings: defaultSettings,
    invoices: [],
  });
  const [userId, setUserId] = useState(null);
  const [daysLeft, setDaysLeft] = useState(14);

  const loadedForUserRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const user = session?.user;

      if (!user) {
        resetLocalData();
        return;
      }

      setUserId(user.id);
      computeDaysLeft(user);

      if (loadedForUserRef.current !== user.id) {
        loadData(user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function resetLocalData() {
    loadedForUserRef.current = null;
    setUserId(null);
    setDataState({ settings: defaultSettings, invoices: [] });
    setDataLoading(false);
    setDataError(null);
  }

  function computeDaysLeft(user) {
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, 14 - diffDays));
  }

  async function loadData(id) {
    setDataLoading(true);
    setDataError(null);

    try {
      const settingsPromise = supabase
        .from("settings")
        .select("data")
        .eq("user_id", id)
        .maybeSingle();

      const invoicesPromise = supabase
        .from("invoices")
        .select("data, id, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      const [
        { data: settingsRow, error: settingsError },
        { data: invoiceRows, error: invoicesError },
      ] = await Promise.all([settingsPromise, invoicesPromise]);

      if (settingsError) throw settingsError;
      if (invoicesError) throw invoicesError;

      setDataState({
        settings: settingsRow?.data || defaultSettings,
        invoices:
          invoiceRows?.map((row) => ({
            ...row.data,
            _id: row.id,
          })) || [],
      });

      loadedForUserRef.current = id;
    } catch (error) {
      console.error("Load data error:", error);
      setDataError("Failed to load your account data.");
    } finally {
      setDataLoading(false);
    }
  }

  // Updates `data` locally only — does NOT persist to Supabase by itself. Used for
  // things like setting the logoUrl right after upload, where the actual persistence
  // happens separately via saveSettings() when the user clicks Save. Accepts either
  // a plain object or an updater function, same pattern as React's setState.
  function setData(updaterOrValue) {
    setDataState((prev) => {
      const next =
        typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      return next;
    });
  }

  async function saveSettings(settings) {
    if (!userId) return { error: "Not logged in." };

    const { error } = await supabase.from("settings").upsert(
      {
        user_id: userId,
        data: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Settings save error:", error);
      return { error: "Failed to save settings. Please try again." };
    }

    setDataState((prev) => ({ ...prev, settings }));
    return { error: null };
  }

  async function uploadLogo(file) {
    if (!userId) return { url: null, error: "Not logged in." };

    const ext = file.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Logo upload error:", error);
      return { url: null, error: "Failed to upload logo. Please try again." };
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    return { url: urlData.publicUrl, error: null };
  }

  async function saveInvoice(invoice, totals, pdfBase64 = null) {
    if (!userId) return { error: "Not logged in." };

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
      nextInvoiceNumber: isQuote
        ? data.settings.nextInvoiceNumber
        : data.settings.nextInvoiceNumber + 1,
      nextQuoteNumber: isQuote
        ? data.settings.nextQuoteNumber + 1
        : data.settings.nextQuoteNumber,
    };

    const { data: inserted, error: invoiceError } = await supabase
      .from("invoices")
      .insert({ user_id: userId, data: invoiceRecord })
      .select("id")
      .single();

    if (invoiceError) {
      console.error("Invoice save error:", invoiceError);
      return { error: "Failed to save invoice. Please try again." };
    }

    const { error: settingsError } = await supabase.from("settings").upsert(
      {
        user_id: userId,
        data: updatedSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (settingsError) {
      console.error("Settings update error:", settingsError);
    }

    setDataState((prev) => ({
      ...prev,
      settings: updatedSettings,
      invoices: [{ ...invoiceRecord, _id: inserted.id }, ...prev.invoices].slice(0, 50),
    }));

    return {
      error: null,
      id: inserted.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  async function updateInvoice(invoiceDbId, invoice, totals, pdfBase64 = null) {
    if (!userId) return { error: "Not logged in." };
    if (!invoiceDbId) return { error: "Missing invoice id — cannot update." };

    const existing = data.invoices.find((i) => i._id === invoiceDbId);

    const invoiceRecord = {
      ...invoice,
      total: totals.total,
      subtotal: totals.subtotal,
      gst: totals.gst,
      savedAt: existing?.savedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(pdfBase64
        ? { pdfBase64 }
        : existing?.pdfBase64
        ? { pdfBase64: existing.pdfBase64 }
        : {}),
    };

    const { error } = await supabase
      .from("invoices")
      .update({ data: invoiceRecord })
      .eq("id", invoiceDbId)
      .eq("user_id", userId);

    if (error) {
      console.error("Invoice update error:", error);
      return { error: "Failed to update invoice. Please try again." };
    }

    setDataState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) =>
        i._id === invoiceDbId ? { ...invoiceRecord, _id: invoiceDbId } : i
      ),
    }));

    return { error: null, invoiceNumber: invoice.invoiceNumber };
  }

  // Converts an approved Quote into a brand new Invoice WITHOUT deleting or overwriting
  // the original quote. The quote stays exactly as it was, just gets a `convertedToInvoiceId`
  // / `convertedToInvoiceNumber` pointer added to it. The new invoice gets a fresh INV- number
  // and a `convertedFromQuoteId` / `convertedFromQuoteNumber` pointer back to the quote.
  // This preserves full history — what was quoted, what it became — and lets you measure
  // quote-to-invoice conversion rate later since nothing is ever overwritten or deleted.
  async function convertQuoteToInvoice(quoteDbId, invoice, totals, pdfBase64 = null) {
    if (!userId) return { error: "Not logged in." };
    if (!quoteDbId) return { error: "Missing quote id — cannot convert." };

    const quote = data.invoices.find((i) => i._id === quoteDbId);
    if (!quote) return { error: "Could not find the original quote." };

    const newInvoiceNumber = `${data.settings.invoicePrefix || "INV-"}${data.settings.nextInvoiceNumber || 1}`;

    // The new invoice — same content as the quote (possibly edited by the user before
    // converting) but now typed as an Invoice, with its own number and a back-link.
    const invoiceRecord = {
      ...invoice,
      type: "Invoice",
      invoiceNumber: newInvoiceNumber,
      total: totals.total,
      subtotal: totals.subtotal,
      gst: totals.gst,
      savedAt: new Date().toISOString(),
      convertedFromQuoteId: quoteDbId,
      convertedFromQuoteNumber: quote.invoiceNumber,
      ...(pdfBase64 ? { pdfBase64 } : {}),
    };

    const updatedSettings = {
      ...data.settings,
      nextInvoiceNumber: data.settings.nextInvoiceNumber + 1,
    };

    // 1. Insert the new invoice as its own record
    const { data: inserted, error: insertError } = await supabase
      .from("invoices")
      .insert({ user_id: userId, data: invoiceRecord })
      .select("id")
      .single();

    if (insertError) {
      console.error("Convert (insert invoice) error:", insertError);
      return { error: "Failed to create the invoice. Please try again." };
    }

    // 2. Mark the original quote as converted — the quote itself is otherwise untouched
    const updatedQuoteRecord = { ...quote };
    delete updatedQuoteRecord._id; // strip helper field, it's not part of the stored `data` blob
    updatedQuoteRecord.convertedToInvoiceId = inserted.id;
    updatedQuoteRecord.convertedToInvoiceNumber = newInvoiceNumber;

    const { error: quoteUpdateError } = await supabase
      .from("invoices")
      .update({ data: updatedQuoteRecord })
      .eq("id", quoteDbId)
      .eq("user_id", userId);

    if (quoteUpdateError) {
      console.error("Convert (link quote) error:", quoteUpdateError);
      // Non-fatal — the invoice was already created successfully. The quote just won't
      // show the "converted to" badge in this case, but no data was lost.
    }

    // 3. Bump the invoice number counter in settings
    const { error: settingsError } = await supabase
      .from("settings")
      .upsert(
        { user_id: userId, data: updatedSettings, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (settingsError) console.error("Settings update error:", settingsError);

    setDataState((prev) => ({
      ...prev,
      settings: updatedSettings,
      invoices: [
        { ...invoiceRecord, _id: inserted.id },
        ...prev.invoices.map((i) =>
          i._id === quoteDbId ? { ...updatedQuoteRecord, _id: quoteDbId } : i
        ),
      ].slice(0, 50),
    }));

    return { error: null, id: inserted.id, invoiceNumber: newInvoiceNumber };
  }

  async function deleteInvoice(index) {
    const inv = data.invoices[index];

    if (inv?._id) {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", inv._id)
        .eq("user_id", userId);

      if (error) {
        console.error("Delete error:", error);
        return { error: "Failed to delete. Please try again." };
      }
    }

    setDataState((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((_, i) => i !== index),
    }));

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    resetLocalData();
  }

  const value = {
    data,
    setData,
    saveInvoice,
    updateInvoice,
    convertQuoteToInvoice,
    deleteInvoice,
    saveSettings,
    uploadLogo,
    signOut,
    userId,
    daysLeft,
    dataLoading,
    dataError,
    reloadData: () => userId && loadData(userId),
  };

  return (
    <AppContext.Provider value={value}>
      {userId && dataLoading ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f7f7",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #ebebeb",
              borderTopColor: "#111",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: "#aaa", fontSize: "0.875rem" }}>
            Loading your account...
          </p>
        </div>
      ) : dataError ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f7f7",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #ebebeb",
              borderRadius: 14,
              padding: 32,
              maxWidth: 400,
              width: "100%",
              textAlign: "center",
              fontFamily: "system-ui",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#111",
                marginBottom: 8,
              }}
            >
              Something went wrong
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#888",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              {dataError}
            </p>
            <button
              onClick={() => userId && loadData(userId)}
              style={{
                padding: "10px 24px",
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "system-ui",
              }}
            >
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