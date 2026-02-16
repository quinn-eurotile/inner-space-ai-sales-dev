import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "Inner Space <support@innerspace.co.uk>";
const REPLY_TO = "support@innerspace.co.uk";
const LOGO_URL = "https://thxyqtvpzelhwnpvmrhu.supabase.co/storage/v1/object/public/product-images/email%2Finner-space-logo.png";

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a}
  .wrapper{max-width:600px;margin:0 auto;background:#ffffff}
  .header{padding:32px 40px;border-bottom:1px solid #e8e8e8;text-align:center}
  .header img{height:28px;width:auto}
  .body{padding:40px}
  .body h2{font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:300;letter-spacing:0.04em;margin:0 0 20px;color:#1a1a1a}
  .body p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#4a4a4a}
  .highlight-box{background:#fafafa;border-left:2px solid #EEA743;padding:16px 20px;margin:24px 0}
  .highlight-box p{margin:0 0 8px;font-size:14px}
  .highlight-box p:last-child{margin:0}
  .footer{padding:24px 40px;border-top:1px solid #e8e8e8;text-align:center}
  .footer p{font-size:11px;color:#8a8a8a;margin:0 0 4px;letter-spacing:0.04em}
  table.details{width:100%;border-collapse:collapse;margin:16px 0}
  table.details td{padding:10px 0;border-bottom:1px solid #f0eeeb;font-size:14px;vertical-align:top}
  table.details td:first-child{font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#8a8a8a;width:180px}
</style></head><body><div class="wrapper">
  <div class="header"><img src="${LOGO_URL}" alt="Inner Space" /></div>
  <div class="body">${content}</div>
  <div class="footer"><p>Inner Space — Premium Tiles</p><p>support@innerspace.co.uk</p></div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order, utm }: {
      order: {
        name: string; email: string; reservationId?: string;
        quantitySqm: number; totalAmount: number; productName?: string;
        deliveryAddress?: string;
      };
      utm?: Record<string, string>;
    } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const customerHtml = emailLayout(`
      <h2>Order Confirmed</h2>
      <p>Dear ${order.name},</p>
      <p>Thank you for your order. Your payment has been received and your tiles are being prepared.</p>
      <table class="details">
        ${order.productName ? `<tr><td>Product</td><td>${order.productName}</td></tr>` : ''}
        <tr><td>Quantity</td><td>${order.quantitySqm} SQ.M</td></tr>
        <tr><td>Total Paid</td><td>£${order.totalAmount.toFixed(2)}</td></tr>
        ${order.deliveryAddress ? `<tr><td>Delivery Address</td><td>${order.deliveryAddress}</td></tr>` : ''}
      </table>
      <div class="highlight-box">
        <p>We'll be in touch shortly to confirm your delivery schedule.</p>
      </div>
      <p>If you have any questions, reply to this email or contact us at support@innerspace.co.uk.</p>
      <p>Best regards,<br>The Inner Space Team</p>
    `);

    const adminHtml = emailLayout(`
      <h2>Order Confirmed — Payment Received</h2>
      <table class="details">
        <tr><td>Name</td><td>${order.name}</td></tr>
        <tr><td>Email</td><td>${order.email}</td></tr>
        <tr><td>Quantity</td><td>${order.quantitySqm} SQ.M</td></tr>
        <tr><td>Total</td><td>£${order.totalAmount.toFixed(2)}</td></tr>
        ${order.deliveryAddress ? `<tr><td>Delivery</td><td>${order.deliveryAddress}</td></tr>` : ''}
      </table>
    `);

    const results = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [order.email], reply_to: REPLY_TO, subject: "Order Confirmed — Inner Space", html: customerHtml }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: ["support@innerspace.co.uk"], reply_to: REPLY_TO, subject: `Order Confirmed — ${order.name}`, html: adminHtml }),
      }),
    ]);

    const resendIds: string[] = [];
    for (const r of results) { const d = await r.json(); if (d.id) resendIds.push(d.id); }

    const baseUtm = { utm_source: utm?.utm_source || 'transactional', utm_medium: utm?.utm_medium || 'email', utm_campaign: utm?.utm_campaign || 'order_confirmed', utm_content: utm?.utm_content || null };

    await supabase.from('email_events').insert([
      { email_type: 'order_confirmed_customer', recipient_email: order.email, recipient_name: order.name, related_id: order.reservationId || null, related_table: 'reservations', resend_id: resendIds[0] || null, ...baseUtm },
      { email_type: 'order_confirmed_admin', recipient_email: 'support@innerspace.co.uk', recipient_name: 'Admin', related_id: order.reservationId || null, related_table: 'reservations', resend_id: resendIds[1] || null, ...baseUtm },
    ]);

    return new Response(JSON.stringify({ message: "Order confirmed emails sent" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
