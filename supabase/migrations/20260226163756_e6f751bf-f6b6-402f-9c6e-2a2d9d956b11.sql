ALTER TABLE public.products ADD COLUMN slug text UNIQUE;

-- Set a default slug for existing products based on name
UPDATE public.products SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));