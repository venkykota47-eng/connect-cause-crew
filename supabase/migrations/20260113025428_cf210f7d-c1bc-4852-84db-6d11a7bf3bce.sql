-- Create a view that only exposes non-sensitive profile fields
-- Using security_invoker = true so RLS policies of the underlying table apply
CREATE OR REPLACE VIEW public.safe_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  role,
  full_name,
  avatar_url,
  bio,
  location,
  skills,
  availability,
  organization_name,
  website,
  mission,
  experience_years,
  founded_year,
  team_size,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.safe_profiles TO authenticated;

COMMENT ON VIEW public.safe_profiles IS 'Public view of profiles excluding sensitive fields (email, phone)';