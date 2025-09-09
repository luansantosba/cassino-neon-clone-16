-- Fix the search_path security issue for the new function
CREATE OR REPLACE FUNCTION public.ensure_admin_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin user
  IF NEW.email = 'admgeral@gmail.com' THEN
    -- Insert or update profile for admin user
    INSERT INTO public.profiles (id, full_name, email, balance)
    VALUES (
      NEW.id,
      'Administrador Geral',
      NEW.email,
      0.00
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = 'Administrador Geral',
      email = NEW.email,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Now call the edge function to create the admin user
SELECT net.http_post(
  url := 'https://yhewlncfxsorfzcoryxd.supabase.co/functions/v1/create-admin',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXdsbmNmeHNvcmZ6Y29yeXhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxODA3MSwiZXhwIjoyMDcxMTk0MDcxfQ.NN7n0eN6K8ZN8dpLHYGyRl1W4BjqgG8bH5G_rTYZd1w"}'::jsonb,
  body := '{}'::jsonb
) as request_id;