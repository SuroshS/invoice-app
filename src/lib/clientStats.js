import { supabase } from "./supabase";

// One row per client (invoiceCount/totalBilled), computed by Postgres via
// the get_client_invoice_stats() function — see the migration of the same
// name. No caching: the aggregate is cheap enough on its own that fetching
// it fresh every time is faster than fetching+summing every invoice ever
// created, which is what this replaced.
export async function fetchClientInvoiceStats() {
  const { data, error } = await supabase.rpc("get_client_invoice_stats");
  if (error) throw error;
  const byClientId = new Map();
  for (const row of data || []) {
    byClientId.set(row.client_id, {
      invoiceCount: Number(row.invoice_count) || 0,
      totalBilled: Number(row.total_billed) || 0,
    });
  }
  return byClientId;
}

// A single client's actual invoice/quote records, fetched only when their
// popup is opened (see Clients.jsx) — not needed for the summary table
// itself, so there's no reason to load it up front for every client.
export async function fetchInvoicesForClient(userId, clientId) {
  const { data: rows, error } = await supabase
    .from("invoices")
    .select("id, data")
    .eq("user_id", userId)
    .eq("data->>clientId", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return rows?.map((row) => ({ ...row.data, _id: row.id })) || [];
}
