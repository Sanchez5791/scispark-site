// create-checkout/index.ts
// v3 — subscription model (unit & annual), no Stripe Tax (Malaysia deferred)
// Phase 3, 2026-05-05

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs loaded from Supabase secrets (set in Phase 3 secrets step)
// unit_code → monthly price_id
const UNIT_PRICE_MAP: Record<string, string> = {
  "y7-u1": Deno.env.get("STRIPE_PRICE_Y7_U1_MONTHLY") ?? "",
};
const ANNUAL_PRICE_ID = Deno.env.get("STRIPE_PRICE_ANNUAL_STANDARD") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://scisparklab.com";

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

    // Verify JWT — user-scoped client
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

    // Service-role client for all DB reads/writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { child_id, purchase_type, unit_code } = await req.json();

    // ── Input validation ──────────────────────────────────────────────────────
    if (!child_id || !purchase_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: child_id, purchase_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!["unit", "annual"].includes(purchase_type)) {
      return new Response(
        JSON.stringify({ error: "purchase_type must be 'unit' or 'annual'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (purchase_type === "unit" && !unit_code) {
      return new Response(
        JSON.stringify({ error: "unit_code is required for purchase_type='unit'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Auth: verify parent owns child_id ─────────────────────────────────────
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

    // ── Check existing active subscriptions ───────────────────────────────────
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("id, subscription_type, unit_code, status")
      .eq("child_id", child_id)
      .in("status", ["active", "trialing"]);

    const activeAnnual = activeSubs?.find((s) => s.subscription_type === "annual");
    const activeUnits = activeSubs?.filter((s) => s.subscription_type === "unit") ?? [];

    if (purchase_type === "annual") {
      if (activeAnnual) {
        return new Response(
          JSON.stringify({ error: "Child is already subscribed to the annual plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (activeUnits.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Child has active unit subscriptions. Use the upgrade flow at /upgrade instead of purchasing annual directly.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (purchase_type === "unit") {
      const alreadyHasUnit = activeUnits.some((s) => s.unit_code === unit_code);
      if (alreadyHasUnit) {
        return new Response(
          JSON.stringify({ error: `Child is already subscribed to unit ${unit_code}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Resolve price ID ──────────────────────────────────────────────────────
    const priceId = purchase_type === "annual" ? ANNUAL_PRICE_ID : UNIT_PRICE_MAP[unit_code!];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `No Stripe price configured for: ${purchase_type === "annual" ? "annual" : unit_code}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create Stripe Checkout Session ────────────────────────────────────────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const params = new URLSearchParams({
      "mode": "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "customer_email": parent.email ?? user.email!,
      "client_reference_id": child_id,
      "success_url": `${SITE_URL}/lesson?checkout=success`,
      "cancel_url": `${SITE_URL}/payment?checkout=cancelled`,
      "automatic_tax[enabled]": "false",   // Malaysia not in Stripe Tax — deferred
      "allow_promotion_codes": "false",
      "metadata[child_id]": child_id,
      "metadata[purchase_type]": purchase_type,
    });
    if (purchase_type === "unit" && unit_code) {
      params.set("metadata[unit_code]", unit_code);
    }

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
    console.error("create-checkout unhandled error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
