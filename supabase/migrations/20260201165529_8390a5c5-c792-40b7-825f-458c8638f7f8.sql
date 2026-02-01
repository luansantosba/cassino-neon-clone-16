-- Create table for global Double-X game rounds (persistent for all users)
CREATE TABLE public.double_x_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number SERIAL,
  result INTEGER NOT NULL CHECK (result >= 0 AND result <= 14),
  multipliers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.double_x_rounds ENABLE ROW LEVEL SECURITY;

-- Everyone can read rounds (global history)
CREATE POLICY "Anyone can view game rounds"
  ON public.double_x_rounds
  FOR SELECT
  USING (true);

-- Create table for current game state (singleton)
CREATE TABLE public.double_x_game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_phase TEXT NOT NULL DEFAULT 'betting' CHECK (current_phase IN ('betting', 'spinning', 'result')),
  phase_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 seconds'),
  current_result INTEGER DEFAULT NULL,
  current_multipliers JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.double_x_game_state ENABLE ROW LEVEL SECURITY;

-- Everyone can read game state
CREATE POLICY "Anyone can view game state"
  ON public.double_x_game_state
  FOR SELECT
  USING (true);

-- Insert initial state
INSERT INTO public.double_x_game_state (id, current_phase, phase_ends_at) 
VALUES (1, 'betting', now() + interval '15 seconds');

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.double_x_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.double_x_game_state;