-- Ensure referral codes use the new format and are unique
-- 1) Create trigger to set default referral code on insert
DROP TRIGGER IF EXISTS profiles_before_insert_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_before_insert_set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_default_referral_code();

-- 2) Update existing users to the new code format: bdc + 3 digits
UPDATE public.profiles
SET referral_id = public.generate_bdc_referral_id(),
    updated_at = NOW()
WHERE referral_id IS NULL
   OR referral_id = ''
   OR referral_id = '000000'
   OR referral_id !~ '^bdc[0-9]{3}$';

-- 3) Add a unique index to enforce uniqueness among non-null referral codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_profiles_referral_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_profiles_referral_id_unique 
    ON public.profiles (referral_id) 
    WHERE referral_id IS NOT NULL;
  END IF;
END$$;