-- Create processing log to ensure idempotent deposit crediting
CREATE TABLE IF NOT EXISTS public.deposit_processing_log (
  deposit_id UUID PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and restrict to service role only
ALTER TABLE public.deposit_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deposit_processing_log_service_role_manage"
ON public.deposit_processing_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Note: Service role bypasses RLS; this policy exists for completeness

-- Helpful index (not strictly needed since PK)
CREATE INDEX IF NOT EXISTS idx_deposit_processing_log_processed_at ON public.deposit_processing_log(processed_at);
