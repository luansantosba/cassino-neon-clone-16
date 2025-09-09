-- Update the signup trigger to include referrer_id
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile data from signup metadata
  INSERT INTO public.profiles (id, full_name, email, whatsapp, cpf, referrer_id, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'referrer_id', ''),
    0.00
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp),
    cpf = COALESCE(EXCLUDED.cpf, profiles.cpf),
    referrer_id = COALESCE(EXCLUDED.referrer_id, profiles.referrer_id),
    updated_at = NOW();

  -- Also save credentials for recovery with proper conflict handling
  INSERT INTO public.user_credentials (user_id, email, full_name, whatsapp, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', '')
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_credentials.full_name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_credentials.whatsapp),
    cpf = COALESCE(EXCLUDED.cpf, user_credentials.cpf),
    updated_at = NOW()
  WHERE user_credentials.cpf != COALESCE(NEW.raw_user_meta_data->>'cpf', '');

  RETURN NEW;
END;
$$;