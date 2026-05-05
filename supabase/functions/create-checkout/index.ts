import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

const PRICES: Record<string, number> = {
  "Core": 10900,
  "Core Plus": 14900,
  "Bilingual": 14900,
  "Bilingual Plus": 18900,
};

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { child_id, package_name, parent_email, success_url, cancel_url } = await req.json();
    if (!child_id || !package_name || !parent_email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: cors });
    }
    const amount = PRICES[package_name];
    if (!amount) return new Response(JSON.stringify({ error: "Invalid package" }), { status: 400, headers: cors });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": `SciSpark ${package_name}`,
        "line_items[0][price_data][product_data][description]": "Cambridge Lower Secondary Science — 1 Year Access",
        "line_items[0][price_data][unit_amount]": String(amount),
        "line_items[0][quantity]": "1",
        "mode": "payment",
        "customer_email": parent_email,
        "success_url": success_url || "https://scisparklab.com/payment-success.html?session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": cancel_url || "https://scisparklab.com/dashboard-parent.html",
        "metadata[child_id]": child_id,
        "metadata[package_name]": package_name,
      }).toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) return new Response(JSON.stringify({ error: session.error?.message }), { status: 500, headers: cors });

    const sb = createClient(supabaseUrl, supabaseKey);
    await sb.from("packages").upsert({
      child_id, package_name, status: "pending_payment",
      stripe_session_id: session.id, created_at: new Date().toISOString(),
    }, { onConflict: "child_id" });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors });
  }
});