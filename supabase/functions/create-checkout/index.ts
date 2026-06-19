// create-checkout/index.ts
// Pricing v3 (2026-05-28) — monthly $37 / annual $355
// purchase_type: "monthly" | "annual"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_PRICE_ID = Deno.env.get("STRIPE_PRICE_MONTHLY") ?? "";
const ANNUAL_PRICE_ID  = Deno.env.get("STRIPE_PRICE_ANNUAL") ?? "";
const SITE_URL         = Deno.env.get("SITE_URL") ?? "https://scisparklab.com";

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

    const { child_id, purchase_type } = await req.json();

    if (!child_id || !purchase_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: child_id, purchase_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!["monthly", "annual"].includes(purchase_type)) {
      return new Response(
        JSON.stringify({ error: "purchase_type must be 'monthly' or 'annual'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify parent owns child — children.parent_id === profiles.id === auth user id
    const { data: child, error: childErr } = await supabase
      .from("children")
      .select("id")
      .eq("id", child_id)
      .eq("parent_id", user.id)
      .single();

    if (childErr || !child) {
      return new Response(
        JSON.stringify({ error: "Child not found or does not belong to this parent" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing active subscriptions
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("id, subscription_type, status")
      .eq("child_id", child_id)
      .in("status", ["active", "trialing"]);

    const hasAnnual  = activeSubs?.some((s) => s.subscription_type === "annual")  ?? false;
    const hasMonthly = activeSubs?.some((s) => s.subscription_type === "monthly") ?? false;

    if (hasAnnual) {
      return new Response(
        JSON.stringify({ error: "Child is already on the annual plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (hasMonthly && purchase_type === "monthly") {
      return new Response(
        JSON.stringify({ error: "Child is already on the monthly plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (hasMonthly && purchase_type === "annual") {
      return new Response(
        JSON.stringify({
          error: "Child has an active monthly plan. Use the upgrade flow at /upgrade instead.",
          redirect: "/upgrade",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priceId = purchase_type === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `No Stripe price configured for: ${purchase_type}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const params = new URLSearchParams({
      "mode": "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "customer_email": user.email!,
      "client_reference_id": child_id,
      "success_url": `${SITE_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url":  `${SITE_URL}/dashboard-parent.html`,
      "automatic_tax[enabled]": "false",
      "allow_promotion_codes": "false",
      "metadata[child_id]": child_id,
      "metadata[purchase_type]": purchase_type,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe session creation error:", JSON.stringify(session));
      return new Response(
        JSON.stringify({ error: session.error?.message ?? "Stripe session creation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
