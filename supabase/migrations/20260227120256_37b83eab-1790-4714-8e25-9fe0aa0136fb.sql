ALTER TABLE public.products ADD COLUMN page_type text NOT NULL DEFAULT 'product_sale';
ALTER TABLE public.products ADD COLUMN product_category text NOT NULL DEFAULT 'tiles';