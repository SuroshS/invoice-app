// supabase/functions/stripe-webhook/index.ts
//
// Stripe calls this function automatically whenever a relevant event happens
// (checkout completed, subscription updated, subscription cancelled). This is
// what actually flips `subscriptionActive` on or off in the user's settings
// row — the frontend never sets this flag itself, it only reads it.
//
// Also writes cancelAtPeriodEnd / currentPeriodEnd / planInterval / planAmount /
// planCurrency so the Account Settings modal can show a real "Cancelled —
// access until <date>" state and the actual price paid, instead of a
// hardcoded renewal date and price.
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
//
// Stripe can legitimately deliver related-but-distinct events for the same
// subscription lifecycle moment close together (e.g. checkout.session.completed
// and customer.subscription.updated both firing when a new subscription is
// created), with no ordering or non-overlap guarantee. A naive read-then-write
// here would race: one call could read the row before another's write
// commits, then overwrite that write with a merge based on its own stale
// read — verified this would actually drop stripeCustomerId from the row,
// since checkout.session.completed's patch sets it and
// customer.subscription.updated's patch doesn't, so losing that race means
// the merge silently reverts it to missing.
//
// Fixed via the `merge_settings_patch` Postgres function (see
// supabase/migrations/20260716000002_merge_settings_patch_function.sql),
// which does the whole read-merge-write as one atomic
// `INSERT ... ON CONFLICT DO UPDATE SET data = settings.data || excluded.data`
// statement. Postgres's own row-level locking serializes concurrent calls
// for the same user_id — there's no window for the race to occur, unlike an
// optimistic-retry approach that only detects and recovers from it after
// the fact. Requires that migration to be applied — see its header comment
// for deployment sequencing.
async function patchUserSettings(userId: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin.rpc("merge_settings_patch", {
    p_user_id: userId,
    p_patch: patch,
  });

  if (error) {
    console.error(`Failed to patch settings for user ${userId}:`, error);
  }

  return { error };
}

// Pulls the fields the frontend needs to show real plan/pricing/cancellation
// info instead of the old hardcoded "$49.99/year, renews 8 July 2027" text.
// cancelAtPeriodEnd is the key one: when a customer cancels via the Stripe
// billing portal, Stripe does NOT flip `status` away from "active" — it just
// sets cancel_at_period_end=true and leaves status alone until the period
// actually ends. Reading only `status` (as this webhook used to) means a
// cancelled-but-still-paid-up user looks identical to a normal active one.
function extractSubscriptionFields(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return {
    cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    planInterval: item?.price?.recurring?.interval || null,
    planAmount: item?.price?.unit_amount ?? null,
    planCurrency: item?.price?.currency || null,
  };
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

// Consistent JSON responses everywhere (previously two of these returned
// plain text instead) with no raw exception messages ever reaching the
// caller — full details always go to console.error/console.warn for the
// Supabase function logs, but the response body only ever carries a fixed,
// generic message.
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  if (!signature) {
    return json({ error: "Missing Stripe-Signature header." }, 400);
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
    return json({ error: "Webhook signature verification failed." }, 400);
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

        // The checkout session only carries the subscription ID, not its full
        // details (period end, price, cancellation state) — fetch it so the
        // account modal can show real numbers from the very first payment.
        let subscriptionFields = {};
        if (typeof session.subscription === "string") {
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            subscriptionFields = extractSubscriptionFields(subscription);
          } catch (err) {
            console.error("Failed to retrieve subscription after checkout:", err);
          }
        }

        await patchUserSettings(userId, {
          subscriptionActive: true,
          subscriptionStatus: "active",
          stripeCustomerId: stripeCustomerId,
          subscriptionUpdatedAt: new Date().toISOString(),
          ...subscriptionFields,
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
          ...extractSubscriptionFields(subscription),
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
          cancelAtPeriodEnd: false,
          subscriptionUpdatedAt: new Date().toISOString(),
        });

        break;
      }

      default:
        // Other event types are ignored — Stripe sends many event types you
        // don't necessarily need to react to.
        break;
    }

    return json({ received: true }, 200);
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Still return 200 here in most cases would be wrong — Stripe will retry
    // on non-2xx, which is what you want if something failed transiently.
    return json({ error: "Webhook processing failed." }, 500);
  }
});