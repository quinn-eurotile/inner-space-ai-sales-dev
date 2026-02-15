import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "Inner Space <support@innerspace.co.uk>";
const REPLY_TO = "support@innerspace.co.uk";

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a}
  .wrapper{max-width:600px;margin:0 auto;background:#ffffff}
  .header{padding:32px 40px;border-bottom:1px solid #e8e6e3;text-align:center}
  .header h1{font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:0.08em;margin:0;color:#1a1a1a}
  .body{padding:40px}
  .body h2{font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;margin:0 0 16px;color:#1a1a1a}
  .body p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#4a4a4a}
  .highlight-box{background:#f7f7f5;border-left:3px solid #1a1a1a;padding:16px 20px;margin:24px 0}
  .highlight-box p{margin:0;font-size:14px}
  .footer{padding:24px 40px;border-top:1px solid #e8e6e3;text-align:center}
  .footer p{font-size:11px;color:#8a8a8a;margin:0 0 4px}
  table.details{width:100%;border-collapse:collapse;margin:16px 0}
  table.details td{padding:8px 0;border-bottom:1px solid #f0eeeb;font-size:14px;vertical-align:top}
  table.details td:first-child{font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#8a8a8a;width:180px}
</style></head><body><div class="wrapper">
  <div class="header"><h1>INNER SPACE</h1></div>
  <div class="body">${content}</div>
  <div class="footer"><p>Inner Space | Premium Tiles</p><p>support@innerspace.co.uk</p></div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sampleOrder, utm }: { sampleOrder: { id: string; name: string; email: string; phone: string; address: string; postcode: string }; utm?: Record<string, string> } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const customerHtml = emailLayout(`
      <h2>Sample Order Confirmed</h2>
      <p>Dear ${sampleOrder.name},</p>
      <p>Thank you for ordering a tile sample from Inner Space. Your payment has been received.</p>
      <table class="details">
        <tr><td>Sample</td><td>20×15cm Tile Sample</td></tr>
        <tr><td>Amount Paid</td><td>£7.00 (incl. P&P)</td></tr>
        <tr><td>Delivery Address</td><td>${sampleOrder.address}, ${sampleOrder.postcode}</td></tr>
      </table>
      <div class="highlight-box">
        <p>Your sample will be dispatched within <strong>24–48 hours</strong>. We'll send you a tracking notification once it's on its way.</p>
      </div>
      <p>If you have any questions, reply to this email or contact us at support@innerspace.co.uk.</p>
      <p>Best regards,<br>The Inner Space Team</p>
    `);

    // Admin notification to quinn@
    const adminHtml = emailLayout(`
      <h2>New Sample Order</h2>
      <table class="details">
        <tr><td>Name</td><td>${sampleOrder.name}</td></tr>
        <tr><td>Email</td><td>${sampleOrder.email}</td></tr>
        <tr><td>Phone</td><td>${sampleOrder.phone}</td></tr>
        <tr><td>Address</td><td>${sampleOrder.address}, ${sampleOrder.postcode}</td></tr>
      </table>
      <div class="highlight-box">
        <p><strong>Action:</strong> Dispatch sample within 24–48 hours.</p>
      </div>
    `);

    const results = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [sampleOrder.email], reply_to: REPLY_TO, subject: "Sample Order Confirmed — Inner Space", html: customerHtml }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: ["quinn@innerspace.co.uk"], reply_to: REPLY_TO, subject: `New Sample Order — ${sampleOrder.name}`, html: adminHtml }),
      }),
    ]);

    const resendIds: string[] = [];
    for (const r of results) { const d = await r.json(); if (d.id) resendIds.push(d.id); }

    const baseUtm = { utm_source: utm?.utm_source || 'transactional', utm_medium: utm?.utm_medium || 'email', utm_campaign: utm?.utm_campaign || 'sample_paid', utm_content: utm?.utm_content || null };

    await supabase.from('email_events').insert([
      { email_type: 'sample_paid_customer', recipient_email: sampleOrder.email, recipient_name: sampleOrder.name, related_id: sampleOrder.id, related_table: 'sample_orders', resend_id: resendIds[0] || null, ...baseUtm },
      { email_type: 'sample_paid_admin', recipient_email: 'quinn@innerspace.co.uk', recipient_name: 'Quinn', related_id: sampleOrder.id, related_table: 'sample_orders', resend_id: resendIds[1] || null, ...baseUtm },
    ]);

    return new Response(JSON.stringify({ message: "Emails sent" }), {
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
