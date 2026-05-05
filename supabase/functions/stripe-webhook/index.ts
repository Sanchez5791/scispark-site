import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") || "";
    const parts = sig.split(",");
    let timestamp = "", signature = "";
    for (const p of parts) {
      if (p.startsWith("t=")) timestamp = p.slice(2);
      if (p.startsWith("v1=")) signature = p.slice(3);
    }
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,"0")).join("");
    if (expected !== signature) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const child_id = session.metadata?.child_id;
      const package_name = session.metadata?.package_name;
      if (!child_id || !package_name) return new Response("Missing metadata", { status: 400 });

      const sb = createClient(supabaseUrl, supabaseKey);
      const now = new Date();
      const expires = new Date(now);
      expires.setFullYear(expires.getFullYear() + 1);

      await sb.from("packages").upsert({
        child_id, package_name, status: "active",
        stripe_session_id: session.id,
        activated_at: now.toISOString(),
        expires_at: expires.toISOString(),
      }, { onConflict: "child_id" });

      console.log(`Activated: ${child_id} — ${package_name}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(String(err), { status: 500 });
  }
});