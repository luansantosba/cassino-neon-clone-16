-- Create admin user credentials
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admgeral@gmail.com',
  crypt('admgeral', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;