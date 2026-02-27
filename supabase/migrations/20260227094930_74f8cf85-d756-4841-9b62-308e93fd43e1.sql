ALTER TABLE public.products ALTER COLUMN thickness_mm TYPE numeric USING thickness_mm::numeric;
ALTER TABLE public.products ALTER COLUMN width_mm TYPE numeric USING width_mm::numeric;
ALTER TABLE public.products ALTER COLUMN length_mm TYPE numeric USING length_mm::numeric;
ALTER TABLE public.product_variants ALTER COLUMN thickness_mm TYPE numeric USING thickness_mm::numeric;
ALTER TABLE public.product_variants ALTER COLUMN width_mm TYPE numeric USING width_mm::numeric;
ALTER TABLE public.product_variants ALTER COLUMN length_mm TYPE numeric USING length_mm::numeric;