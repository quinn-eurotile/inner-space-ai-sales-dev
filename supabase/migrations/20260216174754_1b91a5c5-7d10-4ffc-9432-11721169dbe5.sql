
-- Create site_settings table for admin-controlled page configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Settings are viewable by everyone"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.site_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('allocation_end_date', (now() + interval '14 days')::text),
  ('allocation_open', 'true'),
  ('hero_heading', 'Miami Grande Bianco'),
  ('hero_subheading', '120×120cm — Made in Italy'),
  ('hero_description', 'This allocation has been secured directly from production and is available in confirmed bulk quantities (over 57 sq.m only). Suitable for walls and floors, with matching 20mm outdoor option.'),
  ('allocation_notice', 'Limited Factory Allocation'),
  ('min_order_label', 'Min. order 57 sq.m');
