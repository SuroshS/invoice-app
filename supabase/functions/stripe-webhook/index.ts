// supabase/functions/stripe-webhook/index.ts
//
// Stripe calls this function automatically whenever a relevant event happens
// (checkout completed, subscription updated, subscription cancelled). This is
// what actually flips `subscriptionActive` on or off in the user's settings
// row — the frontend never sets this flag itself, it only reads it.
//
// Deploy with: supabase functions deploy stripe-webhook
//
// After deploying, register this function's URL in
// Stripe Dashboard -> Developers -> Webhooks -> Add endpoint, listening for:
//   - checkout.session.completed
//   - customer.subscription.updated
//   - customer.subscription.deleted
//
// Stripe will give you a signing secret (whsec_...) once the endpoint is
// created — set it with:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// Required secrets:
//   STRIPE_SECRET_KEY      - same secret key used in create-checkout-session
//   STRIPE_WEBHOOK_SECRET  - the whsec_... value Stripe gives you for this endpoint

import Stripe from "https://esm.sh/stripe@12.18.0?target=deno&deno-std=0.177.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Merges a partial update into the existing settings.data JSONB blob for a
// given user, without clobbering any other fields already stored there
// (business info, bank details, invoice terms, etc).
async function patchUserSettings(userId: string, patch: Record<string, unknown>) {
  const { data: row, error: fetchError } = await supabaseAdmin
    .from("settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error(`Failed to fetch settings for user ${userId}:`, fetchError);
    return { error: fetchError };
  }

  const updatedData = { ...(row?.data || {}), ...patch };

  const { error: upsertError } = await supabaseAdmin.from("settings").upsert(
    {
      user_id: userId,
      data: updatedData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.error(`Failed to update settings for user ${userId}:`, upsertError);
  }

  return { error: upsertError };
}

// Finds the Supabase user_id whose settings row has a matching stripeCustomerId.
// Needed because subscription.updated / subscription.deleted events only give
// you a Stripe customer ID, not your own user_id — so we stored that customer
// ID against the user back when checkout.session.completed first fired.
async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("user_id, data")
    .eq("data->>stripeCustomerId", customerId)
    .maybeSingle();

  if (error) {
    console.error("Error looking up user by Stripe customer ID:", error);
    return null;
  }

  return data?.user_id || null;
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing Stripe-Signature header.", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook signature error: ${err.message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      // Fired the moment a Checkout Session completes successfully — i.e. the
      // user just paid for the first time. This is where we both activate
      // their subscription AND store the Stripe customer ID for future lookups.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;

        if (!userId) {
          console.error("checkout.session.completed with no client_reference_id");
          break;
        }

        await patchUserSettings(userId, {
          subscriptionActive: true,
          stripeCustomerId: stripeCustomerId,
          subscriptionUpdatedAt: new Date().toISOString(),
        });

        break;
      }

      // Fired whenever the subscription's status changes — renewals, plan
      // changes, payment failures, etc. We only care about it going INTO a
      // non-active state here; activation already happened above.
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userId = await findUserIdByStripeCustomerId(customerId);
        if (!userId) {
          console.error(
            `customer.subscription.updated: no user found for customer ${customerId}`
          );
          break;
        }

        const isActive =
          subscription.status === "active" || subscription.status === "trialing";

        await patchUserSettings(userId, {
          subscriptionActive: isActive,
          subscriptionStatus: subscription.status,
          subscriptionUpdatedAt: new Date().toISOString(),
        });

        break;
      }

      // Fired when a subscription is fully cancelled (not just set to cancel
      // at period end — this is the final deletion event). Revoke access.
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userId = await findUserIdByStripeCustomerId(customerId);
        if (!userId) {
          console.error(
            `customer.subscription.deleted: no user found for customer ${customerId}`
          );
          break;
        }

        await patchUserSettings(userId, {
          subscriptionActive: false,
          subscriptionStatus: "canceled",
          subscriptionUpdatedAt: new Date().toISOString(),
        });

        break;
      }

      default:
        // Other event types are ignored — Stripe sends many event types you
        // don't necessarily need to react to.
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Still return 200 here in most cases would be wrong — Stripe will retry
    // on non-2xx, which is what you want if something failed transiently.
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});