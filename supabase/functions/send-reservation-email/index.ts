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
  .highlight-box{background:#fafafa;border-left:2px solid #EEA743;padding:16px 20px;margin:24px 0}
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

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  requiredQuantitySqm: number;
  originalQuantitySqm?: number;
  needOutdoorTile: boolean;
  deliveryAddress: string;
  requiredDeliveryDate?: string;
  heldUntil: string;
  productName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservation, utm }: { reservation: ReservationData; utm?: Record<string, string> } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const heldUntilDate = new Date(reservation.heldUntil);
    const formattedDate = heldUntilDate.toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const formattedDeliveryDate = reservation.requiredDeliveryDate
      ? new Date(reservation.requiredDeliveryDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : null;

    const didExceed = reservation.originalQuantitySqm && reservation.originalQuantitySqm > reservation.requiredQuantitySqm;

    const quantityHtml = didExceed
      ? `<tr><td>Required</td><td>${reservation.originalQuantitySqm} sq.m</td></tr>
         <tr><td>Reserved</td><td>${reservation.requiredQuantitySqm} sq.m</td></tr>`
      : `<tr><td>Quantity</td><td>${reservation.requiredQuantitySqm} sq.m</td></tr>`;

    const exceedNote = didExceed
      ? `<div class="highlight-box">
          <p>Your order exceeds the maximum reservation of 200 sq.m per order. We have reserved ${reservation.requiredQuantitySqm} sq.m for you.</p>
          <p><strong>A sales representative will be in touch to facilitate the remainder of your order.</strong></p>
        </div>`
      : '';

    // Admin email
    const adminHtml = emailLayout(`
      <h2>New Reservation Request</h2>
      <p>A new reservation has been submitted.</p>
      <table class="details">
        <tr><td>Name</td><td>${reservation.name}</td></tr>
        <tr><td>Email</td><td>${reservation.email}</td></tr>
        <tr><td>Phone</td><td>${reservation.phone}</td></tr>
        ${quantityHtml}
        <tr><td>Outdoor Tile</td><td>${reservation.needOutdoorTile ? 'Yes' : 'No'}</td></tr>
        <tr><td>Delivery Address</td><td>${reservation.deliveryAddress}</td></tr>
        ${formattedDeliveryDate ? `<tr><td>Delivery Date</td><td>${formattedDeliveryDate}</td></tr>` : ''}
        <tr><td>Held Until</td><td>${formattedDate}</td></tr>
      </table>
      ${exceedNote}
      <div class="highlight-box">
        <p><strong>Action Required:</strong> Contact customer within 7 days to confirm reservation.</p>
      </div>
    `);

    // Customer email
    const customerHtml = emailLayout(`
      <h2>Your Reservation Request</h2>
      <p>Dear ${reservation.name},</p>
      <p>Thank you for your reservation request${reservation.productName ? ` for ${reservation.productName}` : ''}.</p>
      <table class="details">
        ${quantityHtml}
        <tr><td>Outdoor Tile</td><td>${reservation.needOutdoorTile ? 'Yes' : 'No'}</td></tr>
        <tr><td>Delivery Address</td><td>${reservation.deliveryAddress}</td></tr>
        ${formattedDeliveryDate ? `<tr><td>Preferred Delivery</td><td>${formattedDeliveryDate}</td></tr>` : ''}
      </table>
      ${exceedNote}
      <div class="highlight-box">
        <p>Your reservation is <strong>provisionally held until ${formattedDate}</strong>.</p>
        <p>An Inner Space representative will contact you shortly to finalise details.</p>
      </div>
      <p>If you have any questions, please reply to this email or contact us at support@innerspace.co.uk.</p>
      <p>Best regards,<br>The Inner Space Team</p>
    `);

    const emailPromises = [];

    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL, to: ["support@innerspace.co.uk"], reply_to: REPLY_TO,
          subject: `New Reservation Request — ${reservation.name}`,
          html: adminHtml,
        }),
      })
    );

    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL, to: [reservation.email], reply_to: REPLY_TO,
          subject: "Your Reservation Request — Inner Space",
          html: customerHtml,
        }),
      })
    );

    const results = await Promise.all(emailPromises);
    const resendIds: string[] = [];
    for (const r of results) {
      const d = await r.json();
      if (d.id) resendIds.push(d.id);
    }

    const baseUtm = {
      utm_source: utm?.utm_source || 'transactional',
      utm_medium: utm?.utm_medium || 'email',
      utm_campaign: utm?.utm_campaign || 'reservation_submitted',
      utm_content: utm?.utm_content || null,
    };

    await supabase.from('email_events').insert([
      { email_type: 'reservation_submitted_admin', recipient_email: 'support@innerspace.co.uk', recipient_name: 'Admin', related_table: 'reservations', resend_id: resendIds[0] || null, ...baseUtm },
      { email_type: 'reservation_submitted_customer', recipient_email: reservation.email, recipient_name: reservation.name, related_table: 'reservations', resend_id: resendIds[1] || null, ...baseUtm },
    ]);

    return new Response(JSON.stringify({ message: "Emails sent successfully" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending reservation email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
