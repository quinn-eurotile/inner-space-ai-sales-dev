# REBUILD PROMPT — Inner Space Tile Allocation Landing Page

> **Use this prompt in a NEW Lovable project (with Lovable Cloud DISABLED) to recreate the full app with your own external Supabase project.**

---

## 0. EXTERNAL SUPABASE SETUP (DO THIS FIRST)

This project connects to your own Supabase project — NOT Lovable Cloud.

### Step 1: Create Supabase Client

Create `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Replace `YOUR_PROJECT_ID` and `YOUR_ANON_KEY` with values from your Supabase dashboard → Settings → API.

### Step 2: Edge Function Secrets

In your Supabase dashboard → Settings → Edge Functions → Secrets, add:
- `RESEND_API_KEY` — from resend.com
- `STRIPE_SECRET_KEY` — from Stripe dashboard (if using paid samples)

The following are auto-configured by Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Storage

Create a public storage bucket called `product-images` in Supabase dashboard → Storage.

### Step 4: Auth

Create an admin user in Supabase Auth, then manually insert a row into `user_roles`:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('YOUR_AUTH_USER_ID', 'admin');
```

---

## 1. DESIGN SYSTEM

**Fonts:** Playfair Display (headings, weight 300) + Inter (body). Import via Google Fonts.

**Color tokens (HSL in index.css):**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 10%;
  --surface: 0 0% 98%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 10%;
  --primary: 0 0% 7%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 10%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 42%;
  --accent: 0 0% 96%;
  --accent-foreground: 0 0% 10%;
  --destructive: 0 60% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 91%;
  --input: 0 0% 91%;
  --ring: 0 0% 7%;
  --success: 142 50% 40%;
  --success-foreground: 0 0% 100%;
  --brand-accent: 36 78% 60%;
  --radius: 0.25rem;
}
```

**No dark mode** — the `.dark` class uses identical values to `:root`.

**Tailwind config extras:** `success`, `brand-accent`, `surface` colors. Custom font sizes `h1`, `h1-lg`, `h2`, `h2-lg`. Custom animations: `countdown-pulse`, `stock-decrease`.

**CSS utility classes:**
- `.section-container` — max-w-[1180px] mx-auto px-6 sm:px-8 lg:px-10
- `.section-label` — uppercase 13px tracking, with gold `::before` bar (24px wide, 1px, brand-accent color)
- `.section-label--center` — centered variant
- `.section-divider` — border-t border-border
- `.section-alt` — background: hsl(var(--surface))
- `.hover-accent-underline:hover` — underline with brand-accent color
- `.animate-fade-in`, `.animate-fade-in-up`

**Aesthetic:** Monochrome luxury, no rounded corners, sharp edges. Gold accent (#f0aa47 / brand-accent) used sparingly for CTAs and decorative bars. No gradients. Generous whitespace.

---

## 2. DATABASE SCHEMA

Run these SQL migrations in your Supabase SQL Editor:

### Enums
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.match_type AS ENUM ('DISTRICT', 'AREA');
CREATE TYPE public.surcharge_type AS ENUM ('none', 'per_sqm', 'quote_required');
```

### Tables

```sql
-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  collection text,
  origin text,
  price_per_sqm numeric,
  price_per_tile numeric,
  factory_rating text,
  tile_colour text,
  thickness_mm numeric,
  width_mm numeric,
  length_mm numeric,
  nominal_size text,
  finish text,
  matching_outdoor_option boolean DEFAULT false,
  shape text,
  suitability text,
  underfloor_heating_compatible boolean DEFAULT false,
  tile_style text,
  edge text,
  slip_rating text,
  no_tile_faces text,
  material text,
  frost_resistant boolean DEFAULT false,
  wear_layer_mm numeric,
  sqm_per_tile numeric,
  tiles_per_box integer,
  sqm_per_box numeric,
  kg_per_box numeric,
  boxes_per_pallet integer,
  sqm_per_pallet numeric,
  stock_allocation integer DEFAULT 0,
  stock_sold integer DEFAULT 0,
  stock_reserved_manual numeric DEFAULT 0,
  google_drive_link text,
  data_sheet_url text,
  page_type text NOT NULL DEFAULT 'product_sale',
  product_category text NOT NULL DEFAULT 'tiles',
  samples_chargeable boolean NOT NULL DEFAULT true,
  is_active boolean DEFAULT true,
  min_order_sqm numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PRODUCT VARIANTS
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_label text NOT NULL,
  nominal_size text,
  thickness_mm numeric,
  width_mm numeric,
  length_mm numeric,
  price_per_sqm numeric,
  price_per_tile numeric,
  stock_allocation integer DEFAULT 0,
  stock_sold integer DEFAULT 0,
  stock_reserved_manual numeric DEFAULT 0,
  sqm_per_tile numeric,
  tiles_per_box integer,
  sqm_per_box numeric,
  kg_per_box numeric,
  boxes_per_pallet integer,
  sqm_per_pallet numeric,
  data_sheet_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PRODUCT IMAGES
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SAMPLE ORDERS
CREATE TABLE public.sample_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  postcode text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tracking_number text,
  dispatched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RESERVATIONS
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  required_quantity_sqm numeric NOT NULL,
  need_outdoor_tile boolean DEFAULT false,
  delivery_door_house text,
  delivery_street text,
  delivery_city text,
  delivery_postcode text NOT NULL,
  required_delivery_date date,
  held_until timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- INTEREST SUBMISSIONS
CREATE TABLE public.interest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  tel text,
  delivery_postcode text,
  estimated_quantity text,
  product_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DELIVERY ZONES
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code text NOT NULL,
  tier_label text NOT NULL,
  surcharge_type surcharge_type NOT NULL DEFAULT 'none',
  surcharge_per_sqm numeric NOT NULL DEFAULT 0,
  luxury_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- POSTCODE RULES
CREATE TABLE public.postcode_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type match_type NOT NULL,
  pattern text NOT NULL,
  zone_id uuid NOT NULL REFERENCES delivery_zones(id),
  priority integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- POSTCODE CHECKS
CREATE TABLE public.postcode_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_postcode_input text NOT NULL,
  normalized_postcode text NOT NULL,
  extracted_area text,
  extracted_district text,
  matched_rule_id uuid REFERENCES postcode_rules(id),
  zone_id uuid REFERENCES delivery_zones(id),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- EMAIL EVENTS
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  related_id uuid,
  related_table text,
  resend_id text,
  status text NOT NULL DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

### Functions & Triggers

```sql
-- has_role function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sample_orders_updated_at BEFORE UPDATE ON sample_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Enable Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
```

---

## 3. RLS POLICIES

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE postcode_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE postcode_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: public read, admin full
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PRODUCT VARIANTS: public read, admin full
CREATE POLICY "Variants viewable by everyone" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON product_variants FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PRODUCT IMAGES: public read, admin full
CREATE POLICY "Product images are viewable by everyone" ON product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON product_images FOR ALL USING (has_role(auth.uid(), 'admin'));

-- SAMPLE ORDERS: public insert/read/update, admin full
CREATE POLICY "Anyone can create sample orders" ON sample_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view sample orders by email" ON sample_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update sample order status" ON sample_orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage sample orders" ON sample_orders FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RESERVATIONS: public insert/read, admin full
CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own reservations by email" ON reservations FOR SELECT USING (true);
CREATE POLICY "Admins can manage reservations" ON reservations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- INTEREST SUBMISSIONS: public insert, admin read
CREATE POLICY "Anyone can insert interest submissions" ON interest_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view interest submissions" ON interest_submissions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage interest submissions" ON interest_submissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- DELIVERY ZONES: public read, admin full
CREATE POLICY "Delivery zones viewable by everyone" ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery zones" ON delivery_zones FOR ALL USING (has_role(auth.uid(), 'admin'));

-- POSTCODE RULES: public read, admin full
CREATE POLICY "Postcode rules viewable by everyone" ON postcode_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage postcode rules" ON postcode_rules FOR ALL USING (has_role(auth.uid(), 'admin'));

-- POSTCODE CHECKS: public insert, admin read
CREATE POLICY "Anyone can insert postcode checks" ON postcode_checks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view postcode checks" ON postcode_checks FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- EMAIL EVENTS: public insert, admin full
CREATE POLICY "Service can insert email events" ON email_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage email events" ON email_events FOR ALL USING (has_role(auth.uid(), 'admin'));

-- SITE SETTINGS: public read, admin full
CREATE POLICY "Settings are viewable by everyone" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON site_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROFILES: own read/insert/update
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- USER ROLES: own read, admin full
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## 4. ROUTES

```
/ → Index (loads first active product)
/:slug → ProductPage (loads product by slug, supports variants)
/thank-you → ThankYou (conversion tracking page)
/admin/login → AdminLogin
/admin → AdminDashboard (protected, requires admin role)
```

**IMPORTANT:** The `/thank-you` route MUST be defined BEFORE the `/:slug` catch-all route.

---

## 5. COMPONENTS

### StockBanner
Black bar at page top. Shows "X pallets remaining · Y sq.m". Calculates: remaining = allocation - sold - manual_reserved - online_reserved. Fetches active reservations (excluding released/cancelled/expired/sold statuses).

### ImageCarousel
Square aspect ratio main image + thumbnail strip (3 visible, scroll arrows). Click opens lightbox dialog. Uses Supabase storage image transform URLs: replace `/storage/v1/object/public/` with `/storage/v1/render/image/public/` + `?width=X&quality=Y&resize=contain`.

### OrderSampleInline (Primary CTA)
Gold button "Order Your Free Sample" that expands inline. **2-step form:**
- Step 1: Email only → Continue
- Step 2: Name, phone, address, postcode, optional estimated quantity → "Send My Free Sample"

On submit: inserts into `sample_orders` (status: 'confirmed'), optionally inserts into `interest_submissions` if quantity provided, calls `send-sample-confirmation` edge function, fires Meta Pixel `Lead` event, navigates to `/thank-you`.

Button style: `backgroundColor: '#f0aa47', color: '#ffffff'`, hover: `#d4913a`.

### CountdownTimer
Takes `endDate` string prop. Shows days:hrs:min:sec countdown. Displays "Allocation closes {date}". Calls `onExpired` callback when done.

### ProductStockIndicator
Shows "Initial Allocation" and "Remaining" in serif font. Subscribes to realtime changes on `products` and `reservations` tables. Gold accent bar under remaining number.

### ReservationRequestForm
Full form: name, email, phone, quantity (with min order validation), outdoor tile radio (yes/no), delivery address (door/house, street, city, postcode), delivery date picker (calendar popover, min 3 weeks from now). Max reservation 200 sq.m per email.

Before submitting, validates form then shows terms screen. Checks if email has a confirmed sample_order — if not, shows error with link to order sample first. If verified, shows "Complete Reservation" button.

On submit: checks existing reservations for email (cap at 200 sq.m total), inserts reservation with 7-day hold, calls `send-reservation-email` edge function, fires Pinterest `addtocart` event.

Includes inline `PostcodeChecker` for delivery zone lookup. Stores delivery zone info in admin_notes.

### PostcodeChecker
Input + "Check" button. Extracts area (letters) and district (outward code) from postcode. Matches against `postcode_rules` (DISTRICT first, then AREA by priority). Falls back to tier 'S' (standard). Shows zone result with surcharge info and optional surcharge estimator. Logs check to `postcode_checks` table with UTM params.

### TechnicalSpecs
Two-column grid of spec rows. Supports `productCategory` prop ('wood' changes labels like "Tile Colour" → "Colour"). Boolean values show Check/X icons. Filters out null/undefined specs.

### SampleOrderDialog
Dialog wrapper for sample ordering. Used within ReservationRequestForm when sample not verified. Supports both paid (Stripe redirect via `create-sample-checkout` edge function) and free sample flows. Handles `?sample_success=ID` and `?sample_cancelled=ID` URL params on return from Stripe.

### InterestForm
Simple form (name, email, postcode) shown when allocation is closed. Shows "You're on the list" confirmation.

### StickyMobileCTA
Fixed bottom bar on mobile (sm:hidden). Shows after 300px scroll. Displays price or product name + gold "Free Sample" button that scrolls to hero CTA.

### ShareButtons
WhatsApp, Email, LinkedIn share links + copy link button. Uses native Web Share API when available.

---

## 6. FAQ CONTENT

18 FAQ items in an Accordion. Some marked `allocationOnly: true` — filtered out when `isEnquiryOnly` prop is true.

1. **"Why is this tile £36 per sq.m?"** (allocationOnly) — Limited factory allocation at export pricing. First-quality Italian porcelain, not clearance. Once exhausted, pricing returns to standard showroom levels.
2. **"What is the minimum order?"** (allocationOnly) — 57 sq.m+ for allocation price. Smaller quantities at standard retail pricing.
3. **"Is VAT included?"** — All prices exclusive of VAT.
4. **"How do I secure the allocation price?"** (allocationOnly) — 1. Order sample, 2. Check delivery eligibility, 3. Reserve sq.m (max 200), 4. Full payment secures dispatch. 7-day hold.
5. **"What if I require more than 200 sq.m?"** (allocationOnly) — Submit quantity, max 200 reserved, rep contacts for remainder.
6. **"Why is full payment required upfront?"** (allocationOnly) — Stock secured against confirmed orders at this price. No deposit/staged payment terms on allocation releases.
7. **"Is the sample fee refundable?"** — No. Covers postage, handling, packaging. Not credited against order.
8. **"How long does delivery take?"** — ~3 weeks from cleared payment. Includes import coordination and transport scheduling.
9. **"What does delivery include?"** — Kerbside via tail lift. Client ensures HGV access + on-site personnel. Drivers not responsible beyond kerbside.
10. **"What happens if access is unsuitable?"** — £65 per pallet redelivery charge.
11. **"When does risk transfer?"** — All deliveries require signed acceptance. Risk transfers upon kerbside delivery.
12. **"What are Delivery Tiers?"** — Additional carrier tariffs by location. Per sq.m surcharge may apply. Confirm postcode before ordering.
13. **"How much additional material should I order?"** — 10-15% extra for waste, cutting, breakages, future spares. Example: 100 sq.m needed → order 110-115 sq.m.
14. **"What if I need more tiles later?"** (allocationOnly) — Additional at £75/sq.m retail. Shade/batch match not guaranteed. Secure full quantity at outset.
15. **"What is your breakage policy?"** (allocationOnly) — Inspect immediately. Photo evidence within 24hrs. Must exceed 5% surface area. Credit issued, no replacement shipments.
16. **"Do you offer storage?"** (allocationOnly) — 7 days free from requested dispatch date. Then £10/pallet/week.
17. **"Can I return allocation stock?"** (allocationOnly) — Per UK regs. £500/pallet transport. Full order only, unused, original condition. Ensure spec approval before confirming.
18. **"Do I need a trade account?"** — No. Available to private and professional clients under identical terms.
19. **"Is this suitable for all projects?"** — Suited to ground floors, open-plan, large-format contemporary interiors, indoor-outdoor continuity. Not ideal for small bathroom installations due to pallet quantities.

---

## 7. PAGE STRUCTURE

### Index Page (/)
Loads first active product from DB. Uses `useSiteSettings` hook for allocation_end_date and allocation_open.

If `allocation_open === 'false'` or countdown expired → show "AllocationClosed" view with InterestForm.

Layout order:
1. StockBanner
2. Header: Inner Space logo left, "Nationwide Delivery" right
3. Divider
4. Hero section (2-col on lg):
   - Left: ImageCarousel
   - Right: Eyebrow ("Italian Porcelain · 120×120cm · Matt Finish"), H1 with brand-accent "Factory Allocation" span, price £36/sq.m with strikethrough £75 + "Save 52%" badge + "ex. vat", OrderSampleInline gold CTA, "Reserve stock →" link, 4 trust bullets (AAA rated, Free kerbside delivery, Direct from Italian factory, Walls floors & outdoor), CountdownTimer, Download links (Google Drive images + PDF data sheet)
5. ProductStockIndicator (realtime)
6. Technical Specs (collapsible with show/hide toggle)
7. Reservation section (section-alt): ReservationRequestForm in bordered container
8. FAQ (collapsible)
9. Pre-footer tagline + dividers
10. Footer with logo
11. StickyMobileCTA (mobile only)

### ProductPage (/:slug)
Same layout as Index but loads product by slug. Supports product_variants with size selector buttons (styled as bordered pills, selected = bg-foreground text-background). Adapts labels based on product_category ('wood' vs 'tile'). Hides price/stock/reservation sections for non-sale products (page_type !== 'product_sale').

### ThankYou (/thank-you)
Centered layout. Check icon in muted circle + "Thank you for your enquiry" + back button. Fires Meta Pixel Lead event and Pinterest lead event on mount.

### AdminLogin (/admin/login)
Email + password form. Authenticates via Supabase Auth `signInWithPassword`. Checks `user_roles` for admin role. Redirects to /admin. Sign out if not admin.

### AdminDashboard (/admin)
Protected route (redirects to /admin/login if no admin session). Tabs:

**Products tab:** 3-col layout. Left sidebar: product list with New button. Right: edit form with sections:
- Page Setup (page_type toggle, product_category toggle, chargeable samples switch, min order qty)
- Basic Info (name, slug, collection, origin, material, factory_rating)
- Pricing & Stock (price_per_sqm, price_per_tile, stock_allocation, stock_sold)
- Size Variants (add/edit/delete, each with dimensions, pricing, stock, data sheet upload)
- Tile Details (colour, style, finish, dimensions, nominal_size, slip_rating, edge, shape, suitability, no_tile_faces)
- Boolean toggles (matching_outdoor, underfloor_heating, frost_resistant)
- Links (Google Drive link, data sheet PDF upload or URL)
- Landing Page Content (allocation notice, min order label, hero heading/subheading/description from site_settings)

**Reservations tab:** Product selector + table with name, email, phone, qty, outdoor, address, delivery date, status badges, held until, admin notes, confirm/cancel actions.

**Sample Orders tab:** Product selector + table with date, name, email, phone, address, postcode, status, mark dispatched/confirm/cancel actions.

**Images tab:** Product selector + hero/carousel upload zones + current images grid with delete.

**Settings tab:** Product selector + allocation timer (open/close switch, end date calendar picker) + stock allocation overview (total, manual reserved, sold, calculated remaining with online reserved breakdown).

---

## 8. HOOKS

### useSiteSettings
Fetches all rows from `site_settings` table. Returns settings object with defaults:
```typescript
{
  allocation_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  allocation_open: 'true',
  hero_heading: 'Miami Grande Bianco',
  hero_subheading: '120×120cm — Made in Italy',
  hero_description: '...',
  allocation_notice: 'Limited Factory Allocation',
  min_order_label: 'Min. order 57 sq.m',
}
```
Provides `updateSetting(key, value)` and `refetch()` functions.

---

## 9. EDGE FUNCTIONS

Deploy these to your Supabase project under `supabase/functions/`.

All use Resend API for emails. Shared email layout: white background, dark (#1a1a1a) header with logo image, serif headings, gold-accent (#EEA743) highlight boxes with left border, details tables.

**FROM_EMAIL:** `Inner Space <support@innerspace.co.uk>`
**REPLY_TO:** `support@innerspace.co.uk`
**LOGO_URL:** Update to your own hosted logo URL.

### send-sample-confirmation
Input: `{ sampleOrder: { id, name, email, phone, address, postcode, product_id } }`
Looks up product name. Sends customer confirmation (sample details + "reserve your tiles" CTA) + admin notification. Logs to email_events.

### send-reservation-email
Input: `{ reservation: { name, email, phone, requiredQuantitySqm, originalQuantitySqm, needOutdoorTile, deliveryAddress, requiredDeliveryDate, heldUntil } }`
Sends customer + admin emails. Handles >200 sq.m exceeded case with special messaging about rep contact.

### send-sample-dispatched
Input: `{ sampleOrderId, trackingNumber }`
Updates sample_order (tracking_number, dispatched_at, status='dispatched'). Sends tracking email to customer.

### send-reservation-reminders
Cron-style function (invoke daily). Finds pending reservations at Day 4 (friendly reminder) and Day 7 (urgent final + admin notification) windows (±30 min). Deduplicates via email_events table.

### send-register-interest
Input: `{ formData: { name, email, tel, deliveryPostcode, estimatedQuantity, productName } }`
Saves to interest_submissions + sends admin notification email with follow-up prompt.

### send-order-confirmed
Input: `{ order: { name, email, reservationId, quantitySqm, totalAmount, productName, deliveryAddress } }`
Sends customer order confirmation + admin notification.

### create-sample-checkout
Input: `{ name, email, phone, address, postcode, productId }`
Creates pending sample_order in DB. Creates Stripe checkout session (£7.00). Returns checkout URL. Requires `STRIPE_SECRET_KEY` secret. On success return, the SampleOrderDialog component handles `?sample_success=ID` URL param to confirm order.

---

## 10. TRACKING

### Meta Pixel
Fire `fbq('track', 'Lead')` on sample order completion and /thank-you page load.
Fire `fbq('track', 'Purchase', { value: 7.00, currency: 'GBP' })` on Stripe sample payment return.

### Pinterest Tag
Helper: `pinterestTrack(event, params)` calls `window.pintrk('track', event, params)`.
- `pagevisit` on index load
- `lead` on /thank-you
- `addtocart` on reservation submit (with value, quantity, currency)

---

## 11. SEED DATA

Insert a default delivery zone for standard delivery:
```sql
INSERT INTO delivery_zones (tier_code, tier_label, surcharge_type, surcharge_per_sqm, luxury_message)
VALUES ('S', 'Standard Delivery', 'none', 0, 'Free kerbside delivery included with your order.');
```

Insert default site settings:
```sql
INSERT INTO site_settings (setting_key, setting_value) VALUES
('allocation_open', 'true'),
('allocation_end_date', (now() + interval '14 days')::text),
('hero_heading', 'Miami Grande Bianco'),
('hero_subheading', '120×120cm — Made in Italy'),
('hero_description', 'This allocation has been secured directly from production and is available in confirmed bulk quantities (over 57 sq.m only). Suitable for walls and floors, with matching 20mm outdoor option.'),
('allocation_notice', 'Limited Factory Allocation'),
('min_order_label', 'Min. order 57 sq.m');
```

---

## 12. DEPENDENCIES

```
@supabase/supabase-js, @tanstack/react-query, react-router-dom, react-hook-form, @hookform/resolvers, zod, date-fns, lucide-react, sonner, embla-carousel-react, recharts, vaul, next-themes, class-variance-authority, clsx, tailwind-merge, tailwindcss-animate, cmdk, input-otp, react-day-picker, react-resizable-panels
```

Plus all @radix-ui primitives used by shadcn/ui.

---

## 13. IMPORTANT NOTES

- This is designed for an EXTERNAL Supabase project — create your own `client.ts` with your project URL and anon key
- All images served from Supabase Storage (`product-images` bucket) with transform URLs
- No dark mode (light theme only)
- Mobile-first responsive design
- All prices displayed ex. VAT
- Product slug routing: `/:slug` catches product pages
- The `thank-you` route must be defined BEFORE the `/:slug` catch-all
- Edge functions are deployed via Supabase CLI (`supabase functions deploy`)

---

**Start by setting up the database schema in your Supabase SQL Editor, then tell Lovable to build the design system and Index page with all components.**
