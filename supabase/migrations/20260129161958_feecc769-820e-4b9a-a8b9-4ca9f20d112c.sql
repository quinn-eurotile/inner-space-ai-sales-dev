-- Enable realtime for products table to allow stock updates to be reflected in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;