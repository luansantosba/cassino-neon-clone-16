-- Ensure unique bdc### referral codes and auto-assign for all users
-- 1) Create unique index on profiles.referral_id (partial to allow nulls)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'profiles_referral_id_unique'
  ) THEN
    CREATE UNIQUE INDEX profiles_referral_id_unique ON public.profiles (referral_id) WHERE referral_id IS NOT NULL;
  END IF;
END$$;

-- 2) Create trigger to set default bdc code on insert/update when missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_default_referral_code_on_insupd'
  ) THEN
    CREATE TRIGGER set_default_referral_code_on_insupd
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_referral_code();
  END IF;
END$$;

-- 3) Backfill existing profiles with proper codes
UPDATE public.profiles
SET referral_id = public.generate_bdc_referral_id(), updated_at = NOW()
WHERE referral_id IS NULL
   OR referral_id = '000000'
   OR referral_id !~ '^bdc[0-9]{3}$';
