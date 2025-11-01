-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  partner_email TEXT,
  partner_commission NUMERIC DEFAULT 0,
  game_restriction TEXT,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  minimum_deposit NUMERIC DEFAULT 0,
  requires_deposit BOOLEAN DEFAULT true,
  bonus_amount NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create coupon_usage table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- Create user_coupon_rollover table to track rollover requirements
CREATE TABLE IF NOT EXISTS public.user_coupon_rollover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coupon_code TEXT NOT NULL,
  required_rollover NUMERIC NOT NULL,
  current_rollover NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupon_rollover ENABLE ROW LEVEL SECURITY;

-- Policies for coupons
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Service role can manage coupons"
  ON public.coupons FOR ALL
  USING (true);

-- Policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage"
  ON public.coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage coupon usage"
  ON public.coupon_usage FOR ALL
  USING (true);

-- Policies for user_coupon_rollover
CREATE POLICY "Users can view their own rollover"
  ON public.user_coupon_rollover FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rollover"
  ON public.user_coupon_rollover FOR ALL
  USING (true);

-- Function to check if user can use coupon
CREATE OR REPLACE FUNCTION public.can_use_coupon(p_user_id UUID, p_coupon_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_already_used BOOLEAN;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(p_coupon_code)
    AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_use', false, 'reason', 'Cupom não encontrado ou inativo');
  END IF;

  -- Check if expired
  IF v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object('can_use', false, 'reason', 'Este cupom expirou!');
  END IF;

  -- Check if already used
  SELECT EXISTS(
    SELECT 1 FROM public.coupon_usage
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN jsonb_build_object('can_use', false, 'reason', 'Você já utilizou este cupom!');
  END IF;

  RETURN jsonb_build_object(
    'can_use', true,
    'coupon_id', v_coupon.id,
    'bonus_amount', v_coupon.bonus_amount,
    'requires_deposit', v_coupon.requires_deposit,
    'minimum_deposit', v_coupon.minimum_deposit,
    'game_restriction', v_coupon.game_restriction,
    'partner_email', v_coupon.partner_email,
    'partner_commission', v_coupon.partner_commission
  );
END;
$$;

-- Function to apply coupon
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_user_id UUID,
  p_coupon_code TEXT,
  p_deposit_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_check JSONB;
  v_coupon_id UUID;
  v_bonus_amount NUMERIC;
  v_requires_deposit BOOLEAN;
  v_minimum_deposit NUMERIC;
  v_partner_email TEXT;
  v_partner_commission NUMERIC;
  v_partner_user_id UUID;
BEGIN
  -- Check if can use
  v_check := public.can_use_coupon(p_user_id, p_coupon_code);
  
  IF NOT (v_check->>'can_use')::boolean THEN
    RETURN jsonb_build_object('success', false, 'message', v_check->>'reason');
  END IF;

  v_coupon_id := (v_check->>'coupon_id')::UUID;
  v_bonus_amount := (v_check->>'bonus_amount')::NUMERIC;
  v_requires_deposit := (v_check->>'requires_deposit')::BOOLEAN;
  v_minimum_deposit := (v_check->>'minimum_deposit')::NUMERIC;
  v_partner_email := v_check->>'partner_email';
  v_partner_commission := (v_check->>'partner_commission')::NUMERIC;

  -- If requires deposit, check if deposit was made
  IF v_requires_deposit THEN
    IF p_deposit_amount < v_minimum_deposit THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Depósito mínimo de R$ ' || v_minimum_deposit || ' necessário'
      );
    END IF;
  END IF;

  -- Mark as used
  INSERT INTO public.coupon_usage (coupon_id, user_id)
  VALUES (v_coupon_id, p_user_id);

  -- Add bonus to user balance
  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + v_bonus_amount,
      updated_at = now()
  WHERE id = p_user_id;

  -- Create rollover requirement (1x bonus amount)
  INSERT INTO public.user_coupon_rollover (user_id, coupon_code, required_rollover, current_rollover)
  VALUES (p_user_id, p_coupon_code, v_bonus_amount, 0);

  -- If has partner and deposit was made, pay commission
  IF v_partner_email IS NOT NULL AND v_requires_deposit AND p_deposit_amount >= v_minimum_deposit AND v_partner_commission > 0 THEN
    -- Find partner by email
    SELECT id INTO v_partner_user_id
    FROM public.profiles
    WHERE email = v_partner_email;

    IF v_partner_user_id IS NOT NULL THEN
      -- Add commission to partner
      UPDATE public.profiles
      SET balance = COALESCE(balance, 0) + v_partner_commission,
          updated_at = now()
      WHERE id = v_partner_user_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cupom aplicado com sucesso! R$ ' || v_bonus_amount || ' creditado.',
    'bonus_amount', v_bonus_amount
  );
END;
$$;