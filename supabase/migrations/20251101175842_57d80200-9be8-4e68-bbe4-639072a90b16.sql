-- Update apply_coupon function to return custom message and game restriction
CREATE OR REPLACE FUNCTION public.apply_coupon(p_user_id uuid, p_coupon_code text, p_deposit_amount numeric DEFAULT 0)
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

  -- Build success message
  DECLARE
    v_success_message TEXT;
    v_game_name TEXT;
  BEGIN
    IF v_custom_message IS NOT NULL AND v_custom_message != '' THEN
      v_success_message := v_custom_message;
    ELSE
      v_game_name := COALESCE(v_game_restriction, 'qualquer jogo');
      v_success_message := 'Parabéns! Você ganhou R$ ' || v_bonus_amount || ' de saldo grátis para jogar ' || v_game_name || '!';
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'message', v_success_message,
      'bonus_amount', v_bonus_amount,
      'game_restriction', v_game_restriction
    );
  END;
END;
$$;

-- Update can_use_coupon to return custom_message
CREATE OR REPLACE FUNCTION public.can_use_coupon(p_user_id uuid, p_coupon_code text)
RETURNS jsonb
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
    'partner_commission', v_coupon.partner_commission,
    'custom_message', v_coupon.custom_message
  );
END;
$$;