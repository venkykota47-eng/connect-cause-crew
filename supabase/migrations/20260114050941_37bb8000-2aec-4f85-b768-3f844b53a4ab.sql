-- Drop the existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view NGO profiles" ON profiles;
DROP POLICY IF EXISTS "NGOs can view volunteer profiles who applied to their opportuni" ON profiles;

-- The existing "Users can view their own full profile" policy stays - it allows users to see their own email/phone
-- The safe_profiles view already exists and excludes email/phone, so authenticated users should use that view

-- Grant SELECT on safe_profiles to authenticated users (view inherits from table permissions)
-- The view is already created, we just need to ensure proper access

-- Create a comment to document the security model
COMMENT ON VIEW safe_profiles IS 'Public profile view that excludes sensitive fields (email, phone). Use this view for displaying profiles to other users. The base profiles table should only be queried by users viewing their own profile.';