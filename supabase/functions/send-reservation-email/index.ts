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
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a}
  .wrapper{max-width:600px;margin:0 auto;background:#ffffff}
  .header{padding:32px 40px;border-bottom:1px solid #e8e6e3;text-align:center}
  .header h1{font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:0.08em;margin:0;color:#1a1a1a}
  .body{padding:40px}
  .body h2{font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;margin:0 0 16px;color:#1a1a1a}
  .body p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#4a4a4a}
  .detail-row{display:flex;padding:8px 0;border-bottom:1px solid #f0eeeb}
  .detail-label{font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#8a8a8a;width:180px;min-width:180px}
  .detail-value{font-size:14px;color:#1a1a1a}
  .highlight-box{background:#f7f7f5;border-left:3px solid #1a1a1a;padding:16px 20px;margin:24px 0}
  .highlight-box p{margin:0;font-size:14px}
  .cta-btn{display:inline-block;background:#1a1a1a;color:#ffffff;padding:12px 32px;text-decoration:none;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;margin:16px 0}
  .footer{padding:24px 40px;border-top:1px solid #e8e6e3;text-align:center}
  .footer p{font-size:11px;color:#8a8a8a;margin:0 0 4px}
  table.details{width:100%;border-collapse:collapse;margin:16px 0}
  table.details td{padding:8px 0;border-bottom:1px solid #f0eeeb;font-size:14px;vertical-align:top}
  table.details td:first-child{font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#8a8a8a;width:180px}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header"><h1>INNER SPACE</h1></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Inner Space | Premium Tiles</p>
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
  needOutdoorTile: boolean;
  deliveryDoorHouse?: string;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryPostcode: string;
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

    const deliveryAddress = [reservation.deliveryDoorHouse, reservation.deliveryStreet, reservation.deliveryCity, reservation.deliveryPostcode].filter(Boolean).join(', ');

    // Admin email
    const adminHtml = emailLayout(`
      <h2>New Reservation Request</h2>
      <p>A new reservation has been submitted.</p>
      <table class="details">
        <tr><td>Name</td><td>${reservation.name}</td></tr>
        <tr><td>Email</td><td>${reservation.email}</td></tr>
        <tr><td>Phone</td><td>${reservation.phone}</td></tr>
        <tr><td>Quantity</td><td>${reservation.requiredQuantitySqm} SQ.M</td></tr>
        <tr><td>Outdoor Tile</td><td>${reservation.needOutdoorTile ? 'Yes' : 'No'}</td></tr>
        <tr><td>Delivery Address</td><td>${deliveryAddress}</td></tr>
        ${reservation.requiredDeliveryDate ? `<tr><td>Delivery Date</td><td>${reservation.requiredDeliveryDate}</td></tr>` : ''}
        <tr><td>Held Until</td><td>${formattedDate}</td></tr>
      </table>
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
        <tr><td>Quantity</td><td>${reservation.requiredQuantitySqm} SQ.M</td></tr>
        <tr><td>Outdoor Tile</td><td>${reservation.needOutdoorTile ? 'Yes' : 'No'}</td></tr>
        <tr><td>Delivery Address</td><td>${deliveryAddress}</td></tr>
        ${reservation.requiredDeliveryDate ? `<tr><td>Preferred Delivery</td><td>${reservation.requiredDeliveryDate}</td></tr>` : ''}
      </table>
      <div class="highlight-box">
        <p>Your reservation is <strong>provisionally held until ${formattedDate}</strong>.</p>
        <p>An Inner Space representative will contact you shortly to finalise details.</p>
      </div>
      <p>If you have any questions, please reply to this email or contact us at support@innerspace.co.uk.</p>
      <p>Best regards,<br>The Inner Space Team</p>
    `);

    const emailPromises = [];

    // Send to admin (support@)
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

    // Send to customer
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

    // Log email events
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
