-- Allow anonymous users to update sample_orders status to 'confirmed' (needed after Stripe payment redirect)
CREATE POLICY "Anyone can update sample order status" 
ON public.sample_orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);
