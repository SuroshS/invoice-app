import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAppInit } from "./AppInitProvider";
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from "../lib/policyVersions";

const AppContext = createContext();

const defaultSettings = {
  fullName: "",
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
    localStorage.setItem(cacheKey(userId), JSON.stringify(data));
  } catch { /* storage full — silently skip */ }
}

// Pure data provider: owns settings/invoices CRUD, the local cache, and
// subscription status (subscriptionActive lives inside the settings row).
// It has no opinion about what to render while data isn't ready yet — that
// decision belongs to AuthGate, which reads `hasInitialData` from here
// alongside the auth status from AppInitProvider. This file never touches
// supabase.auth itself — it only reacts to the auth state AppInitProvider
// resolves, so there's exactly one place in the app deciding who's signed in.
export function AppProvider({ children }) {
  const { status: authStatus, userId, user, trialExpired } = useAppInit();

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [data, setDataState] = useState({
    settings: defaultSettings,
    invoices: [],
    clients: [],
  });
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  const loadedForUserRef = useRef(null);
  const isReadOnly = trialExpired && !subscriptionActive;

  const resetLocalData = useCallback(() => {
    loadedForUserRef.current = null;
    setDataState({ settings: defaultSettings, invoices: [], clients: [] });
    setDataLoading(false);
    setDataError(null);
    setSubscriptionActive(false);
    setHasInitialData(false);
  }, []);

  const loadData = useCallback(async (id) => {
    // Load this specific user's cached data instantly — completely safe because
    // the cache key includes the user ID so it can never return another user's
    // data. This alone is enough to mark startup data as "ready": AuthGate can
    // stop showing the branded loading screen and render real (if possibly a
    // little stale) data instead of empty placeholders.
    const cached = readCache(id);
    if (cached) {
      // Older cached blobs (written before the clients feature existed)
      // won't have a `clients` key — default it so data.clients is always
      // an array, never undefined.
      setDataState({ clients: [], ...cached });
      setSubscriptionActive(cached.settings?.subscriptionActive === true);
      loadedForUserRef.current = id;
      setHasInitialData(true);
    }

    // Always fetch fresh from Supabase — cache is only for the instant first
    // paint, this keeps it correct in the background (or, if there was no
    // cache, this is what startup is actually waiting on).
    setDataLoading(true);
    setDataError(null);

    try {
      const [
        { data: settingsRow, error: settingsError },
        { data: invoiceRows, error: invoicesError },
        { data: clientRows, error: clientsError },
      ] = await Promise.all([
        supabase.from("settings").select("data").eq("user_id", id).maybeSingle(),
        supabase.from("invoices").select("data, id, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
        // Clients are one row per client (not per invoice), so — unlike
        // invoices — there's no need to cap this; loading the full roster
        // up front is what makes the CreateInvoice client picker instant.
        supabase.from("clients").select("*").eq("user_id", id).order("name"),
      ]);

      if (settingsError) throw settingsError;
      if (invoicesError) throw invoicesError;
      // Not a hard failure like settings/invoices — if the `clients` table
      // migration hasn't been applied yet (or RLS isn't set up on it), the
      // rest of the app should still load normally; the client picker and
      // Clients page just show an empty roster instead of taking the whole
      // app down.
      if (clientsError) console.error("Load clients error:", clientsError);

      let loadedSettings = settingsRow?.data;

      if (!loadedSettings) {
        // No settings row exists yet — this is this user's first ever
        // authenticated login. Create it now (not at signup, where there's
        // no session yet) so the insert runs as a normal auth.uid()-scoped
        // write instead of needing an unauthenticated-write RLS carve-out.
        // The terms-acceptance timestamp/version travelled here as auth
        // user_metadata (set at signup, read from the real session object).
        const metadata = user?.user_metadata || {};
        loadedSettings = {
          ...defaultSettings,
          fullName: metadata.full_name || "",
          termsAcceptedAt: metadata.terms_accepted_at || new Date().toISOString(),
          policyVersions: metadata.policy_versions || { terms: CURRENT_TERMS_VERSION, privacy: CURRENT_PRIVACY_VERSION },
        };
        const { error: seedError } = await supabase.from("settings").upsert(
          { user_id: id, data: loadedSettings, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        if (seedError) console.error("Failed to create initial settings row:", seedError);
      }

      setSubscriptionActive(loadedSettings.subscriptionActive === true);

      const freshData = {
        settings: loadedSettings,
        invoices: invoiceRows?.map((row) => ({ ...row.data, _id: row.id })) || [],
        clients: clientRows || [],
      };

      setDataState(freshData);
      writeCache(id, freshData);
      loadedForUserRef.current = id;
      setHasInitialData(true);
    } catch (error) {
      console.error("Load data error:", error);
      // Only a hard failure if there's no cache to fall back on — if cached
      // data is already showing, this is a silent background-refresh failure,
      // not something that should interrupt the user.
      if (!cached) setDataError("Failed to load your account data.");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Reacts to the single auth source of truth (AppInitProvider) instead of
  // running its own supabase.auth listener. Guarded by loadedForUserRef so a
  // token-refresh event for the same user doesn't re-trigger a fetch.
  useEffect(() => {
    if (authStatus === "authenticated" && userId) {
      if (loadedForUserRef.current !== userId) loadData(userId);
    } else if (authStatus === "signed-out") {
      resetLocalData();
    }
    // "initializing" and "error" — nothing to do yet, still waiting.
  }, [authStatus, userId, loadData, resetLocalData]);

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
    writeCache(userId, { settings, invoices: data.invoices, clients: data.clients });
    return { error: null };
  }

  // Creates a new client record (used by CreateInvoice's "new client" flow)
  // and adds it to local state/cache so it shows up immediately in the
  // picker and the Clients page without waiting on a refetch.
  async function createClient({ name, email, phone, address }) {
    if (!userId) return { client: null, error: "Not logged in." };
    const trimmedName = (name || "").trim();
    if (!trimmedName) return { client: null, error: "Client name is required." };
    const { data: inserted, error } = await supabase
      .from("clients")
      .insert({ user_id: userId, name: trimmedName, email: email || null, phone: phone || null, address: address || null })
      .select("*")
      .single();
    if (error) { console.error("Create client error:", error); return { client: null, error: "Failed to save this client. Please try again." }; }
    const newClients = [...data.clients, inserted].sort((a, b) => a.name.localeCompare(b.name));
    setDataState((prev) => ({ ...prev, clients: newClients }));
    writeCache(userId, { settings: data.settings, invoices: data.invoices, clients: newClients });
    return { client: inserted, error: null };
  }

  async function uploadLogo(file) {
    if (!userId) return { url: null, error: "Not logged in." };
    if (!file.type.startsWith("image/")) return { url: null, error: "Please choose an image file." };
    if (file.size > 5 * 1024 * 1024) return { url: null, error: "Logo must be smaller than 5MB." };
    const ext = file.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { console.error("Logo upload error:", error); return { url: null, error: "Failed to upload logo. Please try again." }; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    return { url: urlData.publicUrl, error: null };
  }

  async function saveInvoice(invoice, totals) {
    if (!userId) return { error: "Not logged in." };
    const isQuote = invoice.type === "Quote";
    const invoiceRecord = {
      ...invoice, total: totals.total, subtotal: totals.subtotal, gst: totals.gst,
      savedAt: new Date().toISOString(),
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
    writeCache(userId, { settings: updatedSettings, invoices: newInvoices, clients: data.clients });
    return { error: null, id: inserted.id, invoiceNumber: invoice.invoiceNumber };
  }

  async function updateInvoice(invoiceDbId, invoice, totals) {
    if (!userId) return { error: "Not logged in." };
    if (!invoiceDbId) return { error: "Missing invoice id — cannot update." };
    const existing = data.invoices.find((i) => i._id === invoiceDbId);
    const invoiceRecord = {
      ...invoice, total: totals.total, subtotal: totals.subtotal, gst: totals.gst,
      savedAt: existing?.savedAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from("invoices").update({ data: invoiceRecord }).eq("id", invoiceDbId).eq("user_id", userId);
    if (error) { console.error("Invoice update error:", error); return { error: "Failed to update invoice. Please try again." }; }
    const newInvoices = data.invoices.map((i) => i._id === invoiceDbId ? { ...invoiceRecord, _id: invoiceDbId } : i);
    setDataState((prev) => ({ ...prev, invoices: newInvoices }));
    writeCache(userId, { settings: data.settings, invoices: newInvoices, clients: data.clients });
    return { error: null, invoiceNumber: invoice.invoiceNumber };
  }

  async function convertQuoteToInvoice(quoteDbId, invoice, totals) {
    if (!userId) return { error: "Not logged in." };
    if (!quoteDbId) return { error: "Missing quote id — cannot convert." };
    const quote = data.invoices.find((i) => i._id === quoteDbId);
    if (!quote) return { error: "Could not find the original quote." };
    const newInvoiceNumber = `${data.settings.invoicePrefix || "INV-"}${data.settings.nextInvoiceNumber || 1}`;
    const invoiceRecord = {
      ...invoice, type: "Invoice", invoiceNumber: newInvoiceNumber,
      total: totals.total, subtotal: totals.subtotal, gst: totals.gst,
      savedAt: new Date().toISOString(), convertedFromQuoteId: quoteDbId,
      convertedFromQuoteNumber: quote.invoiceNumber,
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
    writeCache(userId, { settings: updatedSettings, invoices: newInvoices, clients: data.clients });
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
    writeCache(userId, { settings: data.settings, invoices: newInvoices, clients: data.clients });
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    // AppInitProvider's auth listener will also fire and drive the same reset
    // via the effect above — this direct call just makes it instant instead
    // of waiting on that async round-trip.
    resetLocalData();
  }

  const value = useMemo(() => ({
    data, setData, saveInvoice, updateInvoice, convertQuoteToInvoice,
    deleteInvoice, saveSettings, uploadLogo, createClient, signOut,
    userId, dataLoading, dataError, hasInitialData,
    reloadData: () => userId && loadData(userId),
    isReadOnly, subscriptionActive, trialExpired,
    // saveInvoice/updateInvoice/convertQuoteToInvoice/deleteInvoice/saveSettings/
    // uploadLogo/createClient/signOut are plain functions recreated every
    // render, but they only close over data/userId/subscriptionActive — all
    // already listed below — so whenever any of those actually change, this
    // memo recomputes and picks up fresh references from that same render.
    // Adding the functions themselves here would defeat the memo (new
    // identity every render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, userId, dataLoading, dataError, hasInitialData, isReadOnly, subscriptionActive, trialExpired, loadData]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
