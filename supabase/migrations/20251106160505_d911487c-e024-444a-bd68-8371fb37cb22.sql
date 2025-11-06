-- Remove bonus locking - all bonus balance should be playable
-- Update apply_coupon_bonus function to never lock bonus
CREATE OR REPLACE FUNCTION public.apply_coupon_bonus(
  p_user_id uuid,
  p_coupon_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_amount numeric;
  v_requires_deposit boolean;
  v_minimum_deposit numeric;
  v_game_restriction text;
BEGIN
  -- Get coupon details
  SELECT bonus_amount, requires_deposit, minimum_deposit, game_restriction
  INTO v_bonus_amount, v_requires_deposit, v_minimum_deposit, v_game_restriction
  FROM public.coupons
  WHERE id = p_coupon_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupom inválido ou inativo';
  END IF;

  -- Record coupon usage
  INSERT INTO public.coupon_usage (coupon_id, user_id)
  VALUES (p_coupon_id, p_user_id);

  -- Add bonus to profile - NEVER LOCK IT
  UPDATE public.profiles
  SET bonus_balance = COALESCE(bonus_balance, 0) + v_bonus_amount,
      bonus_game_restriction = NULL,
      bonus_locked = false,
      updated_at = now()
  WHERE id = p_user_id;

  -- Don't create rollover requirement
  -- Bonus is free to use but games require minimum deposit

  RETURN;
END;
$$;

-- Update unlock function to just set bonus_locked to false if needed
CREATE OR REPLACE FUNCTION public.unlock_bonus_after_deposit(
  p_user_id uuid,
  p_deposit_amount numeric
)
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
    AND c.partner_email IS NOT NULL
    ORDER BY cu.used_at DESC
    LIMIT 1;

    -- Unlock the bonus
    UPDATE public.profiles
    SET bonus_locked = false,
        updated_at = now()
    WHERE id = p_user_id;

    -- Pay partner commission if applicable
    IF v_partner_email IS NOT NULL AND v_partner_email <> '' AND v_partner_commission > 0 THEN
      -- Find partner user by email
      SELECT uc.user_id INTO v_partner_user_id
      FROM public.user_credentials uc
      WHERE uc.email = v_partner_email
      LIMIT 1;

      IF v_partner_user_id IS NOT NULL THEN
        -- Add commission to partner's balance
        UPDATE public.profiles
        SET balance = COALESCE(balance, 0) + v_partner_commission,
            updated_at = now()
        WHERE id = v_partner_user_id;
      END IF;
    END IF;
  END IF;

  RETURN;
END;
$$;