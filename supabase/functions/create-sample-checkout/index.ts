import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, address, postcode, productId } = await req.json();

    if (!name || !email || !phone || !address || !postcode) {
      throw new Error("Missing required fields");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create sample order record with pending status
    const { data: order, error: orderError } = await supabaseClient
      .from("sample_orders")
      .insert([{
        product_id: productId || null,
        name,
        email: email.trim().toLowerCase(),
        phone,
        address,
        postcode,
        status: "pending",
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://inni-space-allocation.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email.trim().toLowerCase(),
      line_items: [
        {
          price: "price_1T1iDRB07EIKmLFjxEmYGFWl",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}?sample_success=${order.id}`,
      cancel_url: `${origin}?sample_cancelled=${order.id}`,
      metadata: {
        sample_order_id: order.id,
        customer_name: name,
      },
    });

    return new Response(JSON.stringify({ url: session.url, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
