// stripe-webhook/index.ts
// v3 — writes to subscriptions table (not packages), handles 5 event types
// first_purchase_at shared across unit subs per child
// Phase 3, 2026-05-05

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  // ── Verify Stripe signature ───────────────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = await verifyStripeSignature(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventType = event.type as string;
  const eventObject = (event.data as Record<string, unknown>)
    ?.object as Record<string, unknown>;

  try {
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, eventObject);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, eventObject);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, eventObject);
        break;

      case "invoice.paid":
        // No-op — subscription status is tracked via subscription.updated
        console.log(`invoice.paid: ${eventObject.id} — logged, no DB action`);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, eventObject);
        break;

      default:
        console.log(`Unhandled Stripe event: ${eventType} — returning 200`);
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

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Record<string, unknown>
) {
  const metadata = (session.metadata as Record<string, string>) ?? {};
  const childId = metadata.child_id;
  const purchaseType = metadata.purchase_type as "unit" | "annual";
  const unitCode = metadata.unit_code ?? null;
  const stripeSubId = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  if (!childId || !purchaseType || !stripeSubId) {
    throw new Error(
      `Missing metadata — session ${session.id}: ` +
      `child_id=${childId}, purchase_type=${purchaseType}, subscription=${stripeSubId}`
    );
  }

  // CRITICAL: first_purchase_at logic
  // All unit subs for a child share the same first_purchase_at.
  // Annual subs from direct purchase use NOW(); upgrades are handled separately.
  let firstPurchaseAt: string;

  if (purchaseType === "unit") {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("first_purchase_at")
      .eq("child_id", childId)
      .eq("subscription_type", "unit")
      .order("first_purchase_at", { ascending: true })
      .limit(1);

    if (existing && existing.length > 0 && existing[0].first_purchase_at) {
      // Reuse the earliest first_purchase_at across all of this child's unit subs
      firstPurchaseAt = existing[0].first_purchase_at;
      console.log(`Reusing first_purchase_at=${firstPurchaseAt} for child=${childId}`);
    } else {
      firstPurchaseAt = new Date().toISOString();
      console.log(`First unit purchase for child=${childId}, first_purchase_at=${firstPurchaseAt}`);
    }
  } else {
    // Annual direct purchase — first_purchase_at = now
    // (Upgrade flow sets its own first_purchase_at via upgrade-to-annual function)
    firstPurchaseAt = new Date().toISOString();
  }

  const now = new Date().toISOString();

  // UPSERT on stripe_subscription_id (unique constraint enforces idempotency)
  const { error } = await supabase.from("subscriptions").upsert(
    {
      child_id: childId,
      subscription_type: purchaseType,
      unit_code: purchaseType === "unit" ? unitCode : null,
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: stripeCustomerId,
      status: "active",
      first_purchase_at: firstPurchaseAt,
      upgraded_from_unit: false,
      upgrade_credit_usd: 0,
      created_at: now,
      updated_at: now,
    },
    {
      onConflict: "stripe_subscription_id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw new Error(`Supabase upsert failed for session ${session.id}: ${JSON.stringify(error)}`);
  }

  console.log(
    `✅ Subscription created: child=${childId}, type=${purchaseType}, ` +
    `unit=${unitCode ?? "n/a"}, sub=${stripeSubId}`
  );
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Record<string, unknown>
) {
  const subId = subscription.id as string;
  const status = subscription.status as string;
  const periodStart = subscription.current_period_start
    ? new Date((subscription.current_period_start as number) * 1000).toISOString()
    : null;
  const periodEnd = subscription.current_period_end
    ? new Date((subscription.current_period_end as number) * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subId);

  if (error) {
    throw new Error(
      `subscription.updated DB error for ${subId}: ${JSON.stringify(error)}`
    );
  }
  console.log(`📝 Subscription updated: ${subId} → status=${status}`);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Record<string, unknown>
) {
  const subId = subscription.id as string;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("stripe_subscription_id", subId);

  if (error) {
    throw new Error(
      `subscription.deleted DB error for ${subId}: ${JSON.stringify(error)}`
    );
  }
  console.log(`❌ Subscription cancelled: ${subId}`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Record<string, unknown>
) {
  const subId = invoice.subscription as string;
  if (!subId) {
    console.warn("invoice.payment_failed: no subscription_id on invoice — skipping");
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId);

  if (error) {
    throw new Error(
      `payment_failed DB update error for sub ${subId}: ${JSON.stringify(error)}`
    );
  }
  console.log(`⚠️ Payment failed — sub marked past_due: ${subId}`);
}

// ── Stripe HMAC-SHA256 signature verification ─────────────────────────────────

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<Record<string, unknown>> {
  // Parse t=... v1=... pairs
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

  // Reject webhooks older than 5 minutes
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(timestamp)) > 300) {
    throw new Error("Stripe webhook timestamp too old (>5 min) — possible replay attack");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== signature) {
    throw new Error("Stripe signature mismatch — webhook rejected");
  }

  return JSON.parse(payload);
}
