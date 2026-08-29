// supabase/functions/send-invoice-email/index.ts
//
// Backend for the send-invoice/quote-email UI prototype (see
// src/pages/Invoices.jsx, src/components/SendEmailComposer.jsx). Sends the
// invoice/quote PDF (generated client-side and passed in as base64 — this
// app has no server-side PDF renderer, see CLAUDE.md) as an email attachment
// via SMTP.
//
// SMTP credentials are Edge Function secrets already configured in the
// Supabase dashboard — read only via Deno.env.get(), never hardcoded here:
//   SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD,
//   SMTP_FROM_EMAIL, SMTP_FROM_NAME
//
// Deploy with: supabase functions deploy send-invoice-email

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Temporary UI-prototype allowlist — mirrors src/lib/featureGates.js
// exactly. Edge Functions are deployed independently of the frontend build
// (their own directory, no shared import across the two runtimes), so these
// two lists have to be kept in sync by hand until a real
// settings.data.features flag replaces both.
const EMAIL_SENDING_BETA_USER_IDS = [
  "d02041e7-e45d-4095-a729-9fe693691731",
  "409fb9a8-3a1c-4fe7-82ad-faa3a32ee496",
];

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // 1. Verify the caller's bearer token — same manual verification pattern
    // as create-checkout-session/create-portal-session (this function is
    // also deployed with verify_jwt = false, see config.toml).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header." }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey },
    });
    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error("Auth verification failed:", errText);
      return json({ error: "Not authenticated." }, 401);
    }
    const user = await userRes.json();
    if (!user?.id) return json({ error: "Not authenticated." }, 401);

    // 2. Beta gate, enforced server-side too — a valid session token for any
    // other account must not be able to trigger a send just because the
    // frontend button happens to be hidden for them.
    if (!EMAIL_SENDING_BETA_USER_IDS.includes(user.id)) {
      return json({ error: "This feature is not enabled for your account." }, 403);
    }

    // 3. Parse + validate the request body.
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }
    const { invoiceId, to, subject, message, pdfBase64, filename } = body || {};

    if (!invoiceId || typeof invoiceId !== "string") {
      return json({ error: "Missing invoiceId." }, 400);
    }
    if (!isValidEmail(to)) {
      return json({ error: "A valid recipient email is required." }, 400);
    }
    if (!subject || typeof subject !== "string" || !message || typeof message !== "string") {
      return json({ error: "Subject and message are required." }, 400);
    }
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return json({ error: "Missing PDF attachment." }, 400);
    }

    // 4. Confirm the invoice actually belongs to the verified caller before
    // sending anything — never trust invoiceId alone. RLS doesn't apply
    // here since this query runs with the service-role client, so the
    // user_id scoping below is the only thing standing between this
    // function and sending on behalf of someone else's record.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: invoiceRow, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (invoiceError) {
      console.error("Invoice lookup error:", invoiceError);
      return json({ error: "Could not verify this invoice." }, 500);
    }
    if (!invoiceRow) {
      return json({ error: "Invoice not found." }, 404);
    }

    // 5. Send via SMTP using the pre-configured secrets.
    const smtpHost = Deno.env.get("SMTP_HOST")!;
    const smtpPort = Number(Deno.env.get("SMTP_PORT") || "587");
    const smtpUsername = Deno.env.get("SMTP_USERNAME")!;
    const smtpPassword = Deno.env.get("SMTP_PASSWORD")!;
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL")!;
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "";

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        // Implicit TLS on 465; STARTTLS is negotiated automatically on the
        // usual submission ports (587/25) when tls is left false.
        tls: smtpPort === 465,
        auth: { username: smtpUsername, password: smtpPassword },
      },
    });

    try {
      await client.send({
        from: smtpFromName ? `${smtpFromName} <${smtpFromEmail}>` : smtpFromEmail,
        to,
        subject,
        content: message,
        attachments: [
          {
            filename: (typeof filename === "string" && filename) || "document.pdf",
            contentType: "application/pdf",
            content: pdfBase64,
            encoding: "base64",
          },
        ],
      });
    } finally {
      await client.close();
    }

    return json({ success: true });
  } catch (err) {
    console.error("send-invoice-email error:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
