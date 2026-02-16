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
    const { sampleOrderId, trackingNumber }: { sampleOrderId: string; trackingNumber: string } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Update sample order with tracking
    await supabase.from('sample_orders').update({
      tracking_number: trackingNumber,
      dispatched_at: new Date().toISOString(),
      status: 'dispatched',
    }).eq('id', sampleOrderId);

    // Fetch the order
    const { data: order } = await supabase.from('sample_orders').select('*').eq('id', sampleOrderId).single();
    if (!order) throw new Error('Sample order not found');

    const customerHtml = emailLayout(`
      <h2>Your Sample Has Been Dispatched</h2>
      <p>Dear ${order.name},</p>
      <p>Great news — your tile sample is on its way!</p>
      <table class="details">
        <tr><td>Tracking Number</td><td><strong>${trackingNumber}</strong></td></tr>
        <tr><td>Delivery Address</td><td>${order.address}, ${order.postcode}</td></tr>
      </table>
      <div class="highlight-box">
        <p>Your sample should arrive within <strong>2–3 working days</strong>.</p>
      </div>
      <p>Once you've received your sample, if you'd like to proceed with a reservation, visit our website to secure your allocation.</p>
      <p>If you have any questions, reply to this email or contact us at support@innerspace.co.uk.</p>
      <p>Best regards,<br>The Inner Space Team</p>
    `);

    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [order.email], reply_to: REPLY_TO, subject: "Your Sample Has Been Dispatched — Inner Space", html: customerHtml }),
    });

    const resendData = await result.json();

    await supabase.from('email_events').insert({
      email_type: 'sample_dispatched',
      recipient_email: order.email,
      recipient_name: order.name,
      related_id: sampleOrderId,
      related_table: 'sample_orders',
      resend_id: resendData.id || null,
      utm_source: 'transactional',
      utm_medium: 'email',
      utm_campaign: 'sample_dispatched',
      metadata: { tracking_number: trackingNumber },
    });

    return new Response(JSON.stringify({ message: "Dispatched email sent" }), {
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
