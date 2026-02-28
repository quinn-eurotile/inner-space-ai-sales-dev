import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "Inner Space <support@innerspace.co.uk>";
const REPLY_TO = "support@innerspace.co.uk";
const TO_EMAIL = "support@innerspace.co.uk";
const LOGO_URL = "https://thxyqtvpzelhwnpvmrhu.supabase.co/storage/v1/object/public/product-images/email%2Finner-space-logo.png";

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a}
  .wrapper{max-width:600px;margin:0 auto;background:#ffffff}
  .header{padding:32px 40px;border-bottom:1px solid #e8e8e8;text-align:center;background:#1a1a1a}
  .header img{height:28px;width:auto}
  .body{padding:40px}
  .body h2{font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:300;letter-spacing:0.04em;margin:0 0 20px;color:#1a1a1a}
  .body p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#4a4a4a}
  .highlight-box{background:#fafafa;border-left:2px solid #f0aa47;padding:16px 20px;margin:24px 0}
  .highlight-box p{margin:0 0 8px;font-size:14px}
  .highlight-box p:last-child{margin:0}
  .footer{padding:24px 40px;border-top:1px solid #e8e8e8;text-align:center}
  .footer p{font-size:11px;color:#8a8a8a;margin:0 0 4px;letter-spacing:0.04em}
  table.details{width:100%;border-collapse:collapse;margin:16px 0}
  table.details td{padding:10px 0;border-bottom:1px solid #f0eeeb;font-size:14px;vertical-align:top}
  table.details td:first-child{font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#8a8a8a;width:180px}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header"><img src="${LOGO_URL}" alt="Inner Space" /></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Inner Space — Premium Tiles</p>
    <p>support@innerspace.co.uk</p>
  </div>
</div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData } = await req.json();
    const { name, email, tel, deliveryPostcode, estimatedQuantity, productName } = formData;

    // Save to database first so we never lose a lead
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("interest_submissions").insert({
      product_name: productName || null,
      email,
      name: name || null,
      tel: tel || null,
      delivery_postcode: deliveryPostcode || null,
      estimated_quantity: estimatedQuantity || null,
    });

    if (dbError) {
      console.error("Failed to save interest submission to DB:", dbError);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured", saved: !dbError }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tileProduct = productName || 'Not specified';

    const html = emailLayout(`
      <h2>Register Interest — ${tileProduct}</h2>
      <p>A new interest registration has been received.</p>
      <table class="details">
        <tr><td>Product</td><td><strong>${tileProduct}</strong></td></tr>
        <tr><td>Name</td><td>${name}</td></tr>
        <tr><td>Email</td><td>${email}</td></tr>
        ${tel ? `<tr><td>Tel</td><td>${tel}</td></tr>` : ''}
        <tr><td>Delivery Postcode</td><td>${deliveryPostcode}</td></tr>
        <tr><td>Est. Quantity</td><td>${estimatedQuantity}</td></tr>
      </table>
      <div class="highlight-box">
        <p>Follow up with this customer to discuss their requirements.</p>
      </div>
    `);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Register Interest — ${tileProduct} — ${name}`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data, saved: !dbError }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending register interest email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
