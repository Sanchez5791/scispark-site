// upgrade-to-annual/index.ts
// v3 NEW — converts active unit sub(s) to annual with credit + optional backdate
// Phase 3, 2026-05-05
//
// Window rules (from SCISPARK_PRICING_LOCKED_v2.1):
//   1 unit  → 30-day window
//   2 units → 60-day window
//   3+ units → 90-day window
// Credit: MIN(num_units × $25, $75). Eligible only within window.
// Backdate: annual_start = first_purchase_at when eligible; else annual_start = now.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANNUAL_PRICE_ID = Deno.env.get("STRIPE_PRICE_ANNUAL_STANDARD") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    const { child_id } = await req.json();
    if (!child_id) {
      return new Response(
        JSON.stringify({ error: "Missing child_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Auth: verify parent owns child ────────────────────────────────────────
    const { data: parent, error: parentErr } = await supabase
      .from("parents")
      .select("id, email")
      .eq("user_id", user.id)
      .single();

    if (parentErr || !parent) {
      return new Response(
        JSON.stringify({ error: "Parent account not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: child, error: childErr } = await supabase
      .from("children")
      .select("id")
      .eq("id", child_id)
      .eq("parent_id", parent.id)
      .single();

    if (childErr || !child) {
      return new Response(
        JSON.stringify({ error: "Child not found or does not belong to this parent" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Fetch active unit subs ─────────────────────────────────────────────
    const { data: unitSubs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, stripe_customer_id, unit_code, first_purchase_at")
      .eq("child_id", child_id)
      .eq("subscription_type", "unit")
      .in("status", ["active", "trialing"]);

    if (subsErr) {
      throw new Error(`Failed to fetch subscriptions: ${JSON.stringify(subsErr)}`);
    }
    if (!unitSubs || unitSubs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active unit subscriptions found for this child" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. first_purchase_at = MIN across all unit subs ───────────────────────
    const firstPurchaseAt = unitSubs.reduce<Date>((min, s) => {
      const d = new Date(s.first_purchase_at);
      return d < min ? d : min;
    }, new Date(unitSubs[0].first_purchase_at));

    // ── 3-6. Window calculation ───────────────────────────────────────────────
    const numUnits = unitSubs.length;
    const windowDays = numUnits === 1 ? 30 : numUnits === 2 ? 60 : 90;
    const windowEnd = new Date(firstPurchaseAt);
    windowEnd.setDate(windowEnd.getDate() + windowDays);
    const now = new Date();

    // ── 7. Eligibility ────────────────────────────────────────────────────────
    // Boundary inclusive: day 90 with 3 units → still eligible
    const eligible = now <= windowEnd;
    const creditUsd = eligible ? Math.min(numUnits * 25, 75) : 0;
    const annualStart = eligible ? firstPurchaseAt : now;

    // ── 8. annual_end ─────────────────────────────────────────────────────────
    const annualEnd = new Date(annualStart);
    annualEnd.setDate(annualEnd.getDate() + 365);

    const stripeCustomerId = unitSubs[0].stripe_customer_id;
    const cancelledSubIds: string[] = [];

    // ── 9. Cancel each unit sub in Stripe ────────────────────────────────────
    for (const unitSub of unitSubs) {
      const cancelRes = await stripeAPI(
        stripeKey,
        "DELETE",
        `/v1/subscriptions/${unitSub.stripe_subscription_id}`,
        "prorate=false&invoice_now=false"
      );
      if (!cancelRes.ok) {
        const err = await cancelRes.json();
        console.error(
          `INCIDENT: Failed to cancel sub ${unitSub.stripe_subscription_id}. ` +
          `Already cancelled: [${cancelledSubIds.join(", ")}]. Error:`, err
        );
        // Compensation: already-cancelled subs cannot be restored via API.
        // Log incident for founder to handle manually.
        return new Response(
          JSON.stringify({
            error: "Failed to cancel a unit subscription in Stripe. Incident logged. Please contact support.",
            cancelled_so_far: cancelledSubIds,
            failed_on: unitSub.stripe_subscription_id,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      cancelledSubIds.push(unitSub.stripe_subscription_id);
    }

    // ── 10. Create annual subscription in Stripe ──────────────────────────────
    const annualStartTimestamp = Math.floor(annualStart.getTime() / 1000);
    const annualParams = new URLSearchParams({
      "customer": stripeCustomerId,
      "items[0][price]": ANNUAL_PRICE_ID,
      "billing_cycle_anchor": String(annualStartTimestamp),
      "proration_behavior": "none",
      "payment_behavior": "default_incomplete",
      "payment_settings[save_default_payment_method]": "on_subscription",
      "automatic_tax[enabled]": "false",   // Malaysia deferred
      "metadata[child_id]": child_id,
      "metadata[purchase_type]": "annual",
      "metadata[upgraded_from_units]": "true",
      "metadata[credit_usd]": String(creditUsd),
      "metadata[num_units_credited]": String(numUnits),
    });

    const annualSubRes = await stripeAPI(stripeKey, "POST", "/v1/subscriptions", annualParams.toString());
    const annualSub = await annualSubRes.json();

    if (!annualSubRes.ok) {
      // COMPENSATION: unit subs are already cancelled but annual failed.
      // Cannot auto-restore Stripe subs. Founder must handle manually.
      console.error(
        `INCIDENT: Unit subs cancelled [${cancelledSubIds.join(", ")}] ` +
        `but annual subscription creation FAILED. Manual intervention required.`,
        annualSub
      );
      return new Response(
        JSON.stringify({
          error: "Failed to create annual subscription after cancelling unit subs. Incident logged. Contact support immediately.",
          cancelled_unit_subs: cancelledSubIds,
          stripe_error: annualSub.error?.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 11. Apply credit as invoice item ──────────────────────────────────────
    let checkoutUrl: string | null = annualSub.latest_invoice?.hosted_invoice_url ?? null;

    if (creditUsd > 0) {
      const creditRes = await stripeAPI(
        stripeKey,
        "POST",
        "/v1/invoiceitems",
        new URLSearchParams({
          "customer": stripeCustomerId,
          "subscription": annualSub.id,
          "amount": String(-creditUsd * 100),   // negative = credit
          "currency": "usd",
          "description": `Upgrade credit: ${numUnits} unit(s) × $25`,
        }).toString()
      );

      if (!creditRes.ok) {
        const err = await creditRes.json();
        // Non-fatal: credit item failed. Log and continue.
        // Founder can manually apply credit in Stripe dashboard.
        console.warn("Credit invoice item creation failed (non-fatal):", err);
      } else {
        // Finalize the invoice so the credit is applied before payment
        const invoiceId = annualSub.latest_invoice?.id;
        if (invoiceId) {
          await stripeAPI(stripeKey, "POST", `/v1/invoices/${invoiceId}/finalize`, "");
          const invoiceRes = await stripeAPI(stripeKey, "GET", `/v1/invoices/${invoiceId}`, "");
          const invoice = await invoiceRes.json();
          checkoutUrl = invoice.hosted_invoice_url ?? checkoutUrl;
        }
      }
    }

    // ── 12. INSERT annual subscription row in DB ──────────────────────────────
    const nowIso = now.toISOString();
    const { error: insertErr } = await supabase.from("subscriptions").insert({
      child_id,
      subscription_type: "annual",
      unit_code: null,
      stripe_subscription_id: annualSub.id,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: ANNUAL_PRICE_ID,
      status: annualSub.status ?? "incomplete",
      current_period_start: annualStart.toISOString(),
      current_period_end: annualEnd.toISOString(),
      first_purchase_at: firstPurchaseAt.toISOString(),
      upgraded_from_unit: true,
      upgrade_credit_usd: creditUsd,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (insertErr) {
      // DO NOT cancel the Stripe annual sub — founder must reconcile manually.
      console.error(
        `INCIDENT: Annual Stripe sub ${annualSub.id} CREATED but DB INSERT FAILED. ` +
        `Do NOT cancel the Stripe sub. Founder must fix DB manually.`,
        insertErr
      );
      return new Response(
        JSON.stringify({
          error: "Annual subscription created in Stripe but database sync failed. Incident logged. Contact support.",
          stripe_subscription_id: annualSub.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 13. Mark unit sub rows as cancelled_for_upgrade ───────────────────────
    const unitStripeIds = unitSubs.map((s) => s.stripe_subscription_id);
    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled_for_upgrade", cancelled_at: nowIso, updated_at: nowIso })
      .in("stripe_subscription_id", unitStripeIds);

    if (updateErr) {
      // Non-fatal: Stripe already has them cancelled; webhook will eventually sync.
      console.warn("Failed to update unit subs to cancelled_for_upgrade (non-fatal):", updateErr);
    }

    // ── 14. Return result ─────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        eligible,
        credit_applied_usd: creditUsd,
        amount_charged_usd: 189 - creditUsd,
        annual_start: annualStart.toISOString(),
        annual_end: annualEnd.toISOString(),
        checkout_url: checkoutUrl,
        window_days: windowDays,
        window_end: windowEnd.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("upgrade-to-annual unhandled error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Stripe REST helper ────────────────────────────────────────────────────────

async function stripeAPI(
  key: string,
  method: string,
  path: string,
  body: string
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (body && method !== "GET") {
    options.body = body;
  }
  return fetch(`https://api.stripe.com${path}`, options);
}
