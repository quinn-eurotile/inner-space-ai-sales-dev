
-- Add tracking columns to sample_orders
ALTER TABLE public.sample_orders
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS dispatched_at timestamp with time zone;

-- Create email_events table for UTM and event tracking
CREATE TABLE public.email_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  related_id uuid,
  related_table text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  resend_id text,
  status text NOT NULL DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view email events
CREATE POLICY "Admins can manage email events"
ON public.email_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions need to insert (service role)
CREATE POLICY "Service can insert email events"
ON public.email_events
FOR INSERT
WITH CHECK (true);

-- Add index for lookups
CREATE INDEX idx_email_events_related ON public.email_events(related_table, related_id);
CREATE INDEX idx_email_events_type ON public.email_events(email_type);
CREATE INDEX idx_email_events_recipient ON public.email_events(recipient_email);

-- Add index on reservations for reminder cron (find pending reservations by age)
CREATE INDEX idx_reservations_status_created ON public.reservations(status, created_at);
