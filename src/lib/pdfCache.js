// In-memory, self-invalidating cache for generated invoice/quote PDF output
// (the react-pdf blob, and separately the rasterized preview pages), used by
// Invoices.jsx and Clients.jsx for already-saved records.
//
// Deliberately NOT used by CreateInvoice.jsx — that page previews a
// live-editing draft whose content can change on every keystroke, so a
// fresh render on every Preview click there is correct behaviour, not a
// bug to fix.
//
// Cache key is derived from values, not object identity, so it stays
// correct across AppContext's normal reference churn (a new `data.settings`
// object on every save doesn't matter — only the fields that actually
// appear on the PDF do) and is a guaranteed miss the moment either the
// invoice or the settings fields that render onto the PDF actually change
// (updateInvoice always bumps `updatedAt`).
const MAX_ENTRIES = 30;
const cacheStore = new Map(); // key -> { blob, pages }

function keyFor(invoice, settings) {
  return [
    invoice._id || invoice.invoiceNumber || "",
    invoice.savedAt || "",
    invoice.updatedAt || "",
    settings?.businessName || "",
    settings?.logoUrl || "",
    settings?.abn || "",
    settings?.qbcc || "",
    settings?.address || "",
    settings?.bankName || "",
    settings?.bsb || "",
    settings?.accountNumber || "",
    settings?.invoiceTerms || "",
    settings?.quoteTerms || "",
  ].join("|");
}

function touch(key, entry) {
  cacheStore.delete(key);
  cacheStore.set(key, entry);
  if (cacheStore.size > MAX_ENTRIES) {
    cacheStore.delete(cacheStore.keys().next().value);
  }
}

// Returns the cached blob if this exact invoice+settings combination was
// already generated; otherwise calls generateBlob() once and caches it.
export async function getInvoicePdfBlob(invoice, settings, generateBlob) {
  const key = keyFor(invoice, settings);
  const existing = cacheStore.get(key);
  if (existing?.blob) {
    touch(key, existing);
    return existing.blob;
  }
  const blob = await generateBlob();
  const entry = { ...(existing || {}), blob };
  touch(key, entry);
  return blob;
}

// Returns cached rasterized pages if present; otherwise reuses a cached
// blob if one exists (skipping the react-pdf render step) or generates one,
// then rasterizes and caches the result.
export async function getInvoicePdfPages(invoice, settings, generateBlob, rasterize) {
  const key = keyFor(invoice, settings);
  const existing = cacheStore.get(key);
  if (existing?.pages) {
    touch(key, existing);
    return existing.pages;
  }
  const blob = existing?.blob || (await generateBlob());
  const pages = await rasterize(blob);
  touch(key, { blob, pages });
  return pages;
}

// Called on sign-out for hygiene — clears every cached PDF regardless of
// user (invoice `_id`s are DB-generated UUIDs, effectively unique across
// accounts too, so this is defense-in-depth rather than a fix for a
// realistic collision).
export function clearInvoicePdfCache() {
  cacheStore.clear();
}
