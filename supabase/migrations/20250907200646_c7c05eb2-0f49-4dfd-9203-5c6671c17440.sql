-- Create helper to check CPF existence before signup
CREATE OR REPLACE FUNCTION public.cpf_exists(cpf_input text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE cpf = cpf_input
  );
$$;

-- Ensure clients can execute it
GRANT EXECUTE ON FUNCTION public.cpf_exists(text) TO anon, authenticated, service_role;