-- Add custom_message field to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS custom_message TEXT;