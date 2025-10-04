-- Fix search_path for all functions
CREATE OR REPLACE FUNCTION public.generate_bdc_referral_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.set_default_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_id IS NULL OR length(NEW.referral_id) = 0 THEN
    NEW.referral_id := public.generate_bdc_referral_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_referral_bonus(p_referred_user_id uuid, p_deposit_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  referral_record RECORD;
  total_confirmed numeric := 0;
  referrer_user_id uuid;
BEGIN
  SELECT * INTO referral_record
  FROM public.referrals 
  WHERE referred_user_id = p_referred_user_id 
    AND bonus_paid = FALSE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total_confirmed
  FROM public.deposits
  WHERE user_id = p_referred_user_id AND status = 'confirmed';
  
  IF total_confirmed >= 20 THEN
    SELECT id INTO referrer_user_id
    FROM public.profiles 
    WHERE referral_id = referral_record.referrer_id;
    
    IF FOUND THEN
      UPDATE public.profiles 
      SET balance = COALESCE(balance, 0) + 10,
          updated_at = NOW()
      WHERE id = referrer_user_id;
      
      UPDATE public.referrals 
      SET bonus_paid = TRUE,
          deposit_made = TRUE,
          updated_at = NOW()
      WHERE id = referral_record.id;
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_balance(user_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, balance)
  VALUES (user_id, amount)
  ON CONFLICT (id)
  DO UPDATE SET 
    balance = profiles.balance + amount,
    updated_at = NOW();
END;
$function$;