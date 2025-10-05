-- Ensure unique referral ids and default generation to bdc### format
-- 1) Unique index on referral_id
create unique index if not exists uniq_profiles_referral_id on public.profiles (referral_id);

-- 2) Trigger to auto-set referral_id on insert/update if missing
drop trigger if exists set_default_referral_code_on_insupd on public.profiles;
create trigger set_default_referral_code_on_insupd
before insert or update on public.profiles
for each row
execute function public.set_default_referral_code();

-- 3) Backfill existing profiles to new format bdcXXX
update public.profiles
set referral_id = public.generate_bdc_referral_id()
where referral_id is null OR referral_id !~ '^bdc[0-9]{3}$';