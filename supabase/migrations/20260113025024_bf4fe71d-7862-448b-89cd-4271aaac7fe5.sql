-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Keep the policy for users to view their own full profile
-- (already exists: "Users can view their own full profile")

-- Create a new policy that allows viewing only public fields of other profiles
-- We'll use a security definer function to control which fields are exposed

-- First, create or replace a function to get safe public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_fields(profile_row public.profiles)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return only non-sensitive fields
  RETURN jsonb_build_object(
    'id', profile_row.id,
    'full_name', profile_row.full_name,
    'avatar_url', profile_row.avatar_url,
    'bio', profile_row.bio,
    'location', profile_row.location,
    'skills', profile_row.skills,
    'role', profile_row.role,
    'organization_name', profile_row.organization_name,
    'mission', profile_row.mission,
    'website', profile_row.website,
    'availability', profile_row.availability,
    'experience_years', profile_row.experience_years,
    'founded_year', profile_row.founded_year,
    'team_size', profile_row.team_size
  );
END;
$$;

-- Create a policy that allows authenticated users to view all profiles 
-- but the application code should use the get_public_profile_fields function for other users' data
-- For now, we create a view-based approach

-- Allow authenticated users to SELECT profiles but only for specific use cases
-- Option: Create a policy that allows viewing profiles that are:
-- 1. Their own profile (full access)
-- 2. NGO profiles (for volunteers to see organization info)
-- 3. Volunteer profiles where the viewer is an NGO that received an application from them

CREATE POLICY "Users can view NGO profiles"
ON public.profiles
FOR SELECT
USING (
  role = 'ngo'::user_role
);

CREATE POLICY "NGOs can view volunteer profiles who applied to their opportunities"
ON public.profiles
FOR SELECT
USING (
  role = 'volunteer'::user_role
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    JOIN profiles ngo_profile ON o.ngo_id = ngo_profile.id
    WHERE a.volunteer_id = profiles.id
    AND ngo_profile.user_id = auth.uid()
  )
);

-- Create a secure view for public profile data that hides sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  location,
  skills,
  role,
  organization_name,
  mission,
  website,
  availability,
  experience_years,
  founded_year,
  team_size,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;