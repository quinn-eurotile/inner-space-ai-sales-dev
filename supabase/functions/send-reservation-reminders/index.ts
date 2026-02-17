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
  .header{padding:32px 40px;border-bottom:1px solid #e8e8e8;text-align:center;background:#1a1a1a}
  .header img{height:28px;width:auto}
  .body{padding:40px}
  .body h2{font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:300;letter-spacing:0.04em;margin:0 0 20px;color:#1a1a1a}
  .body p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#4a4a4a}
  .highlight-box{background:#fafafa;border-left:2px solid #EEA743;padding:16px 20px;margin:24px 0}
  .highlight-box p{margin:0 0 8px;font-size:14px}
  .highlight-box p:last-child{margin:0}
  .urgent-box{background:#fef3e5;border-left:2px solid #e8760a;padding:16px 20px;margin:24px 0}
  .urgent-box p{margin:0 0 8px;font-size:14px;color:#1a1a1a}
  .urgent-box p:last-child{margin:0}
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date();

    // Day 4 reminders: reservations created ~4 days ago, still pending
    const day4Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000); // 4 days - 30min
    const day4End = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000);   // 4 days + 30min

    // Day 7 reminders: reservations created ~7 days ago, still pending
    const day7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000);
    const day7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000);

    // Check which reminders have already been sent to avoid duplicates
    const { data: existingEvents } = await supabase
      .from('email_events')
      .select('related_id, email_type')
      .in('email_type', ['reservation_reminder_day4', 'reservation_reminder_day7'])
      .gte('created_at', day7Start.toISOString());

    const sentDay4 = new Set(existingEvents?.filter(e => e.email_type === 'reservation_reminder_day4').map(e => e.related_id) || []);
    const sentDay7 = new Set(existingEvents?.filter(e => e.email_type === 'reservation_reminder_day7').map(e => e.related_id) || []);

    // Fetch pending reservations in the Day 4 window
    const { data: day4Reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', day4Start.toISOString())
      .lte('created_at', day4End.toISOString());

    // Fetch pending reservations in the Day 7 window
    const { data: day7Reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', day7Start.toISOString())
      .lte('created_at', day7End.toISOString());

    let sentCount = 0;

    // Send Day 4 reminders
    for (const res of day4Reservations || []) {
      if (sentDay4.has(res.id)) continue;

      const heldUntil = new Date(res.held_until).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const html = emailLayout(`
        <h2>Reservation Reminder</h2>
        <p>Dear ${res.name},</p>
        <p>This is a friendly reminder about your tile reservation with Inner Space.</p>
        <table class="details">
          <tr><td>Quantity</td><td>${res.required_quantity_sqm} SQ.M</td></tr>
          <tr><td>Held Until</td><td>${heldUntil}</td></tr>
        </table>
        <div class="highlight-box">
          <p>Your reservation is still being held. If you haven't heard from us yet, please don't worry — a representative will be in touch shortly to confirm the details of your order.</p>
        </div>
        <p>If you have any questions in the meantime, reply to this email or contact us at support@innerspace.co.uk.</p>
        <p>Best regards,<br>The Inner Space Team</p>
      `);

      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [res.email], reply_to: REPLY_TO, subject: "Reservation Reminder — Inner Space", html }),
      });
      const resendData = await result.json();

      await supabase.from('email_events').insert({
        email_type: 'reservation_reminder_day4',
        recipient_email: res.email,
        recipient_name: res.name,
        related_id: res.id,
        related_table: 'reservations',
        resend_id: resendData.id || null,
        utm_source: 'transactional', utm_medium: 'email', utm_campaign: 'reservation_reminder_day4',
      });
      sentCount++;
    }

    // Send Day 7 final reminders
    for (const res of day7Reservations || []) {
      if (sentDay7.has(res.id)) continue;

      const heldUntil = new Date(res.held_until).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const html = emailLayout(`
        <h2>Final Reminder — Reservation Expiring</h2>
        <p>Dear ${res.name},</p>
        <p>Your provisional tile reservation with Inner Space is due to expire.</p>
        <table class="details">
          <tr><td>Quantity</td><td>${res.required_quantity_sqm} SQ.M</td></tr>
          <tr><td>Expires</td><td>${heldUntil}</td></tr>
        </table>
        <div class="urgent-box">
          <p><strong>Your reservation will expire today.</strong> If you wish to proceed with your order, please contact us immediately so we can secure your allocation.</p>
        </div>
        <p>If we don't hear from you, your reserved stock will be released and made available to other customers.</p>
        <p>Contact us at support@innerspace.co.uk or reply to this email.</p>
        <p>Best regards,<br>The Inner Space Team</p>
      `);

      // Send to customer
      const custResult = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [res.email], reply_to: REPLY_TO, subject: "Final Reminder — Your Reservation Expires Today — Inner Space", html }),
      });
      const custData = await custResult.json();

      // Also notify admin
      const adminHtml = emailLayout(`
        <h2>Reservation Expiring Today</h2>
        <table class="details">
          <tr><td>Name</td><td>${res.name}</td></tr>
          <tr><td>Email</td><td>${res.email}</td></tr>
          <tr><td>Phone</td><td>${res.phone}</td></tr>
          <tr><td>Quantity</td><td>${res.required_quantity_sqm} SQ.M</td></tr>
        </table>
        <div class="urgent-box">
          <p><strong>Action Required:</strong> This reservation expires today. Contact the customer or release the stock.</p>
        </div>
      `);

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: ["support@innerspace.co.uk"], reply_to: REPLY_TO, subject: `Reservation Expiring — ${res.name}`, html: adminHtml }),
      });

      await supabase.from('email_events').insert({
        email_type: 'reservation_reminder_day7',
        recipient_email: res.email,
        recipient_name: res.name,
        related_id: res.id,
        related_table: 'reservations',
        resend_id: custData.id || null,
        utm_source: 'transactional', utm_medium: 'email', utm_campaign: 'reservation_reminder_day7',
      });
      sentCount++;
    }

    return new Response(JSON.stringify({ message: `Sent ${sentCount} reminder(s)` }), {
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
