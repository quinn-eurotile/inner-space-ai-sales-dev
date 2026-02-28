CREATE TABLE public.interest_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name text,
  email text NOT NULL,
  name text,
  tel text,
  delivery_postcode text,
  estimated_quantity text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interest submissions"
  ON public.interest_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view interest submissions"
  ON public.interest_submissions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage interest submissions"
  ON public.interest_submissions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));