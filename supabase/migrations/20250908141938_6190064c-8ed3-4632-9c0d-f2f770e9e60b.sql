-- Add referral system columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_id TEXT UNIQUE,
ADD COLUMN referrer_id TEXT;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_user_id UUID NOT NULL,
  referred_cpf TEXT NOT NULL,
  bonus_paid BOOLEAN DEFAULT FALSE,
  deposit_made BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals table
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (referrer_id IN (SELECT referral_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "System can manage referrals" 
ON public.referrals 
FOR ALL 
USING (true);

-- Create function to generate referral ID from CPF
CREATE OR REPLACE FUNCTION public.generate_referral_id(cpf_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_cpf TEXT;
  referral_id TEXT;
BEGIN
  -- Remove non-numeric characters
  clean_cpf := regexp_replace(cpf_input, '\D', '', 'g');
  
  -- Generate referral ID: first 3 + last 3 digits
  IF length(clean_cpf) = 11 THEN
    referral_id := substring(clean_cpf, 1, 3) || substring(clean_cpf, 9, 3);
    RETURN referral_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create function to update referral_id when CPF is added/updated
CREATE OR REPLACE FUNCTION public.update_referral_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    NEW.referral_id := public.generate_referral_id(NEW.cpf);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically generate referral_id
CREATE TRIGGER update_profiles_referral_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_id();

-- Create function to handle referral bonus
CREATE OR REPLACE FUNCTION public.process_referral_bonus(referred_user_id UUID, deposit_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_user_id UUID;
  referral_record RECORD;
BEGIN
  -- Check if this user was referred and bonus hasn't been paid
  SELECT * INTO referral_record
  FROM public.referrals 
  WHERE referred_user_id = referred_user_id 
    AND bonus_paid = FALSE 
    AND deposit_made = FALSE;
  
  IF FOUND AND deposit_amount >= 20 THEN
    -- Find the referrer user ID
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
$$;