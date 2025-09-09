-- Create a trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile data from signup metadata
  INSERT INTO public.profiles (id, full_name, email, whatsapp, cpf, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    0.00
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp),
    cpf = COALESCE(EXCLUDED.cpf, profiles.cpf),
    updated_at = NOW();

  -- Also save credentials for recovery
  INSERT INTO public.user_credentials (user_id, email, full_name, whatsapp, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', '')
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_credentials.full_name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_credentials.whatsapp),
    cpf = COALESCE(EXCLUDED.cpf, user_credentials.cpf),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();