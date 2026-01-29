import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReservationData {
  name: string;
  email: string;
  phone: string;
  requiredQuantitySqm: number;
  needOutdoorTile: boolean;
  deliveryAddress: string;
  requiredDeliveryDate?: string;
  heldUntil: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservation }: { reservation: ReservationData } = await req.json();

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - skipping email");
      return new Response(
        JSON.stringify({ message: "Email sending not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const heldUntilDate = new Date(reservation.heldUntil);
    const formattedDate = heldUntilDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailHtml = `
      <h1>New Reservation Request</h1>
      <h2>Customer Details</h2>
      <p><strong>Name:</strong> ${reservation.name}</p>
      <p><strong>Email:</strong> ${reservation.email}</p>
      <p><strong>Phone:</strong> ${reservation.phone}</p>
      
      <h2>Order Details</h2>
      <p><strong>Required Quantity:</strong> ${reservation.requiredQuantitySqm} SQ.M</p>
      <p><strong>Need Outdoor Tile:</strong> ${reservation.needOutdoorTile ? 'Yes' : 'No'}</p>
      <p><strong>Delivery Address:</strong> ${reservation.deliveryAddress}</p>
      ${reservation.requiredDeliveryDate ? `<p><strong>Required Delivery Date:</strong> ${reservation.requiredDeliveryDate}</p>` : ''}
      
      <h2>Reservation Status</h2>
      <p><strong>Provisionally held until:</strong> ${formattedDate}</p>
      <p style="color: #ff8c00;"><strong>Action Required:</strong> Contact customer within 7 days to confirm reservation.</p>
    `;

    const customerEmailHtml = `
      <h1>Your Reservation Request</h1>
      <p>Dear ${reservation.name},</p>
      <p>Thank you for your reservation request for Miami Grande Bianco tiles.</p>
      
      <h2>Order Summary</h2>
      <p><strong>Required Quantity:</strong> ${reservation.requiredQuantitySqm} SQ.M</p>
      <p><strong>Need Outdoor Tile:</strong> ${reservation.needOutdoorTile ? 'Yes' : 'No'}</p>
      <p><strong>Delivery Address:</strong> ${reservation.deliveryAddress}</p>
      ${reservation.requiredDeliveryDate ? `<p><strong>Required Delivery Date:</strong> ${reservation.requiredDeliveryDate}</p>` : ''}
      
      <h2>What Happens Next?</h2>
      <p>Your reservation is <strong>provisionally held until ${formattedDate}</strong>.</p>
      <p>An Inner Space representative will contact you shortly to finalise details and confirm your order.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>The Inner Space Team</p>
    `;

    const emailPromises = [];

    // Send to admin
    if (adminEmail) {
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Inner Space <noreply@resend.dev>",
            to: [adminEmail],
            subject: `New Reservation Request - ${reservation.name}`,
            html: emailHtml,
          }),
        })
      );
    }

    // Send to customer
    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Inner Space <noreply@resend.dev>",
          to: [reservation.email],
          subject: "Your Reservation Request - Inner Space",
          html: customerEmailHtml,
        }),
      })
    );

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ message: "Emails sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending reservation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
