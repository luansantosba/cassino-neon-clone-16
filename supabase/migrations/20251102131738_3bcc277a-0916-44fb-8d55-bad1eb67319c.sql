-- Add columns to track bonus balance and game restrictions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bonus_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_game_restriction text,
ADD COLUMN IF NOT EXISTS bonus_locked boolean DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_bonus_locked ON public.profiles(bonus_locked);

-- Update user_coupon_rollover to track game restriction
ALTER TABLE public.user_coupon_rollover
ADD COLUMN IF NOT EXISTS game_restriction text;

-- Create a function to update apply_coupon to handle game restrictions and locked bonuses
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_user_id uuid,
  p_coupon_code text,
  p_deposit_amount numeric DEFAULT 0
)
RETURNS jsonb
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
  v_custom_message TEXT;
  v_game_restriction TEXT;
  v_success_message TEXT;
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
  v_custom_message := v_check->>'custom_message';
  v_game_restriction := v_check->>'game_restriction';

  -- Mark as used
  INSERT INTO public.coupon_usage (coupon_id, user_id)
  VALUES (v_coupon_id, p_user_id);

  -- If requires deposit, add to bonus_balance (locked) and wait for deposit
  IF v_requires_deposit THEN
    -- Add to bonus balance but keep it locked
    UPDATE public.profiles
    SET bonus_balance = COALESCE(bonus_balance, 0) + v_bonus_amount,
        bonus_game_restriction = v_game_restriction,
        bonus_locked = true,
        updated_at = now()
    WHERE id = p_user_id;

    -- Create rollover requirement
    INSERT INTO public.user_coupon_rollover (
      user_id, 
      coupon_code, 
      required_rollover, 
      current_rollover,
      game_restriction
    )
    VALUES (p_user_id, p_coupon_code, v_bonus_amount, 0, v_game_restriction);

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Bônus de R$ ' || v_bonus_amount || ' adicionado! Faça um depósito de R$ ' || v_minimum_deposit || ' para ativar.',
      'bonus_amount', v_bonus_amount,
      'game_restriction', v_game_restriction,
      'requires_deposit', true,
      'minimum_deposit', v_minimum_deposit
    );
  END IF;

  -- If no deposit required, add to bonus balance directly (but locked until rollover)
  UPDATE public.profiles
  SET bonus_balance = COALESCE(bonus_balance, 0) + v_bonus_amount,
      bonus_game_restriction = v_game_restriction,
      bonus_locked = false,
      updated_at = now()
  WHERE id = p_user_id;

  -- Create rollover requirement
  INSERT INTO public.user_coupon_rollover (
    user_id, 
    coupon_code, 
    required_rollover, 
    current_rollover,
    game_restriction
  )
  VALUES (p_user_id, p_coupon_code, v_bonus_amount, 0, v_game_restriction);

  -- If has partner, pay commission immediately (only if no deposit required)
  IF v_partner_email IS NOT NULL AND NOT v_requires_deposit AND v_partner_commission > 0 THEN
    SELECT id INTO v_partner_user_id
    FROM public.profiles
    WHERE email = v_partner_email;

    IF v_partner_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET balance = COALESCE(balance, 0) + v_partner_commission,
          updated_at = now()
      WHERE id = v_partner_user_id;
    END IF;
  END IF;

  -- Build success message
  IF v_custom_message IS NOT NULL AND v_custom_message != '' THEN
    v_success_message := v_custom_message;
  ELSE
    v_success_message := 'Parabéns! Você ganhou R$ ' || v_bonus_amount || ' de saldo grátis' || 
      CASE 
        WHEN v_game_restriction IS NOT NULL THEN ' para jogar ' || v_game_restriction || '!'
        ELSE ' para jogar em qualquer jogo!'
      END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', v_success_message,
    'bonus_amount', v_bonus_amount,
    'game_restriction', v_game_restriction,
    'requires_deposit', false
  );
END;
$$;

-- Function to unlock bonus after deposit
CREATE OR REPLACE FUNCTION public.unlock_bonus_after_deposit(p_user_id uuid, p_deposit_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_locked boolean;
  v_partner_email text;
  v_partner_commission numeric;
  v_partner_user_id uuid;
  v_coupon_code text;
BEGIN
  -- Check if user has locked bonus
  SELECT bonus_locked INTO v_bonus_locked
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_bonus_locked THEN
    -- Get partner info from most recent coupon usage
    SELECT c.partner_email, c.partner_commission, cu.coupon_id
    INTO v_partner_email, v_partner_commission, v_coupon_code
    FROM public.coupon_usage cu
    JOIN public.coupons c ON c.id = cu.coupon_id
    WHERE cu.user_id = p_user_id
      AND c.requires_deposit = true
      AND c.minimum_deposit <= p_deposit_amount
    ORDER BY cu.used_at DESC
    LIMIT 1;

    -- Unlock the bonus
    UPDATE public.profiles
    SET bonus_locked = false,
        updated_at = now()
    WHERE id = p_user_id;

    -- Pay partner commission if applicable
    IF v_partner_email IS NOT NULL AND v_partner_commission > 0 THEN
      SELECT id INTO v_partner_user_id
      FROM public.profiles
      WHERE email = v_partner_email;

      IF v_partner_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET balance = COALESCE(balance, 0) + v_partner_commission,
            updated_at = now()
        WHERE id = v_partner_user_id;
      END IF;
    END IF;
  END IF;
END;
$$;