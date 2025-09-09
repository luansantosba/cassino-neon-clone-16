-- Create admin user directly using auth API call
-- This will be handled by calling the edge function manually

-- First, let's create a trigger that ensures admin users get proper profiles
CREATE OR REPLACE FUNCTION public.ensure_admin_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for admin profile creation
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'admgeral@gmail.com')
  EXECUTE FUNCTION public.ensure_admin_profile();