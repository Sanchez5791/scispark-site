// stripe-webhook/index.ts
// Pricing v3 (2026-05-28) — handles monthly/annual subscriptions
// Writes to subscriptions table. Events: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted,
// invoice.paid (no-op), invoice.payment_failed

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  let event: Record<string, unknown>;
  try {
    event = await verifyStripeSignature(body, signature, secret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventType = event.type as string;
  const obj       = (event.data as Record<string, unknown>)?.object as Record<string, unknown>;

  try {
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, obj);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, obj);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, obj);
        break;
      case "invoice.paid":
        console.log(`invoice.paid: ${obj.id} — no action needed`);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, obj);
        break;
      default:
        console.log(`Unhandled Stripe event: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(`Error handling ${eventType}:`, err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Record<string, unknown>
) {
  const metadata     = (session.metadata as Record<string, string>) ?? {};
  const childId      = metadata.child_id;
  const purchaseType = metadata.purchase_type as "monthly" | "annual";
  const stripeSubId  = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  if (!childId || !purchaseType || !stripeSubId) {
    throw new Error(
      `Missing metadata — session ${session.id}: ` +
      `child_id=${childId}, purchase_type=${purchaseType}, subscription=${stripeSubId}`
    );
  }

  // first_purchase_at: monthly subs for a child share the earliest date
  let firstPurchaseAt: string;
  if (purchaseType === "monthly") {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("first_purchase_at")
      .eq("child_id", childId)
      .eq("subscription_type", "monthly")
      .order("first_purchase_at", { ascending: true })
      .limit(1);

    firstPurchaseAt = (existing?.length && existing[0].first_purchase_at)
      ? existing[0].first_purchase_at
      : new Date().toISOString();
  } else {
    // annual direct purchase — starts fresh from now
    firstPurchaseAt = new Date().toISOString();
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("subscriptions").upsert(
    {
      child_id:               childId,
      subscription_type:      purchaseType,
      unit_code:              null,
      stripe_subscription_id: stripeSubId,
      stripe_customer_id:     stripeCustomerId,
      status:                 "active",
      first_purchase_at:      firstPurchaseAt,
      upgraded_from_unit:     false,
      upgrade_credit_usd:     0,
      created_at:             now,
      updated_at:             now,
    },
    { onConflict: "stripe_subscription_id", ignoreDuplicates: false }
  );

  if (error) {
    throw new Error(`Supabase upsert failed for session ${session.id}: ${JSON.stringify(error)}`);
  }
  console.log(`✅ Subscription created: child=${childId}, type=${purchaseType}, sub=${stripeSubId}`);
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Record<string, unknown>
) {
  const subId      = subscription.id as string;
  const status     = subscription.status as string;
  const periodStart = subscription.current_period_start
    ? new Date((subscription.current_period_start as number) * 1000).toISOString() : null;
  const periodEnd   = subscription.current_period_end
    ? new Date((subscription.current_period_end as number) * 1000).toISOString() : null;

  const { error } = await supabase
    .from("subscriptions")
    .update({ status, current_period_start: periodStart, current_period_end: periodEnd, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId);

  if (error) {
    throw new Error(`subscription.updated error for ${subId}: ${JSON.stringify(error)}`);
  }
  console.log(`📝 Subscription updated: ${subId} → ${status}`);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Record<string, unknown>
) {
  const subId = subscription.id as string;
  const now   = new Date().toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("stripe_subscription_id", subId)
    .neq("status", "cancelled_for_upgrade"); // preserve upgrade records

  if (error) {
    throw new Error(`subscription.deleted error for ${subId}: ${JSON.stringify(error)}`);
  }
  console.log(`❌ Subscription cancelled: ${subId}`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Record<string, unknown>
) {
  const subId = invoice.subscription as string;
  if (!subId) {
    console.warn("invoice.payment_failed: no subscription_id — skipping");
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
    .not("status", "in", `("cancelled","cancelled_for_upgrade")`);

  if (error) {
    throw new Error(`payment_failed update error for ${subId}: ${JSON.stringify(error)}`);
  }
  console.log(`⚠️  Payment failed → past_due: ${subId}`);
}

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<Record<string, unknown>> {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const eq = p.indexOf("=");
      return [p.slice(0, eq), p.slice(eq + 1)];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];

  if (!timestamp || !signature) {
    throw new Error("Invalid stripe-signature header format");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(timestamp)) > 300) {
    throw new Error("Stripe webhook timestamp too old (>5 min)");
  }

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

  if (computed !== signature) {
    throw new Error("Stripe signature mismatch");
  }
  return JSON.parse(payload);
}
