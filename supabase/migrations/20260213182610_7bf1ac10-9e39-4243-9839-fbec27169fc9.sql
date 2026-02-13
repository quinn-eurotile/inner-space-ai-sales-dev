
CREATE TABLE public.sample_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sample_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create sample orders"
ON public.sample_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view sample orders by email"
ON public.sample_orders
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sample orders"
ON public.sample_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sample_orders_updated_at
BEFORE UPDATE ON public.sample_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
