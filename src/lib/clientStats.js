// Per-client invoice stats and per-client invoice lists, derived entirely
// from AppContext's already-loaded `data.invoices` — no network request at
// all, for either the summary table or the per-client modal.
//
// This replaces an earlier version of this file that called a
// get_client_invoice_stats() RPC and a separate `invoices` query on every
// Clients-page visit/modal-open (with a 60s TTL cache layered on top). That
// was solving the wrong problem: AppContext already fetches the same
// invoices table at startup (capped at the 50 most recent, same as
// Dashboard/Invoices), so re-querying Postgres for a summary of data
// already sitting in memory was a pure network round-trip with nothing to
// show for it once it landed. Computing it here instead means:
//   - zero extra requests, on first visit or repeat visit
//   - stats are always exactly in sync with the latest invoice mutation,
//     with no cache/TTL/invalidation logic needed at all
//   - Clients' numbers now reflect the same 50-most-recent window as
//     Dashboard/Invoices, instead of a separate, uncapped server-side view
//     that could silently disagree with them for accounts with more than
//     50 total invoices/quotes (a known, pre-existing limitation shared by
//     every other page in the app — see CLAUDE.md's "50 rows" note).
//
// The get_client_invoice_stats() Postgres function itself is left in place
// (unused by the frontend now) rather than dropped — removing it isn't
// required to fix this, and doing so would need a migration this change
// doesn't call for.

// Mirrors get_client_invoice_stats()'s exact semantics: invoiceCount counts
// every linked record (invoices AND quotes); totalBilled sums `total` only
// for non-Quote records.
export function computeClientInvoiceStats(invoices) {
  const byClientId = new Map();
  for (const inv of invoices) {
    if (!inv.clientId) continue;
    const entry = byClientId.get(inv.clientId) || { invoiceCount: 0, totalBilled: 0 };
    entry.invoiceCount += 1;
    if (inv.type !== "Quote") entry.totalBilled += inv.total || 0;
    byClientId.set(inv.clientId, entry);
  }
  return byClientId;
}

export function getInvoicesForClient(invoices, clientId) {
  return invoices
    .filter((inv) => inv.clientId === clientId)
    .sort((a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date));
}
