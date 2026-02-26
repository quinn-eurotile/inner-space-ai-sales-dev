
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_label text NOT NULL,
  nominal_size text,
  thickness_mm integer,
  width_mm integer,
  length_mm integer,
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
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
