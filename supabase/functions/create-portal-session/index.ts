// supabase/functions/create-portal-session/index.ts
//
// Creates a Stripe Customer Portal session for the authenticated user so they
// can update their card, download receipts, or cancel their subscription —
// all hosted by Stripe, no card data ever touches your app.
//
// Deploy with: supabase functions deploy create-portal-session --no-verify-jwt
//
// No extra secrets needed — uses STRIPE_SECRET_KEY already set.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // 1. Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header." }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey },
    });

    if (!userRes.ok) return json({ error: "Not authenticated." }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: "Not authenticated." }, 401);

    // 2. Get the user's Stripe customer ID from their settings row
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/settings?user_id=eq.${user.id}&select=data`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    const rows = settingsRes.ok ? await settingsRes.json() : [];
    const stripeCustomerId = rows?.[0]?.data?.stripeCustomerId;

    if (!stripeCustomerId) {
      return json({ error: "No subscription found. Please subscribe first." }, 400);
    }

    // 3. Create the portal session
    const origin = req.headers.get("origin") || "https://payvle.com.au";

    const params = new URLSearchParams({
      customer: stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const portalData = await portalRes.json();

    if (!portalRes.ok) {
      console.error("Stripe portal error:", portalData);
      return json({ error: portalData?.error?.message || "Could not open billing portal." }, 500);
    }

    return json({ url: portalData.url });
  } catch (err) {
    console.error("create-portal-session error:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});