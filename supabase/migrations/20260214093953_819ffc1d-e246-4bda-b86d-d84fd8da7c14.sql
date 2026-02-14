
-- Create surcharge_type enum
CREATE TYPE public.surcharge_type AS ENUM ('none', 'per_sqm', 'quote_required');

-- Create match_type enum
CREATE TYPE public.match_type AS ENUM ('DISTRICT', 'AREA');

-- Delivery zones table
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_code TEXT NOT NULL UNIQUE,
  tier_label TEXT NOT NULL,
  surcharge_type surcharge_type NOT NULL DEFAULT 'none',
  surcharge_per_sqm NUMERIC NOT NULL DEFAULT 0,
  luxury_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery zones viewable by everyone"
  ON public.delivery_zones FOR SELECT USING (true);

CREATE POLICY "Admins can manage delivery zones"
  ON public.delivery_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Postcode rules table
CREATE TABLE public.postcode_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_type match_type NOT NULL,
  pattern TEXT NOT NULL,
  zone_id UUID NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.postcode_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Postcode rules viewable by everyone"
  ON public.postcode_rules FOR SELECT USING (true);

CREATE POLICY "Admins can manage postcode rules"
  ON public.postcode_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_postcode_rules_pattern ON public.postcode_rules(pattern);
CREATE INDEX idx_postcode_rules_active ON public.postcode_rules(active);

-- Postcode checks logging table
CREATE TABLE public.postcode_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_postcode_input TEXT NOT NULL,
  normalized_postcode TEXT NOT NULL,
  extracted_area TEXT,
  extracted_district TEXT,
  matched_rule_id UUID REFERENCES public.postcode_rules(id),
  zone_id UUID REFERENCES public.delivery_zones(id),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.postcode_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert postcode checks"
  ON public.postcode_checks FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view postcode checks"
  ON public.postcode_checks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed delivery zones
INSERT INTO public.delivery_zones (tier_code, tier_label, surcharge_type, surcharge_per_sqm, luxury_message) VALUES
('S', 'Tier S – Standard tariff', 'none', 0, 'Standard UK kerbside delivery applies to this postcode. No additional delivery tariff.'),
('A', 'Tier A – Additional handling tariff', 'per_sqm', 1.75, 'Some locations require additional carrier controls and tariffs due to route restrictions and handling requirements. Your delivery falls into Tier A, which adds +£1.75 per m². This is a pass-through logistics cost (not a product markup). Please confirm delivery before purchasing.'),
('B', 'Tier B – Additional handling tariff', 'per_sqm', 2.50, 'Some locations require additional carrier controls and tariffs due to route restrictions and handling requirements. Your delivery falls into Tier B, which adds +£2.50 per m². This is a pass-through logistics cost (not a product markup). Please confirm delivery before purchasing.'),
('C', 'Tier C – Additional handling tariff', 'per_sqm', 3.50, 'Some locations require additional carrier controls and tariffs due to route restrictions and handling requirements. Your delivery falls into Tier C, which adds +£3.50 per m². This is a pass-through logistics cost (not a product markup). Please confirm delivery before purchasing.'),
('D', 'Tier D – Additional handling tariff', 'per_sqm', 5.00, 'Some locations require additional carrier controls and tariffs due to route restrictions and handling requirements. Your delivery falls into Tier D, which adds +£5.00 per m². This is a pass-through logistics cost (not a product markup). Please confirm delivery before purchasing.'),
('Q', 'Tier Q – Quotation required', 'quote_required', 0, 'Your location requires a bespoke carrier quote due to route restrictions and handling controls. We''ll confirm delivery pricing before you purchase.');
