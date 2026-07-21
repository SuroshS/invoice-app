// supabase/functions/create-checkout-session/index.ts
// Uses native fetch instead of the Stripe SDK and Supabase JS client
// to avoid Deno compatibility issues with esm.sh imports.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    // 1. Verify auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header." }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    // Verify the JWT by calling Supabase Auth REST API directly
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceRoleKey,
      },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error("Auth verification failed:", errText);
      return json({ error: "Not authenticated." }, 401);
    }

    const user = await userRes.json();
    if (!user?.id) return json({ error: "Not authenticated." }, 401);

    console.log("Authenticated user:", user.id);

    // 2. Read plan from body
    let plan = "yearly";
    try {
      const body = await req.json();
      if (body?.plan === "monthly" || body?.plan === "yearly") plan = body.plan;
    } catch { /* default yearly */ }

    const priceId = plan === "monthly"
      ? Deno.env.get("STRIPE_PRICE_ID_MONTHLY")!
      : Deno.env.get("STRIPE_PRICE_ID_YEARLY")!;

    console.log("Plan:", plan, "Price ID:", priceId);

    // 3. Check for existing Stripe customer via Supabase REST API
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/settings?user_id=eq.${user.id}&select=data`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
      }
    );

    let existingCustomerId = null;
    if (settingsRes.ok) {
      const rows = await settingsRes.json();
      existingCustomerId = rows?.[0]?.data?.stripeCustomerId || null;
    }

    const origin = req.headers.get("origin") || "https://invoicehelp.netlify.app";

    // 4. Create Stripe Checkout Session via Stripe REST API directly
    const params = new URLSearchParams({
      mode: "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      client_reference_id: user.id,
    });

    if (existingCustomerId) {
      params.set("customer", existingCustomerId);
    } else {
      params.set("customer_email", user.email);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const stripeData = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", stripeData);
      return json({ error: stripeData?.error?.message || "Stripe error." }, 500);
    }

    console.log("Checkout session created:", stripeData.id);
    return json({ url: stripeData.url });

  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});