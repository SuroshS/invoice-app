import { supabase } from "./supabase";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Calls the send-invoice-email Edge Function the same way Layout.jsx's
// billing-portal call does — a direct fetch() using the current session's
// access_token, not routed through AppContext, matching how the existing
// Stripe calls are also made directly from the component that needs them.
export async function sendInvoiceEmail({ invoiceId, to, subject, message, pdfBlob, filename }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expired — please sign in again." };

  let pdfBase64;
  try {
    pdfBase64 = await blobToBase64(pdfBlob);
  } catch (e) {
    console.error("PDF encode error:", e);
    return { error: "Could not prepare the PDF attachment." };
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invoice-email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId, to, subject, message, pdfBase64, filename }),
      }
    );
    const responseJson = await res.json().catch(() => ({}));
    if (!res.ok || responseJson.error) {
      return { error: responseJson.error || "Failed to send email. Please try again." };
    }
    return { error: null };
  } catch (e) {
    console.error("Send invoice email error:", e);
    return { error: "Something went wrong. Please try again." };
  }
}
