// upgrade-to-annual/index.ts
// Pricing v3 (2026-05-28) — monthly $37 → annual $355
//
// Window:  90 days from first monthly payment
// Credit:  min(paid_invoices, 3) × $37 — eligible only within window
// Backdate: annual_start = first_purchase_at when eligible; else now
//
// Modes:
//   POST { child_id, preview: true }  → eligibility info, no Stripe ops
//   POST { child_id }                 → execute upgrade

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANNUAL_PRICE_ID = Deno.env.get("STRIPE_PRICE_ANNUAL") ?? "";
const ANNUAL_USD      = 355;
const MONTHLY_USD     = 37;
const WINDOW_DAYS     = 90;
const MAX_CREDIT_MONTHS = 3;

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

    const body    = await req.json();
    const childId = body.child_id as string;
    const preview = body.preview === true;

    if (!childId) {
      return new Response(
        JSON.stringify({ error: "Missing child_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify parent owns child — children.parent_id === profiles.id === auth user id
    const { data: child } = await supabase
      .from("children").select("id").eq("id", childId).eq("parent_id", user.id).single();
    if (!child) {
      return new Response(
        JSON.stringify({ error: "Child not found or does not belong to this parent" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Fetch active monthly subscription ──────────────────────────────────
    const { data: monthlySubs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, stripe_customer_id, first_purchase_at")
      .eq("child_id", childId)
      .eq("subscription_type", "monthly")
      .in("status", ["active", "trialing"]);

    if (subsErr) {
      throw new Error(`Failed to fetch subscriptions: ${JSON.stringify(subsErr)}`);
    }
    if (!monthlySubs || monthlySubs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active monthly subscription found for this child" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const monthlySub     = monthlySubs[0];
    const stripeSubId    = monthlySub.stripe_subscription_id;
    const stripeCustomerId = monthlySub.stripe_customer_id;
    const firstPurchaseAt = new Date(monthlySub.first_purchase_at);

    // ── 2. Window calculation ─────────────────────────────────────────────────
    const windowEnd = new Date(firstPurchaseAt);
    windowEnd.setDate(windowEnd.getDate() + WINDOW_DAYS);
    const now     = new Date();
    const eligible = now <= windowEnd;

    // ── 3. Count paid invoices for credit calculation ─────────────────────────
    const invoiceRes = await stripeAPI(
      stripeKey, "GET",
      `/v1/invoices?subscription=${stripeSubId}&status=paid&limit=100`,
      ""
    );
    const invoiceData = await invoiceRes.json();
    const paidCount   = invoiceData.data?.length ?? 0;
    const creditMonths = eligible ? Math.min(paidCount, MAX_CREDIT_MONTHS) : 0;
    const creditUsd    = creditMonths * MONTHLY_USD;
    const amountDue    = ANNUAL_USD - creditUsd;

    const annualStart = eligible ? firstPurchaseAt : now;
    const annualEnd   = new Date(annualStart);
    annualEnd.setDate(annualEnd.getDate() + 365);

    // ── Preview mode: return info without executing ───────────────────────────
    if (preview) {
      return new Response(
        JSON.stringify({
          eligible,
          paid_months:        creditMonths,
          credit_usd:         creditUsd,
          amount_due_usd:     amountDue,
          annual_price_usd:   ANNUAL_USD,
          window_days:        WINDOW_DAYS,
          window_expires_at:  windowEnd.toISOString(),
          first_purchase_at:  firstPurchaseAt.toISOString(),
          annual_start:       annualStart.toISOString(),
          annual_end:         annualEnd.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Execute mode ──────────────────────────────────────────────────────────

    // ── 4. Cancel monthly subscription in Stripe ──────────────────────────────
    const cancelRes = await stripeAPI(
      stripeKey, "DELETE",
      `/v1/subscriptions/${stripeSubId}`,
      "prorate=false&invoice_now=false"
    );
    if (!cancelRes.ok) {
      const err = await cancelRes.json();
      console.error(`INCIDENT: Failed to cancel monthly sub ${stripeSubId}:`, err);
      return new Response(
        JSON.stringify({
          error: "Failed to cancel monthly subscription. Incident logged. Please contact support.",
          stripe_error: err.error?.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Create annual subscription in Stripe ───────────────────────────────
    const annualStartTs = Math.floor(annualStart.getTime() / 1000);
    const annualParams  = new URLSearchParams({
      "customer":                                     stripeCustomerId,
      "items[0][price]":                              ANNUAL_PRICE_ID,
      "billing_cycle_anchor":                         String(annualStartTs),
      "proration_behavior":                           "none",
      "payment_behavior":                             "default_incomplete",
      "payment_settings[save_default_payment_method]": "on_subscription",
      "automatic_tax[enabled]":                       "false",
      "metadata[child_id]":                           childId,
      "metadata[purchase_type]":                      "annual",
      "metadata[upgraded_from_monthly]":              "true",
      "metadata[credit_usd]":                         String(creditUsd),
      "metadata[paid_months_credited]":               String(creditMonths),
    });

    const annualSubRes = await stripeAPI(stripeKey, "POST", "/v1/subscriptions", annualParams.toString());
    const annualSub    = await annualSubRes.json();

    if (!annualSubRes.ok) {
      console.error(
        `INCIDENT: Monthly sub ${stripeSubId} cancelled but annual creation FAILED. ` +
        `Manual intervention required.`, annualSub
      );
      return new Response(
        JSON.stringify({
          error: "Failed to create annual subscription after cancelling monthly. Incident logged. Contact support immediately.",
          cancelled_monthly_sub: stripeSubId,
          stripe_error: annualSub.error?.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 6. Apply upgrade credit as negative invoice item ──────────────────────
    let checkoutUrl: string | null = annualSub.latest_invoice?.hosted_invoice_url ?? null;

    if (creditUsd > 0) {
      const creditRes = await stripeAPI(stripeKey, "POST", "/v1/invoiceitems",
        new URLSearchParams({
          "customer":     stripeCustomerId,
          "subscription": annualSub.id,
          "amount":       String(-creditUsd * 100),
          "currency":     "usd",
          "description":  `Upgrade credit: ${creditMonths} month(s) × $${MONTHLY_USD}`,
        }).toString()
      );
      if (!creditRes.ok) {
        const err = await creditRes.json();
        // Non-fatal — founder can apply credit manually in Stripe dashboard
        console.warn("Credit invoice item creation failed (non-fatal):", err);
      } else {
        const invoiceId = annualSub.latest_invoice?.id;
        if (invoiceId) {
          await stripeAPI(stripeKey, "POST", `/v1/invoices/${invoiceId}/finalize`, "");
          const updatedInvoiceRes = await stripeAPI(stripeKey, "GET", `/v1/invoices/${invoiceId}`, "");
          const updatedInvoice    = await updatedInvoiceRes.json();
          checkoutUrl = updatedInvoice.hosted_invoice_url ?? checkoutUrl;
        }
      }
    }

    // ── 7. Insert annual subscription row in DB ───────────────────────────────
    const nowIso = now.toISOString();
    const { error: insertErr } = await supabase.from("subscriptions").insert({
      child_id:               childId,
      subscription_type:      "annual",
      unit_code:              null,
      stripe_subscription_id: annualSub.id,
      stripe_customer_id:     stripeCustomerId,
      stripe_price_id:        ANNUAL_PRICE_ID,
      status:                 annualSub.status ?? "incomplete",
      current_period_start:   annualStart.toISOString(),
      current_period_end:     annualEnd.toISOString(),
      first_purchase_at:      firstPurchaseAt.toISOString(),
      upgraded_from_unit:     true,
      upgrade_credit_usd:     creditUsd,
      created_at:             nowIso,
      updated_at:             nowIso,
    });

    if (insertErr) {
      console.error(
        `INCIDENT: Annual Stripe sub ${annualSub.id} CREATED but DB INSERT FAILED. ` +
        `Do NOT cancel the Stripe sub. Founder must fix DB manually.`, insertErr
      );
      return new Response(
        JSON.stringify({
          error: "Annual subscription created in Stripe but database sync failed. Incident logged. Contact support.",
          stripe_subscription_id: annualSub.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 8. Mark monthly sub as cancelled_for_upgrade ─────────────────────────
    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled_for_upgrade", cancelled_at: nowIso, updated_at: nowIso })
      .eq("stripe_subscription_id", stripeSubId);

    if (updateErr) {
      // Non-fatal: webhook will eventually sync cancellation
      console.warn("Failed to mark monthly sub cancelled_for_upgrade (non-fatal):", updateErr);
    }

    return new Response(
      JSON.stringify({
        eligible,
        paid_months:        creditMonths,
        credit_usd:         creditUsd,
        amount_charged_usd: amountDue,
        annual_start:       annualStart.toISOString(),
        annual_end:         annualEnd.toISOString(),
        checkout_url:       checkoutUrl,
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

async function stripeAPI(key: string, method: string, path: string, body: string): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
  };
  if (body && method !== "GET") options.body = body;
  return fetch(`https://api.stripe.com${path}`, options);
}
