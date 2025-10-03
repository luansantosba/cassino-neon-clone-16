-- Create unique index for referral codes if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_id_unique
ON public.profiles (referral_id) WHERE referral_id IS NOT NULL;

-- Function to generate unique bdc referral code
CREATE OR REPLACE FUNCTION public.generate_bdc_referral_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  candidate text;
  tries int := 0;
BEGIN
  LOOP
    candidate := 'bdc' || lpad((floor(random()*1000)::int)::text, 3, '0');
    PERFORM 1 FROM public.profiles WHERE referral_id = candidate;
    IF NOT FOUND THEN
      RETURN candidate;
    END IF;
    tries := tries + 1;
    IF tries > 2000 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
END;
$$;

-- Trigger to set default referral code on insert
CREATE OR REPLACE FUNCTION public.set_default_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referral_id IS NULL OR length(NEW.referral_id) = 0 THEN
    NEW.referral_id := public.generate_bdc_referral_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_default_referral_code ON public.profiles;
CREATE TRIGGER trg_set_default_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_default_referral_code();

-- Backfill missing referral codes
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_id IS NULL OR length(referral_id) = 0 LOOP
    UPDATE public.profiles SET referral_id = public.generate_bdc_referral_id() WHERE id = r.id;
  END LOOP;
END$$;

-- Attach trigger to create profiles and credentials on new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

-- Update referral bonus logic to accumulate deposits (keep original signature)
CREATE OR REPLACE FUNCTION public.process_referral_bonus(referred_user_id uuid, deposit_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  referral_record RECORD;
  total_confirmed numeric := 0;
  referrer_user_id uuid;
BEGIN
  -- Find referral record for this user (not yet paid)
  SELECT * INTO referral_record
  FROM public.referrals 
  WHERE referred_user_id = referred_user_id 
    AND bonus_paid = FALSE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Sum all confirmed deposits for the referred user
  SELECT COALESCE(SUM(amount), 0) INTO total_confirmed
  FROM public.deposits
  WHERE user_id = referred_user_id AND status = 'confirmed';
  
  IF total_confirmed >= 20 THEN
    -- Find the referrer by referral code
    SELECT id INTO referrer_user_id
    FROM public.profiles 
    WHERE referral_id = referral_record.referrer_id;
    
    IF FOUND THEN
      -- Add bonus to referrer
      UPDATE public.profiles 
      SET balance = COALESCE(balance, 0) + 10,
          updated_at = NOW()
      WHERE id = referrer_user_id;
      
      -- Mark referral as processed
      UPDATE public.referrals 
      SET bonus_paid = TRUE,
          deposit_made = TRUE,
          updated_at = NOW()
      WHERE id = referral_record.id;
    END IF;
  END IF;
END;
$function$;