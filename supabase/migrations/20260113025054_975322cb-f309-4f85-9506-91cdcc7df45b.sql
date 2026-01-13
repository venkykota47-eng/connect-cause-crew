-- Drop the security definer view (it's causing security linter warnings)
DROP VIEW IF EXISTS public.public_profiles;

-- Instead, we'll rely on the RLS policies and update the application code
-- to only query the fields it needs when viewing other users' profiles

-- The current policies are:
-- 1. "Users can view their own full profile" - users see their own data
-- 2. "Users can view NGO profiles" - NGO profiles are visible (they're organizations, not individuals)
-- 3. "NGOs can view volunteer profiles who applied to their opportunities" - limited volunteer visibility

-- This approach protects volunteer contact info while allowing necessary functionality