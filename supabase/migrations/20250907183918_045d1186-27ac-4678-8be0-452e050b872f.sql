-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Create unique index on email and cpf for better performance
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_idx ON public.profiles(cpf);

-- Add INSERT policy for profiles (users can create their own profile)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);